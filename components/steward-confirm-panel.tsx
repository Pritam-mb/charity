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
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="pledge-pool-title" style={{ marginBottom: 10 }}>
        Confirmations awaiting the steward (two-party rule — giver must have marked handed off)
      </div>
      {readyToConfirm.length === 0 && (
        <p className="muted" style={{ fontSize: 13 }}>
          Nothing awaiting confirmation right now. Pledges show up here once a giver marks them handed-off.
        </p>
      )}
      {readyToConfirm.map((p) => (
        <div className="pledge-item" key={p.id}>
          <span className="pledge-portion">{p.portion}</span>
          <span className="pledge-giver">for a need — {needTitle(p.need_card_id)}</span>
          <span className="pledge-state chip" style={{ color: "var(--warn)", borderColor: "rgba(212,162,51,0.5)" }}>
            handed off
          </span>
          <button
            className="btn btn-good btn-sm"
            disabled={busy === p.id}
            onClick={() => confirm(p, p.need_card_id)}
          >
            ✓ Confirm received — giver earns badge
          </button>
        </div>
      ))}
      <div className="faint" style={{ fontSize: 12, marginTop: 8 }}>
        Every confirmation is logged to the immutable record and reflected in the Snowflake HQ dashboard.
      </div>
    </div>
  );
}