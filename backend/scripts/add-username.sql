-- Add username column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30) UNIQUE;
-- Populate existing users with a username derived from email
UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;
-- Make it NOT NULL after populating
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);