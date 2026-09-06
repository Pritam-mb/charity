import { getStore } from "@/lib/store";
import { metricsFromSnowflake } from "@/lib/snowflake";
import { categoryInfo, urgencyInfo } from "@/lib/categories";
import SyncButton from "@/components/sync-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const store = await getStore();
  const m = await metricsFromSnowflake(store);

  const snowLive = m.source === "snowflake" && !m.error;

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Snowflake HQ</h1>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            Where unfulfilled needs and steward health become visible: here&apos;s what the data shows.
          </p>
        </div>
        <SyncButton />
      </div>

      <div className={`banner ${snowLive ? "snow" : "local"}`}>
        {snowLive ? (
          <>Live data - reading aggregates from Snowflake.</>
        ) : (
          <>
            Snowflake unreachable - showing the same metrics computed locally so the demo
            never breaks. {m.error ? <span className="faint">({m.error})</span> : null} Set the
            SNOWFLAKE_* env vars (account hostname must be reachable) then use Sync store to Snowflake.
          </>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-value">{m.unfulfilledTotal}</div>
          <div className="stat-label">Open needs</div>
        </div>
        <div className="stat">
          <div className="stat-value">{m.fulfilledTotal}</div>
          <div className="stat-label">Fulfilled</div>
        </div>
        <div className="stat">
          <div className="stat-value">{m.stalePages.length}</div>
          <div className="stat-label">Stale case pages</div>
        </div>
        <div className="stat">
          <div className="stat-value">{m.anchorActive}</div>
          <div className="stat-label">Active anchor points</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="pledge-pool-title">Unfulfilled needs by category</div>
          <div className="bar-list">
            {m.categories.map((c) => {
              const info = categoryInfo(c.category as never);
              const pct = c.total === 0 ? 0 : Math.round((c.open / c.total) * 100);
              return (
                <div className="bar-row" key={c.category}>
                  <span className="bar-label">{info.label}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${pct}%`, background: info.color }}
                    />
                  </div>
                  <span className="bar-num">{c.open}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="pledge-pool-title">Unfulfilled needs by area</div>
          <div className="bar-list">
            {m.areas.map((a) => {
              const pct = a.total === 0 ? 0 : Math.round((a.open / a.total) * 100);
              return (
                <div className="bar-row" key={a.area}>
                  <span className="bar-label">{a.area}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${pct}%`, background: "#6da9ff" }}
                    />
                  </div>
                  <span className="bar-num">{a.open}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="pledge-pool-title">Open needs by urgency</div>
          <div className="bar-list">
            {m.urgency.map((u) => {
              const info = urgencyInfo(u.urgency as never);
              return (
                <div className="bar-row" key={u.urgency}>
                  <span className="bar-label">{info.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.min(100, u.open * 18)}%`, background: info.color }} />
                  </div>
                  <span className="bar-num">{u.open}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="pledge-pool-title">Most-shared needs (amplification)</div>
          <div className="bar-list">
            {m.shareStats.map((s) => (
              <div className="bar-row" key={s.category}>
                <span className="bar-label">{categoryInfo(s.category as never).label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(100, s.shares * 12)}%`, background: "#e07a3f" }} />
                </div>
                <span className="bar-num">{s.shares}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="pledge-pool-title">Steward health - stale case pages (no update in 3+ days)</div>
          {m.stalePages.length === 0 && <p className="muted" style={{ fontSize: 13 }}>No stale pages. Every case is being maintained.</p>}
          {m.stalePages.map((p) => (
            <div className="pledge-item" key={p.id}>
              <Link href={`/cases/${p.id}`} style={{ fontWeight: 700 }}>{p.alias}</Link>
              <span className="pledge-giver">{p.area} - {p.stewards} steward{p.stewards === 1 ? "" : "s"}</span>
              <span className="pledge-state chip" style={{ color: "var(--danger)", borderColor: "rgba(226,81,81,0.5)" }}>
                {p.days_stale}d without update
              </span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="pledge-pool-title">Top givers (confirmed, provably earned)</div>
          <div className="bar-list">
            {m.topGivers.map((g) => (
              <div className="bar-row" key={g.name}>
                <span className="bar-label">{g.name}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(100, g.confirmed * 20)}%`, background: "#4caf50" }} />
                </div>
                <span className="bar-num">{g.confirmed}</span>
              </div>
            ))}
          </div>
          <div className="pledge-pool-title" style={{ marginTop: 16 }}>Confirmed handoffs, last 7 days</div>
          <div className="bar-list">
            {m.recentHandoffs.map((h) => (
              <div className="bar-row" key={h.date}>
                <span className="bar-label">{h.date}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(100, h.count * 30)}%`, background: "#38b6c4" }} />
                </div>
                <span className="bar-num">{h.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
