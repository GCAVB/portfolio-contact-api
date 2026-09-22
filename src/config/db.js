const { Pool } = require('pg');

const isCloudSqlSocket =
  process.env.DATABASE_URL?.includes('/cloudsql/');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl:
    process.env.NODE_ENV === 'production' &&
    !isCloudSqlSocket
      ? {
          rejectUnauthorized: false
        }
      : false,

  max: Number(process.env.DB_POOL_MAX || 10),

  idleTimeoutMillis: 30000,

  connectionTimeoutMillis: 10000
});

async function checkDatabaseConnection() {
  const result = await pool.query(
    'SELECT 1 AS ok'
  );

  return result.rows[0];
}

module.exports = {
  pool,
  checkDatabaseConnection
};