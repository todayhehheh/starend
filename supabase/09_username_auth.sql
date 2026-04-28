-- ============================================================
-- 09: 아이디/비번 로그인 시스템
-- ============================================================

-- 참여자 로그인 정보 (username ↔ Supabase auth email 매핑)
create table public.participant_logins (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  username   text unique not null,
  auth_email text unique not null, -- 내부용 이메일 (star.app 도메인)
  created_at timestamptz default now() not null
);

alter table public.participant_logins enable row level security;

-- 누구나 username→auth_email 조회 가능 (로그인 시 필요)
create policy "logins_public_select" on public.participant_logins
  for select using (true);

-- 매니저만 생성/수정/삭제
create policy "logins_manager_write" on public.participant_logins
  for all to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  );
