"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AnchorPoint, Comment, NeedCard, Pledge, User, Vote } from "@/lib/types";
import { categoryInfo, formatCategory, formatUrgency, urgencyInfo } from "@/lib/categories";
import { timeAgo } from "@/lib/utils";
import Poster from "./poster";
import Link from "next/link";
import NeedCardComments from "./need-card-comments";

const STATUS_COLOR: Record<string, string> = {
  open: "var(--good)",
  partially_fulfilled: "var(--warn)",
  fulfilled: "var(--accent)",
  cancelled: "var(--danger)",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  partially_fulfilled: "Partial",
  fulfilled: "Fulfilled ✓",
  cancelled: "Cancelled",
};

const PLEDGE_LABEL: Record<string, string> = {
  pledged: "Pledged",
  handed_off: "Handed off",
  confirmed: "Confirmed ✓",
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
  reactionCount,
  users,
  comments,
  userVote,
}: {
  need: NeedCard;
  pledges: Pledge[];
  caseAlias?: string;
  caseArea?: string;
  anchorPoints: AnchorPoint[];
  viewerId: string;
  shareCount: number;
  reactionCount: number;
  users: User[];
  comments: Comment[];
  userVote?: "up" | "down";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [portion, setPortion] = useState("");
  const [anchor, setAnchor] = useState("");
  const [showPledge, setShowPledge] = useState(false);
  const cat = categoryInfo(need.ai_tags.category);
  const urg = urgencyInfo(need.ai_tags.urgency);

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

  return (
    <article className="insta-card">
      {/* Header */}
      <div className="insta-header">
        <div className="insta-avatar" style={{ background: cat.color }}>
          {(caseAlias ?? viewerId).slice(0, 1).toUpperCase()}
        </div>
        <div className="insta-header-text">
          <div className="insta-username">
            {caseAlias ? (
              <Link href={`/cases/${need.owner_id}`} style={{ color: "var(--text)" }}>{caseAlias}</Link>
            ) : (
              "Self-posted need"
            )}
            {need.tagged_org && (
              <span className="org-tag">@ {need.tagged_org}</span>
            )}
          </div>
          <div className="insta-meta">
            <span className="chip area-chip" style={{ fontSize: 11, padding: "2px 8px" }}>📍 {need.area}</span>
            <span style={{ color: "var(--text-faint)", fontSize: 12 }}>{timeAgo(need.created_at)}</span>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="chip"
            style={{ background: STATUS_COLOR[need.status] + "22", color: STATUS_COLOR[need.status], border: `1px solid ${STATUS_COLOR[need.status]}55`, fontSize: 12 }}
          >
            {STATUS_LABEL[need.status]}
          </span>
          <span className="chip" style={{ background: urg.color + "22", color: urg.color, fontSize: 12 }}>
            {formatUrgency(need.ai_tags.urgency)}
          </span>
        </div>
      </div>

      {/* Media */}
      <div className="insta-media">
        <Poster mediaKey={need.media_key} category={need.ai_tags.category} caption={need.caption} height="4 / 3" />
      </div>

      {/* Tags */}
      <div className="insta-tags">
        <span className="chip tag-chip" style={{ background: cat.color }}>
          {formatCategory(need.ai_tags.category)}
        </span>
        <span className="chip">{need.ai_tags.item_type}</span>
        <span className="chip">{need.quantity}</span>
      </div>

      {/* Caption */}
      <div className="insta-caption">
        <span className="insta-caption-name">
          {caseAlias ?? "Community"}
        </span>{" "}
        {need.caption}
      </div>

      {/* Action Bar */}
      <div className="insta-actions">
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button
            className="insta-action-btn"
            disabled={busy}
            onClick={() => post(`/api/needs/${need.id}/react`, { user_id: viewerId, kind: "support" })}
            title="Raise hand"
          >
            🙌
          </button>
          <span className="insta-action-count">{reactionCount}</span>
        </div>

        <button
          className="insta-action-btn"
          disabled={busy}
          onClick={() => post(`/api/needs/${need.id}/share`, { sharer_id: viewerId })}
          title="Share"
        >
          ↗
        </button>
        <span className="insta-action-count">{shareCount}</span>

        {need.status !== "fulfilled" && need.status !== "cancelled" && (
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => setShowPledge(s => !s)}
          >
            🤝 Help
          </button>
        )}
        {myPledge && need.status !== "fulfilled" && (
          <button className="btn btn-sm" style={{ marginLeft: "auto", borderColor: "var(--good)", color: "var(--good)" }} disabled={busy} onClick={() => post(`/api/needs/${need.id}/handoff`, { pledge_id: myPledge.id })}>
            ✓ Handed off
          </button>
        )}
        {myHandedOff && (
          <span className="chip" style={{ marginLeft: "auto", color: "var(--warn)" }}>Awaiting confirmation</span>
        )}
      </div>

      {/* Comments & Votes */}
      <NeedCardComments
        needId={need.id}
        comments={comments}
        users={users}
        viewerId={viewerId}
        upvotes={need.upvotes}
        downvotes={need.downvotes}
        userVote={userVote}
      />

      {/* Pledge pool */}
      {showPledge && need.status !== "fulfilled" && (
        <div className="insta-pledge">
          <div className="pledge-pool-title">Pledge what you can provide</div>
          {pledges.filter(p => p.status !== "cancelled").map(p => {
            const giver = users.find(u => u.id === p.giver_id);
            return (
              <div className="pledge-item" key={p.id}>
                <span className="pledge-portion">{p.portion}</span>
                <span className="pledge-giver">
                  by {p.giver_id === viewerId ? "you" : (giver?.display_name ?? "community member")}
                  {giver?.honor_badge ? ` 🏆x${giver.honor_badge}` : ""}
                </span>
                <span className="pledge-state chip" style={
                  p.status === "confirmed" ? { color: "var(--good)" } : p.status === "handed_off" ? { color: "var(--warn)" } : {}
                }>
                  {PLEDGE_LABEL[p.status]}
                </span>
              </div>
            );
          })}
          <form className="pledge-form" onSubmit={e => { e.preventDefault(); post(`/api/needs/${need.id}/pledge`, { giver_id: viewerId, portion: portion.trim() || "A share", anchor_point_id: anchor || null }); setPortion(""); setShowPledge(false); }}>
            <input value={portion} onChange={e => setPortion(e.target.value)} placeholder={`What can you give? (e.g. ${need.quantity})`} />
            <select value={anchor} onChange={e => setAnchor(e.target.value)}>
              <option value="">Drop or meet…</option>
              {anchorPoints.map(a => <option key={a.id} value={a.id}>Leave at {a.name} ({a.area})</option>)}
            </select>
            <button className="btn btn-good btn-sm" disabled={busy || !portion.trim()}>Pledge →</button>
          </form>
        </div>
      )}
    </article>
  );
}
