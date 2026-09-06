/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const snowflake = require("snowflake-sdk");

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, "..", ".env"), "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
    .map(([k, v]) => [k, v.replace(/\\\$/g, "$")])
);

snowflake.configure({ logLevel: "ERROR" });
const conn = snowflake.createConnection({
  account: env.SNOWFLAKE_ACCOUNT,
  username: env.SNOWFLAKE_USER,
  password: env.SNOWFLAKE_PASSWORD,
  database: env.SNOWFLAKE_DATABASE,
  schema: env.SNOWFLAKE_SCHEMA,
  warehouse: env.SNOWFLAKE_WAREHOUSE,
  role: env.SNOWFLAKE_ROLE,
});

conn.connect((err) => {
  if (err) {
    console.error("CONNECT FAIL:", err.message || err);
    process.exit(1);
  }
  conn.execute({
    sqlText: `SELECT 'USERS' AS T, COUNT(*) AS C FROM NEEDREEL_USERS
      UNION ALL SELECT 'CASE_PAGES', COUNT(*) FROM NEEDREEL_CASE_PAGES
      UNION ALL SELECT 'NEEDS', COUNT(*) FROM NEEDREEL_NEEDS
      UNION ALL SELECT 'PLEDGES', COUNT(*) FROM NEEDREEL_PLEDGES
      UNION ALL SELECT 'CONFIRMATIONS', COUNT(*) FROM NEEDREEL_CONFIRMATIONS
      UNION ALL SELECT 'SHARES', COUNT(*) FROM NEEDREEL_SHARES
      UNION ALL SELECT 'ANCHOR_POINTS', COUNT(*) FROM NEEDREEL_ANCHOR_POINTS`,
    complete: (e, _s, rows) => {
      if (e) {
        console.error("QUERY FAIL:", e.message || e);
      } else {
        (rows || []).forEach((r) => console.log(`${r.T}: ${r.C}`));
      }
      conn.destroy();
      process.exit(0);
    },
  });
});