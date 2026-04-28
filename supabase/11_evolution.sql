-- 미션에 승인 필요 여부 추가
ALTER TABLE missions ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;

-- 미션 로그에 관리자 승인 필드 추가
ALTER TABLE mission_logs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE mission_logs ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
