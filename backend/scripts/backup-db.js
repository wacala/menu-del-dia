const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
require('dotenv').config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
const missing = hasDatabaseUrl ? [] : required.filter((key) => !process.env[key]);

if (!hasDatabaseUrl && missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const backupsDir = path.resolve(__dirname, '../../backups');
fs.mkdirSync(backupsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(backupsDir, `menu-del-dia-${timestamp}.sql`);

const args = hasDatabaseUrl
  ? [
    '--format=plain',
    '--no-owner',
    '--no-privileges',
    '--file', outputFile,
    process.env.DATABASE_URL,
  ]
  : [
    '--host', process.env.DB_HOST,
    '--port', String(process.env.DB_PORT),
    '--username', process.env.DB_USER,
    '--format=plain',
    '--no-owner',
    '--no-privileges',
    '--file', outputFile,
    process.env.DB_NAME,
  ];

const result = spawnSync('pg_dump', args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    PGPASSWORD: process.env.DB_PASSWORD,
  },
});

if (result.error) {
  if (result.error.code === 'ENOENT') {
    console.error('pg_dump not found. Install PostgreSQL client tools first.');
  } else {
    console.error(result.error);
  }
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`Backup created: ${outputFile}`);
