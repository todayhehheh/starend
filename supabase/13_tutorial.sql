ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutorial_step INT NOT NULL DEFAULT 0;
-- 0 = 인트로 미시청, 1 = 인트로 완료
