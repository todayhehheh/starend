-- ============================================================
-- 08: 초대 링크 시스템
-- ============================================================

create table public.invites (
  id         uuid primary key default gen_random_uuid(),
  token      uuid unique not null default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete cascade not null,
  used_at    timestamptz,
  created_at timestamptz default now() not null
);

alter table public.invites enable row level security;

-- 매니저: 모든 작업 가능
create policy "invites_manager_all" on public.invites
  for all to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  );

-- 비인증 포함 누구나 토큰으로 조회 가능 (초대 수락 검증용)
create policy "invites_public_select" on public.invites
  for select using (true);

-- 초대 사용 처리 함수 (security definer로 RLS 우회)
create or replace function public.use_invite(p_token uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  update public.invites
  set used_at = now()
  where token = p_token and used_at is null;
  return found;
end;
$$;
