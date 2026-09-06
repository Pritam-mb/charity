import type { StoreData } from "./types";
import type { CasePage, User } from "./types";

// Snowflake integration. All functions are lazy (nothing connects at import
// time) so next build / typecheck never touch the network. The dashboard
// tries Snowflake first and falls back to local aggregation when unreachable.

interface SFConnection {
  connect: (cb: (err: unknown, conn?: SFConnection) => void) => void;
  execute: (o: {
    sqlText: string;
    binds?: unknown[];
    complete: (err: unknown, stmt: unknown, rows: Record<string, unknown>[] | undefined) => void;
  }) => void;
  destroy: (cb?: () => void) => void;
}

const env = () => ({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  role: process.env.SNOWFLAKE_ROLE,
});

function loadSdk(): { createConnection: (o: object) => SFConnection } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sdk = require("snowflake-sdk");
  sdk.configure({ logLevel: "ERROR" });
  return sdk as { createConnection: (o: object) => SFConnection };
}

function connect(): Promise<SFConnection> {
  const c = env();
  if (!c.account || !c.username || !c.password) {
    return Promise.reject(new Error("Snowflake env vars missing"));
  }
  const sdk = loadSdk();
  return new Promise((resolve, reject) => {
    const conn = sdk.createConnection({
      account: c.account,
      username: c.username,
      password: c.password,
      database: c.database,
      schema: c.schema,
      warehouse: c.warehouse,
      role: c.role,
    });
    conn.connect((err: unknown) => {
      if (err) reject(new Error(`Snowflake connect failed: ${String(err)}`));
      else resolve(conn);
    });
  });
}

function run(conn: SFConnection, sqlText: string, binds: unknown[] = []): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (err, _stmt, rows) => {
        if (err) reject(new Error(String(err)));
        else resolve(rows ?? []);
      },
    });
  });
}

