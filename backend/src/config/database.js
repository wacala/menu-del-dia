const { Pool } = require('pg');
const config = require('./index');

const poolConfig = { ...config.database };

// Railway PostgreSQL requires SSL in production
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
