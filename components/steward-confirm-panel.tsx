"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NeedCard, Pledge } from "@/lib/types";

export default function StewardConfirmPanel({
  needs,
  readyToConfirm,
  stewardId,
}: {
  needs: NeedCard[];
  readyToConfirm: Pledge[];
  stewardId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const confirm = async (pledge: Pledge, needId: string) => {
    setBusy(pledge.id);
    try {
      const res = await fetch(`/api/needs/${needId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pledge_id: pledge.id, steward_id: stewardId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(j?.error ?? "Confirmation failed");
      }
    } finally {
      setBusy(null);
      router.refresh();
    }
  };

  const needTitle = (id: string) => {
    const n = needs.find((x) => x.id === id);
    return n ? n.ai_tags.item_type : id.slice(0, 12);
  };

  return (
    <div className="steward-panel-container">
      <div className="steward-subhead">
        <span className="steward-subhead-title">Handoff Verifications</span>
        <span
          className="chip"
          style={{
            fontSize: 11,
            color: readyToConfirm.length > 0 ? "var(--reddit-orange)" : "var(--reddit-green)",
            borderColor: readyToConfirm.length > 0 ? "rgba(255,69,0,0.35)" : "rgba(0,166,126,0.35)",
            padding: "2px 8px",
          }}
        >
          {readyToConfirm.length} awaiting
        </span>
      </div>
      <p className="steward-panel-desc">
        Two-party rule: Giver marks handed-off, then steward verifies receipt to mint honor points.
      </p>

      {readyToConfirm.length === 0 ? (
        <div className="steward-empty-state">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--reddit-green)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <span>All pledges verified. Nothing awaiting confirmation.</span>
        </div>
      ) : (
        <div className="steward-pledge-list">
          {readyToConfirm.map((p) => (
            <div className="steward-pledge-card" key={p.id}>
              <div className="steward-pledge-top">
                <span className="steward-pledge-title">{needTitle(p.need_card_id)}</span>
                <span
                  className="chip"
                  style={{
                    fontSize: 10.5,
                    color: "var(--reddit-warn)",
                    borderColor: "rgba(245,158,11,0.35)",
                    padding: "1px 6px",
                  }}
                >
                  Handed off
                </span>
              </div>
              <div className="steward-pledge-details">
                Portion: <strong>{p.portion}</strong>
              </div>
              <button
                className="steward-confirm-btn"
                disabled={busy === p.id}
                onClick={() => confirm(p, p.need_card_id)}
              >
                {busy === p.id ? "Confirming..." : "✓ Confirm Received & Award Honor"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="steward-audit-footnote">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Logged to immutable ledger & Snowflake telemetry</span>
      </div>
    </div>
  );
}
