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
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replaceAll("\\$", "$")];
    })
);

snowflake.configure({ logLevel: "ERROR" });
const conn = snowflake.createConnection({
  account: env.SNOWFLAKE_ACCOUNT,
  username: env.SNOWFLAKE_USER,
  password: env.SNOWFLAKE_PASSWORD,
  warehouse: env.SNOWFLAKE_WAREHOUSE,
  role: env.SNOWFLAKE_ROLE,
});

function quoteIdentifier(name) {
  return `"${name.replaceAll('"', '""')}"`;
}

conn.connect((err) => {
  if (err) {
    console.error("CONNECT FAILED:", err.message || err);
    process.exit(1);
  }
  const steps = [
    ["SHOW DATABASES", "name"],
    ["SHOW WAREHOUSES", "name"],
    [`SHOW SCHEMAS IN DATABASE ${quoteIdentifier(env.SNOWFLAKE_DATABASE)}`, "name"],
    [`USE DATABASE ${quoteIdentifier(env.SNOWFLAKE_DATABASE)}`, null],
    [`USE SCHEMA ${quoteIdentifier(env.SNOWFLAKE_SCHEMA)}`, null],
    ["SELECT CURRENT_DATABASE() AS DB, CURRENT_SCHEMA() AS SC", null],
    ["CREATE TEMPORARY TABLE IF NOT EXISTS NEEDREEL_DIAG (ID VARCHAR)", null],
    ["DROP TABLE IF EXISTS NEEDREEL_DIAG", null],
  ];
  let i = 0;
  const next = () => {
    if (i >= steps.length) {
      conn.destroy();
      process.exit(0);
    }
    const [sql, col] = steps[i++];
    conn.execute({
      sqlText: sql,
      complete: (e, _s, rows) => {
        if (e) {
          console.log(`${sql} -> ERROR: ${e.message}`);
        } else {
          const detail = col
            ? (rows || []).map((r) => r[col]).filter(Boolean).join(", ") || "(none)"
            : JSON.stringify(rows || []);
          console.log(`${sql} -> ${detail}`);
        }
        next();
      },
    });
  };
  next();
});
