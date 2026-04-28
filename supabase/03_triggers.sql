-- ============================================================
-- 트리거 & 함수
-- ============================================================

-- ─── 회원가입 시 프로필 + 펫 자동 생성 ───────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 프로필 생성 (닉네임 = 이메일 앞부분)
  insert into public.profiles (id, nickname, role, coins)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'role', 'participant'),
    0
  );

  -- 펫 생성 (초기 스탯 80)
  insert into public.pets (user_id, name, stage, hunger, happiness, cleanliness)
  values (new.id, '내 다마고치', 1, 80, 80, 80);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 미션 완료 시 코인 지급 ───────────────────────────────────
create or replace function public.handle_mission_completed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 코인 지급
  update public.profiles
  set coins = coins + new.coins_earned
  where id = new.user_id;

  return new;
end;
$$;

create trigger on_mission_log_created
  after insert on public.mission_logs
  for each row execute procedure public.handle_mission_completed();

-- ─── 상점 아이템 구매 처리 ────────────────────────────────────
-- 구매 시: 코인 차감 + 펫 스탯 회복 + total_coins_spent 누적
-- (RPC로 호출: buy_item(item_id uuid))
create or replace function public.buy_item(p_item_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_item        shop_items;
  v_pet         pets;
  v_profile     profiles;
  v_new_stat    integer;
  v_new_stage   smallint;
begin
  -- 아이템 조회
  select * into v_item from public.shop_items
  where id = p_item_id and is_active = true;
  if not found then
    return json_build_object('ok', false, 'error', '아이템을 찾을 수 없습니다');
  end if;

  -- 프로필 조회 (코인 확인)
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.coins < v_item.price then
    return json_build_object('ok', false, 'error', '코인이 부족합니다');
  end if;

  -- 펫 조회
  select * into v_pet from public.pets where user_id = auth.uid();
  if not found then
    return json_build_object('ok', false, 'error', '펫을 찾을 수 없습니다');
  end if;

  -- 스탯 회복 (최대 100)
  v_new_stat := least(100,
    case v_item.type
      when 'food' then v_pet.hunger      + v_item.stat_value
      when 'toy'  then v_pet.happiness   + v_item.stat_value
      when 'bath' then v_pet.cleanliness + v_item.stat_value
    end
  );

  -- 진화 조건: total_coins_spent 기준
  -- 1단계 → 2단계: 200코인, 2단계 → 3단계: 500코인
  v_new_stage := v_pet.stage;
  if (v_pet.total_coins_spent + v_item.price) >= 500 then
    v_new_stage := 3;
  elsif (v_pet.total_coins_spent + v_item.price) >= 200 then
    v_new_stage := greatest(v_new_stage, 2);
  end if;

  -- 펫 스탯 업데이트
  update public.pets set
    hunger        = case when v_item.type = 'food' then v_new_stat else hunger end,
    happiness     = case when v_item.type = 'toy'  then v_new_stat else happiness end,
    cleanliness   = case when v_item.type = 'bath' then v_new_stat else cleanliness end,
    stage         = v_new_stage,
    total_coins_spent = total_coins_spent + v_item.price,
    last_fed_at     = case when v_item.type = 'food' then now() else last_fed_at end,
    last_played_at  = case when v_item.type = 'toy'  then now() else last_played_at end,
    last_cleaned_at = case when v_item.type = 'bath' then now() else last_cleaned_at end,
    updated_at    = now()
  where user_id = auth.uid();

  -- 코인 차감
  update public.profiles
  set coins = coins - v_item.price
  where id = auth.uid();

  -- 구매 이력 기록
  insert into public.purchase_logs (user_id, item_id, coins_spent)
  values (auth.uid(), p_item_id, v_item.price);

  return json_build_object(
    'ok', true,
    'new_stat', v_new_stat,
    'new_stage', v_new_stage,
    'item_type', v_item.type
  );
end;
$$;

-- ─── 펫 스탯 감소 처리 (앱에서 주기적으로 호출) ──────────────
-- 마지막 업데이트 이후 경과 시간에 비례해 스탯 감소
-- decay rate: 시간당 배고픔 -3, 행복 -2, 청결 -1
create or replace function public.decay_pet_stats()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_pet       pets;
  v_hours     numeric;
  v_hunger    integer;
  v_happiness integer;
  v_clean     integer;
begin
  select * into v_pet from public.pets where user_id = auth.uid();
  if not found then
    return json_build_object('ok', false, 'error', '펫을 찾을 수 없습니다');
  end if;

  -- 경과 시간 (시간 단위)
  v_hours := extract(epoch from (now() - v_pet.updated_at)) / 3600.0;

  -- 최소 업데이트 간격 1분 미만이면 스킵
  if v_hours < (1.0 / 60.0) then
    return json_build_object('ok', true, 'skipped', true);
  end if;

  -- 감소량 계산 (최소 0)
  v_hunger    := greatest(0, v_pet.hunger      - floor(v_hours * 3)::integer);
  v_happiness := greatest(0, v_pet.happiness   - floor(v_hours * 2)::integer);
  v_clean     := greatest(0, v_pet.cleanliness - floor(v_hours * 1)::integer);

  update public.pets set
    hunger      = v_hunger,
    happiness   = v_happiness,
    cleanliness = v_clean,
    updated_at  = now()
  where user_id = auth.uid();

  return json_build_object(
    'ok', true,
    'hunger', v_hunger,
    'happiness', v_happiness,
    'cleanliness', v_clean
  );
end;
$$;
