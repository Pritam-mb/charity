/* eslint-disable @typescript-eslint/no-require-imports */
const snowflake = require('snowflake-sdk');

const conn = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  role: process.env.SNOWFLAKE_ROLE,
});

conn.connect((err, conn) => {
  if (err) {
    console.error('CONNECT FAILED:', err.message || err);
    process.exit(1);
  }
  console.log('CONNECTED');
  conn.execute({
    sqlText: 'SELECT CURRENT_VERSION() AS V, CURRENT_DATABASE() AS DB, CURRENT_SCHEMA() AS SC, CURRENT_WAREHOUSE() AS WH',
    complete: (e, stmt, rows) => {
      if (e) { console.error('QUERY FAILED:', e.message || e); process.exit(1); }
      console.log(JSON.stringify(rows));
      conn.destroy();
      process.exit(0);
    },
  });
});
