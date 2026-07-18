/**
 * Clears all user-related data from the database.
 * USE WITH CAUTION — this is irreversible.
 * Usage: NODE_ENV=production DATABASE_URL=... node scripts/clear-users.js
 */
const db = require('../src/config/database');

async function clearUsers() {
  try {
    console.log('Clearing user data...');

    await db.query('DELETE FROM activity_logs');
    await db.query('DELETE FROM notifications');
    await db.query('DELETE FROM ratings_reviews');
    await db.query('DELETE FROM member_favorites');
    await db.query('DELETE FROM cook_payouts');
    await db.query('DELETE FROM payments');
    await db.query('DELETE FROM order_items');
    await db.query('DELETE FROM orders');
    await db.query('DELETE FROM menu_items');
    await db.query('DELETE FROM menus');
    await db.query('DELETE FROM email_verifications');
    await db.query('DELETE FROM password_resets');
    await db.query('DELETE FROM member_addresses');
    await db.query('DELETE FROM member_profiles');
    await db.query('DELETE FROM cook_profiles');
    await db.query('DELETE FROM users');

    console.log('All user data cleared successfully.');
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to clear users:', error.message);
    await db.pool.end();
    process.exit(1);
  }
}

clearUsers();
