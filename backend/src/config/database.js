const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool(config.database);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};