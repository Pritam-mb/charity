"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AnchorPoint, NeedCard, Pledge } from "@/lib/types";
import { categoryInfo, formatCategory, formatUrgency, urgencyInfo } from "@/lib/categories";
import { timeAgo } from "@/lib/utils";
import Poster from "./poster";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  partially_fulfilled: "Partially met",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const PLEDGE_LABEL: Record<string, string> = {
  pledged: "Pledged",
  handed_off: "Handed off",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export default function NeedCard({
  need,
  pledges,
  caseAlias,
  caseArea,
  anchorPoints,
  viewerId,
  shareCount,
}: {
  need: NeedCard;
  pledges: Pledge[];
  caseAlias?: string;
  caseArea?: string;
  anchorPoints: AnchorPoint[];
  viewerId: string;
  shareCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [portion, setPortion] = useState("");
  const [anchor, setAnchor] = useState("");
  const cat = categoryInfo(need.ai_tags.category);
  const urg = urgencyInfo(need.ai_tags.urgency);
  const catColor = cat.color;

  const vidPledges = pledges.filter((p) => p.giver_id === viewerId);
  const myPledge = vidPledges.find((p) => p.status === "pledged");
  const myHandedOff = vidPledges.find((p) => p.status === "handed_off");

  const post = async (path: string, body: object) => {
    setBusy(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(j?.error ?? "Request failed");
      }
    } finally {
      setBusy(false);
      router.refresh();
    }
  };

  const pledge = () =>
    post(`/api/needs/${need.id}/pledge`, {
      giver_id: viewerId,
      portion: portion.trim() || "A share",
      anchor_point_id: anchor || null,
    });

  const doHandoff = () => {
    if (myPledge) post(`/api/needs/${need.id}/handoff`, { pledge_id: myPledge.id });
  };

  return (
    <article className="card need-card">
      <header className="need-head">
        <div className="avatar" style={{ background: catColor }}>
          {(caseAlias ?? "You").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="need-title">
            {caseAlias ? (
              <Link href={`/cases/${need.owner_id}`}>{caseAlias}</Link>
            ) : (
              "Self-posted need"
            )}
          </div>
          <div className="need-sub">
            {need.area} · {timeAgo(need.created_at)} ·{" "}
            {need.quantity}
          </div>
        </div>
        <span className="chip status-chip" style={{ marginLeft: "auto" }}>
          {STATUS_LABEL[need.status] ?? need.status}
        </span>
      </header>

      <Poster
        mediaKey={need.media_key}
        category={need.ai_tags.category}
        caption={need.caption}
      />

      <div className="need-body">
        <div className="need-tags">
          <span className="chip tag-chip" style={{ background: catColor }}>
            {formatCategory(need.ai_tags.category)}
          </span>
          <span className="chip">{need.ai_tags.item_type}</span>
          <span
            className="chip tag-chip"
            style={{ background: urg.color }}
            title="AI-proposed urgency"
          >
            {formatUrgency(need.ai_tags.urgency)}
          </span>
          <span className="chip area-chip">📍 {need.area}</span>
          {caseAlias && caseArea ? (
            <span className="chip">🛡️ Stewarded case page</span>
          ) : null}
        </div>

        <p className="need-caption">{need.caption}</p>

        <div className="need-meta">
          <span>Need: {need.quantity}</span>
          <span data-share-count={shareCount}>
            Shared {shareCount}x
          </span>
        </div>

        <div className="need-actions">
          <button
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => post(`/api/needs/${need.id}/share`, { sharer_id: viewerId })}
          >
            ↔ Share
          </button>

          {need.status !== "fulfilled" && need.status !== "cancelled" && myPledge && (
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={doHandoff}>
              ✓ Mark handed off (I dropped it off)
            </button>
          )}
          {myHandedOff && (
            <span className="chip" style={{ borderColor: "rgba(212,162,51,0.5)", color: "var(--warn)" }}>
              Waiting for steward confirmation
            </span>
          )}
        </div>

        <div className="pledge-pool">
          <div className="pledge-pool-title">Open pledge pool — no tagging, no direct contact</div>
          {pledges.filter((p) => p.status !== "cancelled").map((p) => (
            <div className="pledge-item" key={p.id}>
              <span className="pledge-portion">{p.portion}</span>
              <span className="pledge-giver">
                by {p.giver_id === viewerId ? "you" : "a community member"}
              </span>
              <span
                className="pledge-state chip"
                style={
                  p.status === "confirmed"
                    ? { color: "var(--good)", borderColor: "rgba(76,175,80,0.5)" }
                    : p.status === "handed_off"
                    ? { color: "var(--warn)", borderColor: "rgba(212,162,51,0.5)" }
                    : undefined
                }
              >
                {PLEDGE_LABEL[p.status]}
              </span>
            </div>
          ))}

          {need.status !== "fulfilled" && need.status !== "cancelled" && (
            <form
              className="pledge-form"
              onSubmit={(e) => {
                e.preventDefault();
                pledge();
              }}
            >
              <input
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                placeholder={`What can you give? (e.g. ${need.quantity})`}
              />
              <select value={anchor} onChange={(e) => setAnchor(e.target.value)}>
                <option value="">Drop or meet…</option>
                {anchorPoints.map((a) => (
                  <option key={a.id} value={a.id}>
                    Leave at {a.name} ({a.area})
                  </option>
                ))}
              </select>
              <button className="btn btn-good btn-sm" disabled={busy || !portion.trim()}>
                Pledge →
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}