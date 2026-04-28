-- 비밀글: 나와 관리자만 볼 수 있는 글
ALTER TABLE mission_logs ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- 격리: 다른 참여자 피드 차단, 관리자 피드만 볼 수 있음
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_isolated BOOLEAN NOT NULL DEFAULT false;
