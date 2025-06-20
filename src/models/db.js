const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.dbUrl,
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Error connecting to the database', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // Export the pool itself if needed for transactions or other specific uses
};
