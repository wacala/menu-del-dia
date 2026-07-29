/* eslint-disable */
/**
 * Seeds test member accounts for development/testing.
 * Usage: NODE_ENV=production DATABASE_URL=... node scripts/seed-members.js
 */
const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

const PASSWORD = 'test123456';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 10);

const members = [
  { firstName: 'Walter', lastName: 'Cala', username: 'walter', email: 'walter@test.com' },
  { firstName: 'Lucía', lastName: 'Mendoza', username: 'lucia_m', email: 'lucia@test.com' },
  { firstName: 'Roberto', lastName: 'Juárez', username: 'roberto_j', email: 'roberto@test.com' },
  { firstName: 'Carmen', lastName: 'Luna', username: 'carmen_l', email: 'carmen@test.com' },
  { firstName: 'Fernando', lastName: 'Paredes', username: 'fer_paredes', email: 'fer@test.com' },
];

async function seed() {
  try {
    console.log('🌱 Seeding member accounts...\n');

    for (const member of members) {
      // Create user with email pre-verified
      const userResult = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, username, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, 'member', TRUE)
         ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
         RETURNING id`,
        [member.email, PASSWORD_HASH, member.firstName, member.lastName, member.username],
      );

      // Create member profile
      await db.query(
        `INSERT INTO member_profiles (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [userResult.rows[0].id],
      );

      console.log(`  ✅ ${member.firstName} ${member.lastName} (@${member.username}) — ${member.email}`);
    }

    console.log(`\n🎉 Seed complete! ${members.length} members created`);
    console.log(`   Password for all: ${PASSWORD}`);
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    await db.pool.end();
    process.exit(1);
  }
}

seed();
