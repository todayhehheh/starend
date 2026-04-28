-- ============================================================
-- 10: 별 스탯 자동 감소 (pg_cron)
-- ============================================================
-- 실행 전 필수: Supabase 대시보드 → Database → Extensions → pg_cron 활성화
-- ============================================================

-- ─── 감소 함수 ────────────────────────────────────────────────
create or replace function public.decay_pet_stats()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.pets
  set
    hunger      = greatest(0, hunger      - 8),
    happiness   = greatest(0, happiness   - 8),
    cleanliness = greatest(0, cleanliness - 5)
  where exists (
    select 1 from public.profiles
    where id = pets.user_id and role = 'participant'
  );
end;
$$;

-- 수동 테스트용: select public.decay_pet_stats();

-- ─── 스케줄 등록 ──────────────────────────────────────────────
-- 매일 자정 KST = 15:00 UTC
do $$
begin
  -- 기존 스케줄이 있으면 먼저 제거 (idempotent)
  perform cron.unschedule('decay-pet-stats-daily');
exception when others then
  null; -- 없으면 무시
end;
$$;

select cron.schedule(
  'decay-pet-stats-daily',
  '0 15 * * *',
  $$select public.decay_pet_stats()$$
);