// ---------- schema ----------

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS NEEDREEL_USERS (
     ID VARCHAR(64) PRIMARY KEY,
     DISPLAY_NAME VARCHAR(200),
     BADGE NUMBER,
     RANK_POINTS NUMBER,
     CREATED_AT TIMESTAMP_NTZ
   )`,
  `CREATE TABLE IF NOT EXISTS NEEDREEL_CASE_PAGES (
     ID VARCHAR(64) PRIMARY KEY,
     ALIAS VARCHAR(200),
     BROAD_AREA VARCHAR(100),
     STEWARDS VARCHAR(500),
     STATUS VARCHAR(20),
     CONSENT_CLIP BOOLEAN,
     BLUR_PUBLIC BOOLEAN,
     CREATED_AT TIMESTAMP_NTZ,
     LAST_UPDATE_AT TIMESTAMP_NTZ
   )`,
  `CREATE TABLE IF NOT EXISTS NEEDREEL_NEEDS (
     ID VARCHAR(64) PRIMARY KEY,
     MEDIA_KEY VARCHAR(200),
     CATEGORY VARCHAR(30),
     ITEM_TYPE VARCHAR(200),
     URGENCY VARCHAR(20),
     CAPTION VARCHAR(1000),
     OWNER_TYPE VARCHAR(20),
     OWNER_ID VARCHAR(64),
     AREA VARCHAR(100),
     STATUS VARCHAR(30),
     QUANTITY VARCHAR(200),
     CREATED_AT TIMESTAMP_NTZ
   )`,
  `CREATE TABLE IF NOT EXISTS NEEDREEL_PLEDGES (
     ID VARCHAR(64) PRIMARY KEY,
     NEED_CARD_ID VARCHAR(64),
     GIVER_ID VARCHAR(64),
     PORTION VARCHAR(200),
     STATUS VARCHAR(20),
     ANCHOR_POINT_ID VARCHAR(64),
     CREATED_AT TIMESTAMP_NTZ,
     HANDED_OFF_AT TIMESTAMP_NTZ,
     CONFIRMED_AT TIMESTAMP_NTZ
   )`,
  `CREATE TABLE IF NOT EXISTS NEEDREEL_CONFIRMATIONS (
     ID VARCHAR(64) PRIMARY KEY,
     PLEDGE_ID VARCHAR(64),
     NEED_CARD_ID VARCHAR(64),
     GIVER_ID VARCHAR(64),
     STEWARD_ID VARCHAR(64),
     CONFIRMED_AT TIMESTAMP_NTZ,
     ON_CHAIN_REF VARCHAR(200),
     MISMATCH_FLAG BOOLEAN
   )`,
  `CREATE TABLE IF NOT EXISTS NEEDREEL_SHARES (
     ID VARCHAR(64) PRIMARY KEY,
     NEED_CARD_ID VARCHAR(64),
     SHARER_ID VARCHAR(64),
     AT_TS TIMESTAMP_NTZ
   )`,
  `CREATE TABLE IF NOT EXISTS NEEDREEL_ANCHOR_POINTS (
     ID VARCHAR(64) PRIMARY KEY,
     NAME VARCHAR(200),
     AREA VARCHAR(100),
     VETTED_BY VARCHAR(64),
     ACTIVE BOOLEAN
   )`,
];

export async function ensureSchema(): Promise<void> {
  const conn = await connect();
  try {
    for (const sql of SCHEMA_SQL) await run(conn, sql);
  } finally {
    conn.destroy();
  }
}

// ---------- sync ----------

export async function syncStoreToSnowflake(data: StoreData): Promise<void> {
  const conn = await connect();
  try {
    await run(conn, "BEGIN");
    await run(conn, "DELETE FROM NEEDREEL_USERS");
    await run(conn, "DELETE FROM NEEDREEL_CASE_PAGES");
    await run(conn, "DELETE FROM NEEDREEL_NEEDS");
    await run(conn, "DELETE FROM NEEDREEL_PLEDGES");
    await run(conn, "DELETE FROM NEEDREEL_CONFIRMATIONS");
    await run(conn, "DELETE FROM NEEDREEL_SHARES");
    await run(conn, "DELETE FROM NEEDREEL_ANCHOR_POINTS");

    const bulkInsert = async (sql: string, rows: unknown[][]) => {
      for (const r of rows) await run(conn, sql, r);
    };

    await bulkInsert(
      "INSERT INTO NEEDREEL_USERS (ID, DISPLAY_NAME, BADGE, RANK_POINTS, CREATED_AT) VALUES (?,?,?,?,?)",
      data.users.map((u) => [u.id, u.display_name, u.badge, u.rank_points, u.created_at])
    );
    await bulkInsert(
      "INSERT INTO NEEDREEL_CASE_PAGES (ID, ALIAS, BROAD_AREA, STEWARDS, STATUS, CONSENT_CLIP, BLUR_PUBLIC, CREATED_AT, LAST_UPDATE_AT) VALUES (?,?,?,?,?,?,?,?,?)",
      data.case_pages.map((c) => [
        c.id, c.alias, c.broad_area, c.stewards.join(","), c.status,
        c.consent_clip, c.blur_public, c.created_at, c.last_update_at,
      ])
    );
    await bulkInsert(
      "INSERT INTO NEEDREEL_NEEDS (ID, MEDIA_KEY, CATEGORY, ITEM_TYPE, URGENCY, CAPTION, OWNER_TYPE, OWNER_ID, AREA, STATUS, QUANTITY, CREATED_AT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      data.needs.map((n) => [
        n.id, n.media_key, n.ai_tags.category, n.ai_tags.item_type, n.ai_tags.urgency,
        n.caption, n.owner_type, n.owner_id, n.area, n.status, n.quantity, n.created_at,
      ])
    );
    await bulkInsert(
      "INSERT INTO NEEDREEL_PLEDGES (ID, NEED_CARD_ID, GIVER_ID, PORTION, STATUS, ANCHOR_POINT_ID, CREATED_AT, HANDED_OFF_AT, CONFIRMED_AT) VALUES (?,?,?,?,?,?,?,?,?)",
      data.pledges.map((p) => [
        p.id, p.need_card_id, p.giver_id, p.portion, p.status, p.anchor_point_id,
        p.created_at, p.handed_off_at, p.confirmed_at,
      ])
    );
    await bulkInsert(
      "INSERT INTO NEEDREEL_CONFIRMATIONS (ID, PLEDGE_ID, NEED_CARD_ID, GIVER_ID, STEWARD_ID, CONFIRMED_AT, ON_CHAIN_REF, MISMATCH_FLAG) VALUES (?,?,?,?,?,?,?,?)",
      data.confirmations.map((r) => [
        r.id, r.pledge_id, r.need_card_id, r.giver_id, r.steward_id, r.confirmed_at,
        r.on_chain_ref, r.mismatch_flag,
      ])
    );
    await bulkInsert(
      "INSERT INTO NEEDREEL_SHARES (ID, NEED_CARD_ID, SHARER_ID, AT_TS) VALUES (?,?,?,?)",
      data.shares.map((s) => [s.id, s.need_card_id, s.sharer_id, s.at])
    );
    await bulkInsert(
      "INSERT INTO NEEDREEL_ANCHOR_POINTS (ID, NAME, AREA, VETTED_BY, ACTIVE) VALUES (?,?,?,?,?)",
      data.anchor_points.map((a) => [a.id, a.name, a.area, a.vetted_by, a.active])
    );
    await run(conn, "COMMIT");
  } catch (e) {
    try {
      await run(conn, "ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    conn.destroy();
  }
}

// ---------- dashboard reads ----------

export interface DashboardMetrics {
  source: "snowflake" | "local";
  error?: string;
  categories: { category: string; open: number; fulfilled: number; total: number }[];
  areas: { area: string; open: number; total: number }[];
  urgency: { urgency: string; open: number }[];
  stalePages: { id: string; alias: string; area: string; days_stale: number; stewards: number }[];
  topGivers: { name: string; badge: number; confirmed: number }[];
  recentHandoffs: { date: string; count: number }[];
  shareStats: { category: string; shares: number }[];
  unfulfilledTotal: number;
  fulfilledTotal: number;
  anchorActive: number;
}

function isOpen(s: string) {
  return s === "open" || s === "partially_fulfilled";
}

export async function metricsFromStore(data: StoreData): Promise<DashboardMetrics> {
  const needs = data.needs;
  const open = needs.filter((n) => isOpen(n.status));
  const fulfilled = needs.filter((n) => n.status === "fulfilled");

  const catMap = new Map<string, { open: number; fulfilled: number; total: number }>();
  for (const n of needs) {
    const e = catMap.get(n.ai_tags.category) ?? { open: 0, fulfilled: 0, total: 0 };
    e.total++;
    if (isOpen(n.status)) e.open++;
    if (n.status === "fulfilled") e.fulfilled++;
    catMap.set(n.ai_tags.category, e);
  }

  const areaMap = new Map<string, { open: number; total: number }>();
  for (const n of needs) {
    const e = areaMap.get(n.area) ?? { open: 0, total: 0 };
    e.total++;
    if (isOpen(n.status)) e.open++;
    areaMap.set(n.area, e);
  }

  const urgentMap = new Map<string, number>();
  for (const n of open) {
    urgentMap.set(n.ai_tags.urgency, (urgentMap.get(n.ai_tags.urgency) ?? 0) + 1);
  }

  const daysSince = (iso: string) =>
    Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

  const stalePages = data.case_pages
    .filter((c: CasePage) => c.status === "active")
    .map((c: CasePage) => ({
      id: c.id,
      alias: c.alias,
      area: c.broad_area,
      days_stale: daysSince(c.last_update_at),
      stewards: c.stewards.length,
    }))
    .sort((a, b) => b.days_stale - a.days_stale)
    .filter((p) => p.days_stale > 3);

  const confirmedByGiver = new Map<string, number>();
  for (const r of data.confirmations) {
    confirmedByGiver.set(r.giver_id, (confirmedByGiver.get(r.giver_id) ?? 0) + 1);
  }
  const topGivers = data.users
    .filter((u: User) => (confirmedByGiver.get(u.id) ?? 0) > 0)
    .map((u: User) => ({
      name: u.display_name,
      badge: u.badge,
      confirmed: confirmedByGiver.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.confirmed - a.confirmed)
    .slice(0, 5);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
  const countMap = new Map<string, number>(last7.map((s) => [s, 0]));
  for (const r of data.confirmations) {
    const key = new Date(r.confirmed_at).toDateString();
    if (countMap.has(key)) countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }
  const recentHandoffs = last7.map((s) => ({
    date: s.slice(4, 10),
    count: countMap.get(s) ?? 0,
  }));

  const shareCount: Record<string, number> = {};
  const needById = new Map(needs.map((n) => [n.id, n]));
  for (const s of data.shares) {
    const n = needById.get(s.need_card_id);
    const cat = n?.ai_tags.category ?? "unknown";
    shareCount[cat] = (shareCount[cat] ?? 0) + 1;
  }

  return {
    source: "local",
    categories: [...catMap.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.open - a.open),
    areas: [...areaMap.entries()].map(([area, v]) => ({ area, ...v })).sort((a, b) => b.open - a.open),
    urgency: [...urgentMap.entries()].map(([urgency, count]) => ({ urgency, open: count })),
    stalePages,
    topGivers,
    recentHandoffs,
    shareStats: Object.entries(shareCount).map(([category, shares]) => ({ category, shares })),
    unfulfilledTotal: open.length,
    fulfilledTotal: fulfilled.length,
    anchorActive: data.anchor_points.filter((a) => a.active).length,
  };
}

const dashboardPayload = (data: StoreData, err?: string): Promise<DashboardMetrics> =>
  metricsFromStore(data).then((m) => {
    m.source = "snowflake";
    if (err) m.error = err;
    return m;
  });

export async function metricsFromSnowflake(data: StoreData): Promise<DashboardMetrics> {
  try {
    const conn = await connect();
    try {
      await ensureTables(conn);
      const catRows = await run(
        conn,
        `SELECT CATEGORY,
                SUM(CASE WHEN STATUS IN ('open','partially_fulfilled') THEN 1 ELSE 0 END) AS OPEN_CNT,
                SUM(CASE WHEN STATUS = 'fulfilled' THEN 1 ELSE 0 END) AS FULFILLED_CNT,
                COUNT(*) AS TOTAL
         FROM NEEDREEL_NEEDS GROUP BY CATEGORY ORDER BY OPEN_CNT DESC`
      );
      const areaRows = await run(
        conn,
        `SELECT AREA,
                SUM(CASE WHEN STATUS IN ('open','partially_fulfilled') THEN 1 ELSE 0 END) AS OPEN_CNT,
                COUNT(*) AS TOTAL
         FROM NEEDREEL_NEEDS GROUP BY AREA ORDER BY OPEN_CNT DESC`
      );
      const urgencyRows = await run(
        conn,
        `SELECT URGENCY, COUNT(*) AS OPEN_CNT FROM NEEDREEL_NEEDS
         WHERE STATUS IN ('open','partially_fulfilled') GROUP BY URGENCY`
      );
      const staleRows = await run(
        conn,
        `SELECT ID, ALIAS, BROAD_AREA, DATEDIFF(day, LAST_UPDATE_AT, CURRENT_TIMESTAMP()) AS DAYS_STALE,
                ARRAY_SIZE(SPLIT(STEWARDS, ',')) AS STEWARD_COUNT
         FROM NEEDREEL_CASE_PAGES WHERE STATUS = 'active' AND DATEDIFF(day, LAST_UPDATE_AT, CURRENT_TIMESTAMP()) > 3
         ORDER BY DAYS_STALE DESC`
      );
      const giverRows = await run(
        conn,
        `SELECT u.DISPLAY_NAME AS NAME, u.BADGE, c.CNT AS CONFIRMED
         FROM (SELECT GIVER_ID, COUNT(*) AS CNT FROM NEEDREEL_CONFIRMATIONS GROUP BY GIVER_ID) c
         JOIN NEEDREEL_USERS u ON u.ID = c.GIVER_ID
         ORDER BY CONFIRMED DESC LIMIT 5`
      );
      const handoffRows = await run(
        conn,
        `SELECT TO_VARCHAR(CONFIRMED_AT, 'Mon dd') AS DT, COUNT(*) AS CNT
         FROM NEEDREEL_CONFIRMATIONS
         WHERE CONFIRMED_AT >= DATEADD(day, -7, CURRENT_TIMESTAMP())
         GROUP BY TO_VARCHAR(CONFIRMED_AT, 'Mon dd')`
      );
      const shareRows = await run(
        conn,
        `SELECT n.CATEGORY, COUNT(*) AS SHARES
         FROM NEEDREEL_SHARES s JOIN NEEDREEL_NEEDS n ON n.ID = s.NEED_CARD_ID
         GROUP BY n.CATEGORY ORDER BY SHARES DESC`
      );
      const unfulfilled = await run(
        conn,
        `SELECT COUNT(*) AS C FROM NEEDREEL_NEEDS WHERE STATUS IN ('open','partially_fulfilled')`
      );
      const fulfilled = await run(
        conn,
        `SELECT COUNT(*) AS C FROM NEEDREEL_NEEDS WHERE STATUS = 'fulfilled'`
      );
      const activeAnchors = await run(
        conn,
        `SELECT COUNT(*) AS C FROM NEEDREEL_ANCHOR_POINTS WHERE ACTIVE = TRUE`
      );
      const recentHandoffs = handoffRows.map((r) => ({
        date: String(r.DT),
        count: Number(r.CNT),
      }));
      return {
        source: "snowflake",
        categories: catRows.map((r) => ({
          category: String(r.CATEGORY),
          open: Number(r.OPEN_CNT),
          fulfilled: Number(r.FULFILLED_CNT),
          total: Number(r.TOTAL),
        })),
        areas: areaRows.map((r) => ({
          area: String(r.AREA),
          open: Number(r.OPEN_CNT),
          total: Number(r.TOTAL),
        })),
        urgency: urgencyRows.map((r) => ({
          urgency: String(r.URGENCY),
          open: Number(r.OPEN_CNT),
        })),
        stalePages: staleRows.map((r) => ({
          id: String(r.ID),
          alias: String(r.ALIAS),
          area: String(r.BROAD_AREA),
          days_stale: Number(r.DAYS_STALE),
          stewards: Number(r.STEWARD_COUNT),
        })),
        topGivers: giverRows.map((r) => ({
          name: String(r.NAME),
          badge: Number(r.BADGE),
          confirmed: Number(r.CONFIRMED),
        })),
        recentHandoffs,
        shareStats: shareRows.map((r) => ({
          category: String(r.CATEGORY),
          shares: Number(r.SHARES),
        })),
        unfulfilledTotal: Number(unfulfilled[0]?.C ?? 0),
        fulfilledTotal: Number(fulfilled[0]?.C ?? 0),
        anchorActive: Number(activeAnchors[0]?.C ?? 0),
      };
    } finally {
      conn.destroy();
    }
  } catch (e) {
    return dashboardPayload(data, String(e instanceof Error ? e.message : e));
  }
}

async function ensureTables(conn: SFConnection): Promise<void> {
  for (const sql of SCHEMA_SQL) await run(conn, sql);
}

export async function testConnection(): Promise<{ ok: boolean; detail: string }> {
  try {
    const conn = await connect();
    try {
      const rows = await run(conn, "SELECT CURRENT_VERSION() AS V");
      return { ok: true, detail: String(rows[0]?.V ?? "connected") };
    } finally {
      conn.destroy();
    }
  } catch (e) {
    return { ok: false, detail: String(e instanceof Error ? e.message : e) };
  }
}