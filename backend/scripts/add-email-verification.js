const db = require('../src/config/database');

const sql = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS email_verifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
`;

async function migrate() {
  try {
    console.log('Adding email verification tables...');
    await db.query(sql);
    console.log('Done.');
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await db.pool.end();
    process.exit(1);
  }
}

migrate();
