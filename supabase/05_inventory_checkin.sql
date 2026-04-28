-- ============================================================
-- 05: 인벤토리 + 기분체크인 + RPC 업데이트
-- ============================================================

-- ─── 인벤토리 테이블 ──────────────────────────────────────────
create table if not exists public.inventory (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users on delete cascade not null,
  item_id    uuid        references public.shop_items on delete cascade not null,
  quantity   integer     default 0 not null check (quantity >= 0),
  updated_at timestamptz default now() not null,
  unique(user_id, item_id)
);

alter table public.inventory enable row level security;

create policy "inventory_own" on public.inventory
  for all using (user_id = auth.uid());

-- ─── 기분 체크인 테이블 ───────────────────────────────────────
create table if not exists public.mood_checkins (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users on delete cascade not null,
  mood       integer     not null check (mood between 1 and 5),
  created_at timestamptz default now() not null
);

alter table public.mood_checkins enable row level security;

create policy "mood_own" on public.mood_checkins
  for all using (user_id = auth.uid());

-- ─── buy_item 수정: 코인 차감 + 인벤토리 추가 ──────────────────
create or replace function public.buy_item(p_item_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_item      shop_items;
  v_pet       pets;
  v_profile   profiles;
  v_new_stage smallint;
begin
  select * into v_item from public.shop_items
  where id = p_item_id and is_active = true;
  if not found then
    return json_build_object('ok', false, 'error', '아이템을 찾을 수 없습니다');
  end if;

  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.coins < v_item.price then
    return json_build_object('ok', false, 'error', '코인이 부족합니다');
  end if;

  select * into v_pet from public.pets where user_id = auth.uid();
  if not found then
    return json_build_object('ok', false, 'error', '펫을 찾을 수 없습니다');
  end if;

  -- 코인 차감
  update public.profiles
  set coins = coins - v_item.price
  where id = auth.uid();

  -- total_coins_spent 누적 + 진화 확인
  v_new_stage := v_pet.stage;
  if (v_pet.total_coins_spent + v_item.price) >= 500 then
    v_new_stage := 3;
  elsif (v_pet.total_coins_spent + v_item.price) >= 200 then
    v_new_stage := greatest(v_new_stage, 2);
  end if;

  update public.pets
  set total_coins_spent = total_coins_spent + v_item.price,
      stage             = v_new_stage,
      updated_at        = now()
  where user_id = auth.uid();

  -- 인벤토리에 추가 (없으면 생성, 있으면 수량 +1)
  insert into public.inventory (user_id, item_id, quantity)
  values (auth.uid(), p_item_id, 1)
  on conflict (user_id, item_id) do update
    set quantity   = inventory.quantity + 1,
        updated_at = now();

  -- 구매 이력 기록
  insert into public.purchase_logs (user_id, item_id, coins_spent)
  values (auth.uid(), p_item_id, v_item.price);

  return json_build_object('ok', true, 'new_stage', v_new_stage, 'item_type', v_item.type);
end;
$$;

-- ─── use_care_item: 인벤토리 소비 + 펫 스탯 적용 ─────────────
create or replace function public.use_care_item(p_item_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_item     shop_items;
  v_pet      pets;
  v_qty      integer;
  v_new_stat integer;
begin
  select * into v_item from public.shop_items where id = p_item_id;
  if not found then
    return json_build_object('ok', false, 'error', '아이템을 찾을 수 없습니다');
  end if;

  select quantity into v_qty from public.inventory
  where user_id = auth.uid() and item_id = p_item_id;
  if v_qty is null or v_qty < 1 then
    return json_build_object('ok', false, 'error', '아이템이 없습니다');
  end if;

  select * into v_pet from public.pets where user_id = auth.uid();

  v_new_stat := least(100,
    case v_item.type
      when 'food' then v_pet.hunger      + v_item.stat_value
      when 'toy'  then v_pet.happiness   + v_item.stat_value
      when 'bath' then v_pet.cleanliness + v_item.stat_value
    end
  );

  update public.pets set
    hunger          = case when v_item.type = 'food' then v_new_stat else hunger end,
    happiness       = case when v_item.type = 'toy'  then v_new_stat else happiness end,
    cleanliness     = case when v_item.type = 'bath' then v_new_stat else cleanliness end,
    last_fed_at     = case when v_item.type = 'food' then now() else last_fed_at end,
    last_played_at  = case when v_item.type = 'toy'  then now() else last_played_at end,
    last_cleaned_at = case when v_item.type = 'bath' then now() else last_cleaned_at end,
    updated_at      = now()
  where user_id = auth.uid();

  update public.inventory
  set quantity   = quantity - 1,
      updated_at = now()
  where user_id = auth.uid() and item_id = p_item_id;

  return json_build_object('ok', true, 'new_stat', v_new_stat, 'item_type', v_item.type);
end;
$$;

-- ─── submit_mood_checkin: 하루 1회 기분 기록 + 코인 +5 ────────
create or replace function public.submit_mood_checkin(p_mood integer)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'UTC')::date;
  v_count integer;
begin
  if p_mood < 1 or p_mood > 5 then
    return json_build_object('ok', false, 'error', '잘못된 기분 값입니다');
  end if;

  select count(*) into v_count from public.mood_checkins
  where user_id = auth.uid()
    and (created_at at time zone 'UTC')::date = v_today;

  if v_count > 0 then
    return json_build_object('ok', false, 'error', '오늘 이미 체크인했어요');
  end if;

  insert into public.mood_checkins (user_id, mood)
  values (auth.uid(), p_mood);

  update public.profiles set coins = coins + 5 where id = auth.uid();

  return json_build_object('ok', true, 'coins_earned', 5);
end;
$$;
