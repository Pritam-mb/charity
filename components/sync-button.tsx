"use client";

import { useState } from "react";

export default function SyncButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const j = await res.json().catch(() => null);
      if (res.ok) setMsg("Synced. Refresh to read metrics back from Snowflake.");
      else setMsg(`Sync failed (dashboard keeps working on local data): ${j?.error ?? "unknown"}`);
    } catch (e) {
      setMsg(`Sync failed: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <button className="btn btn-ghost btn-sm" onClick={sync} disabled={busy}>
        {busy ? "Syncing…" : "↻ Sync store → Snowflake"}
      </button>
      {msg && <span className="faint" style={{ fontSize: 12 }}>{msg}</span>}
    </div>
  );
}