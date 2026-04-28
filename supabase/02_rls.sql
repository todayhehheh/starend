-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- ─── RLS 활성화 ───────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.pets          enable row level security;
alter table public.missions      enable row level security;
alter table public.mission_logs  enable row level security;
alter table public.reactions     enable row level security;
alter table public.shop_items    enable row level security;
alter table public.purchase_logs enable row level security;

-- ─── profiles ────────────────────────────────────────────────
-- 모든 인증 유저가 프로필 조회 가능 (피드, 다마고치 구경용)
create policy "profiles: 인증 유저 전체 조회"
  on public.profiles for select
  to authenticated
  using (true);

-- 본인 프로필만 수정 가능
create policy "profiles: 본인만 수정"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── pets ─────────────────────────────────────────────────────
-- 모든 인증 유저가 펫 조회 가능 (피드에서 타인 펫 구경)
create policy "pets: 인증 유저 전체 조회"
  on public.pets for select
  to authenticated
  using (true);

-- 본인 펫만 수정 가능
create policy "pets: 본인만 수정"
  on public.pets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── missions ─────────────────────────────────────────────────
-- 인증 유저는 활성 미션 조회 가능
create policy "missions: 인증 유저 활성 미션 조회"
  on public.missions for select
  to authenticated
  using (is_active = true);

-- manager 역할만 미션 생성/수정 가능
create policy "missions: manager만 생성"
  on public.missions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

create policy "missions: manager만 수정"
  on public.missions for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- ─── mission_logs ─────────────────────────────────────────────
-- 모든 인증 유저가 미션 로그 조회 가능 (피드용)
create policy "mission_logs: 인증 유저 전체 조회"
  on public.mission_logs for select
  to authenticated
  using (true);

-- 본인 미션 로그만 생성 가능
create policy "mission_logs: 본인만 생성"
  on public.mission_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── reactions ────────────────────────────────────────────────
-- 모든 인증 유저가 리액션 조회 가능
create policy "reactions: 인증 유저 전체 조회"
  on public.reactions for select
  to authenticated
  using (true);

-- 본인 리액션만 생성/삭제 가능
create policy "reactions: 본인만 생성"
  on public.reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "reactions: 본인만 삭제"
  on public.reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── shop_items ───────────────────────────────────────────────
-- 인증 유저는 활성 상품 조회 가능
create policy "shop_items: 인증 유저 활성 상품 조회"
  on public.shop_items for select
  to authenticated
  using (is_active = true);

-- manager만 상품 관리 가능
create policy "shop_items: manager만 관리"
  on public.shop_items for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- ─── purchase_logs ────────────────────────────────────────────
-- 본인 구매 내역만 조회 가능 (manager는 전체 조회)
create policy "purchase_logs: 본인 조회"
  on public.purchase_logs for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- 본인 구매 기록만 생성 가능
create policy "purchase_logs: 본인만 생성"
  on public.purchase_logs for insert
  to authenticated
  with check (auth.uid() = user_id);
