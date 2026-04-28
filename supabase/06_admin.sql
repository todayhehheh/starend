-- ============================================================
-- 06: 관리자 기능 - 개인 미션 + RLS 업데이트
-- ============================================================

-- ─── missions 테이블 컬럼 추가 ───────────────────────────────
alter table public.missions
  add column if not exists assigned_to uuid references auth.users on delete set null default null,
  add column if not exists expires_at  timestamptz default null;

create index if not exists missions_assigned_to_idx on public.missions (assigned_to);

-- ─── missions RLS 업데이트 ────────────────────────────────────
-- 기존 read 정책 제거
drop policy if exists "missions: 인증 유저 활성 미션 조회" on public.missions;

-- 참여자: 공통(assigned_to IS NULL) + 자신에게 할당된 미션
-- 관리자: 전체 (비활성 포함)
create policy "missions: 조회"
  on public.missions for select
  to authenticated
  using (
    (
      is_active = true
      and (expires_at is null or expires_at > now())
      and (assigned_to is null or assigned_to = auth.uid())
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- 관리자: 미션 삭제 권한 추가
create policy "missions: manager만 삭제"
  on public.missions for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- ─── mood_checkins: 관리자 전체 조회 허용 ───────────────────
drop policy if exists "mood_own" on public.mood_checkins;

create policy "mood_checkins: 본인 전체"
  on public.mood_checkins for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "mood_checkins: manager 전체 조회"
  on public.mood_checkins for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- ─── inventory: 관리자 전체 조회 허용 ────────────────────────
drop policy if exists "inventory_own" on public.inventory;

create policy "inventory: 본인 전체"
  on public.inventory for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "inventory: manager 전체 조회"
  on public.inventory for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );
