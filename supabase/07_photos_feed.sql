-- ============================================================
-- 07: 사진 인증 + 피드
-- ============================================================

-- ─── mission_logs에 photo_url 추가 ──────────────────────────
alter table public.mission_logs
  add column if not exists photo_url text default null;

-- content 빈 값 허용 (사진만으로도 인증 가능)
alter table public.mission_logs
  alter column content set default '';

-- ─── Supabase Storage 버킷 생성 ──────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mission-photos',
  'mission-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Storage RLS
drop policy if exists "mission_photos_read"   on storage.objects;
drop policy if exists "mission_photos_insert" on storage.objects;

create policy "mission_photos_read"
  on storage.objects for select
  using (bucket_id = 'mission-photos');

create policy "mission_photos_insert"
  on storage.objects for insert
  with check (bucket_id = 'mission-photos' and auth.role() = 'authenticated');

-- ─── 미션 축소: 쉬움 3개, 보통 2개, 어려움 1개만 활성 유지 ───
update public.missions
set is_active = false
where id in (
  select id from (
    select id,
      row_number() over (partition by difficulty order by created_at) as rn,
      difficulty
    from public.missions
    where is_active = true and assigned_to is null
  ) ranked
  where (difficulty = 'easy'   and rn > 3)
     or (difficulty = 'medium' and rn > 2)
     or (difficulty = 'hard'   and rn > 1)
);
