-- ============================================================
-- 잘먹고 잘살기 — 스키마 마이그레이션
-- Supabase SQL Editor에서 순서대로 실행하세요
-- ============================================================

-- ─── 확장 ────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────
-- auth.users 와 1:1 연결되는 공개 프로필
create table public.profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  nickname  text        not null,
  role      text        not null default 'participant'
              check (role in ('participant', 'manager')),
  coins     integer     not null default 0 check (coins >= 0),
  created_at timestamptz not null default now()
);

-- ─── pets ─────────────────────────────────────────────────────
-- 유저 1명당 다마고치 1마리
create table public.pets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles(id) on delete cascade,
  name          text not null default '내 다마고치',
  stage         smallint not null default 1 check (stage in (1, 2, 3)),
  hunger        integer  not null default 80 check (hunger between 0 and 100),
  happiness     integer  not null default 80 check (happiness between 0 and 100),
  cleanliness   integer  not null default 80 check (cleanliness between 0 and 100),
  total_coins_spent integer not null default 0 check (total_coins_spent >= 0),
  last_fed_at     timestamptz,
  last_played_at  timestamptz,
  last_cleaned_at timestamptz,
  updated_at    timestamptz not null default now()
);

-- ─── missions ─────────────────────────────────────────────────
create table public.missions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  difficulty  text not null check (difficulty in ('easy', 'medium', 'hard')),
  coins       integer not null check (coins > 0),
  emoji       text not null,
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id) on delete set null, -- null = 기본 미션
  created_at  timestamptz not null default now()
);

-- ─── mission_logs ─────────────────────────────────────────────
create table public.mission_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  mission_id   uuid not null references public.missions(id) on delete cascade,
  content      text not null,
  emoji        text not null default '✅',
  coins_earned integer not null check (coins_earned >= 0),
  created_at   timestamptz not null default now()
);

-- 하루 1회 제한: 같은 유저가 같은 미션을 같은 날 중복 수행 불가 (UTC 기준)
create unique index mission_logs_daily_uniq
  on public.mission_logs (user_id, mission_id, ((created_at at time zone 'UTC')::date));

-- ─── reactions ────────────────────────────────────────────────
create table public.reactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  mission_log_id  uuid not null references public.mission_logs(id) on delete cascade,
  type            text not null check (type in ('like', 'cheer')),
  created_at      timestamptz not null default now(),
  unique (user_id, mission_log_id, type)
);

-- ─── shop_items ───────────────────────────────────────────────
create table public.shop_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null,
  emoji       text not null,
  type        text not null check (type in ('food', 'toy', 'bath')),
  price       integer not null check (price > 0),
  stat_value  integer not null check (stat_value > 0), -- 스탯 회복량
  is_active   boolean not null default true
);

-- ─── purchase_logs ────────────────────────────────────────────
create table public.purchase_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  item_id     uuid not null references public.shop_items(id) on delete cascade,
  coins_spent integer not null check (coins_spent > 0),
  created_at  timestamptz not null default now()
);

-- ─── 인덱스 ──────────────────────────────────────────────────
create index on public.mission_logs (user_id, created_at desc);
create index on public.mission_logs (created_at desc);
create index on public.reactions (mission_log_id);
create index on public.purchase_logs (user_id, created_at desc);
