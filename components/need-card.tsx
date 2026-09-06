"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AnchorPoint, CasePage, Comment, NeedCard, Pledge, User } from "@/lib/types";
import { categoryInfo, formatCategory, formatUrgency, urgencyInfo } from "@/lib/categories";
import { timeAgo } from "@/lib/utils";
import Poster from "./poster";
import Link from "next/link";
import NeedCardComments from "./need-card-comments";

const STATUS_COLOR: Record<string, string> = {
  open: "var(--reddit-green)",
  partially_fulfilled: "var(--reddit-warn)",
  fulfilled: "var(--reddit-blue)",
  cancelled: "var(--reddit-danger)",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  partially_fulfilled: "Partial",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const PLEDGE_LABEL: Record<string, string> = {
  pledged: "Pledged",
  handed_off: "Handed off",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export default function NeedCardItem({
  need,
  pledges: initialPledges,
  casePage,
  caseAlias,
  anchorPoints,
  viewerId,
  shareCount: initialShareCount,
  reactionCount: initialReactionCount,
  users,
  comments,
  isSupported: initialIsSupported = false,
}: {
  need: NeedCard;
  pledges: Pledge[];
  casePage?: CasePage;
  caseAlias?: string;
  caseArea?: string;
  anchorPoints: AnchorPoint[];
  viewerId: string;
  shareCount: number;
  reactionCount: number;
  users: User[];
  comments: Comment[];
  userVote?: "up" | "down";
  isSupported?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [portion, setPortion] = useState("");
  const [anchor, setAnchor] = useState("");
  const [showPledge, setShowPledge] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [pledgeSuccess, setPledgeSuccess] = useState(false);

  // Optimistic interaction state
  const [localReactions, setLocalReactions] = useState(initialReactionCount);
  const [hasSupported, setHasSupported] = useState(initialIsSupported);
  const [localShares, setLocalShares] = useState(initialShareCount);
  const [shareCopied, setShareCopied] = useState(false);

  // Local pledges list
  const [localPledges, setLocalPledges] = useState<Pledge[]>(initialPledges);
  const [isHandedOff, setIsHandedOff] = useState(false);

  const [prevNeedData, setPrevNeedData] = useState({
    initialPledges,
    initialReactionCount,
    initialShareCount,
    initialIsSupported,
  });

  if (
    prevNeedData.initialPledges !== initialPledges ||
    prevNeedData.initialReactionCount !== initialReactionCount ||
    prevNeedData.initialShareCount !== initialShareCount ||
    prevNeedData.initialIsSupported !== initialIsSupported
  ) {
    setPrevNeedData({
      initialPledges,
      initialReactionCount,
      initialShareCount,
      initialIsSupported,
    });
    setLocalPledges(initialPledges);
    setLocalReactions(initialReactionCount);
    setLocalShares(initialShareCount);
    setHasSupported(initialIsSupported);
  }

  const cat = categoryInfo(need.ai_tags.category);
  const urg = urgencyInfo(need.ai_tags.urgency);

  const vidPledges = localPledges.filter((p) => p.giver_id === viewerId);
  const myPledge = vidPledges.find((p) => p.status === "pledged");
  const myHandedOff = isHandedOff || vidPledges.some((p) => p.status === "handed_off");

  // Instant optimistic Toggle Support handler
  const handleSupport = async () => {
    if (busy) return;
    const nextSupported = !hasSupported;
    setHasSupported(nextSupported);
    setLocalReactions((prev) => (nextSupported ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await fetch(`/api/needs/${need.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: viewerId, kind: "support" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.supported === "boolean") {
          setHasSupported(data.supported);
        }
      }
    } catch (e) {
      console.error(e);
      // Rollback on network failure
      setHasSupported(!nextSupported);
      setLocalReactions((prev) => (!nextSupported ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  // Instant optimistic Share handler
  const handleShare = async () => {
    setLocalShares((prev) => prev + 1);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2200);

    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/#need-${need.id}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {}
    }

    try {
      await fetch(`/api/needs/${need.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharer_id: viewerId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Instant Hand-off handler
  const handleHandoff = async () => {
    if (!myPledge || busy) return;
    setBusy(true);
    setIsHandedOff(true);
    try {
      const res = await fetch(`/api/needs/${need.id}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pledge_id: myPledge.id }),
      });
      if (!res.ok) {
        setIsHandedOff(false);
        const j = await res.json().catch(() => null);
        alert(j?.error ?? "Hand-off request failed");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  // Submit Pledge to Pool
  const handlePledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portion.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/needs/${need.id}/pledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giver_id: viewerId,
          portion: portion.trim(),
          anchor_point_id: anchor || null,
        }),
      });
      if (res.ok) {
        const j = await res.json();
        if (j.pledge) {
          setLocalPledges((prev) => [...prev, j.pledge]);
        }
        setPledgeSuccess(true);
        setPortion("");
        setTimeout(() => {
          setPledgeSuccess(false);
          setShowPledge(false);
        }, 1500);
        router.refresh();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error ?? "Failed to register pledge");
      }
    } finally {
      setBusy(false);
    }
  };

  const author = users.find((u) => u.id === (need.owner_type === "self" ? need.owner_id : viewerId));

  // Determine advocate/steward and beneficiary names for charity representation
  const steward = casePage
    ? users.find((u) => casePage.stewards.includes(u.id))
    : null;

  const posterDisplayName = casePage
    ? (steward?.display_name ?? `${casePage.alias} Care Steward`)
    : (author?.display_name ?? "Community Volunteer");

  const beneficiaryDisplayName = casePage
    ? casePage.alias
    : caseAlias
    ? caseAlias
    : need.caption.toLowerCase().includes("uncle ramu")
    ? "Uncle Ramu (night guard)"
    : `a resident in ${need.area}`;

  const affiliationLabel = casePage?.handler_name
    ? casePage.handler_name
    : casePage
    ? "Verified Mutual Aid Group"
    : "Neighborhood Mutual Aid";

  return (
    <article className="reddit-post-card elevated-post" id={`need-${need.id}`}>
      {/* Main Post Content (Full Width - No Vote Spine) */}
      <div className="reddit-post-main">
        {/* Post Metadata Header */}
        <div className="reddit-post-header">
          {/* Steward / Advocate Advocacy Byline */}
          <div className="post-steward-byline">
            <div className="steward-avatar-badge" title="Verified Mutual Aid Steward / Advocate">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
            </div>
            <div className="byline-content">
              <div className="byline-primary-row">
                <span className="byline-prefix">Posted by</span>
                <span className="byline-poster-name">{posterDisplayName}</span>
                <span className="byline-connector">on behalf of</span>
                {casePage ? (
                  <Link href={`/cases/${casePage.id}`} className="byline-beneficiary-tag">
                    {beneficiaryDisplayName}
                  </Link>
                ) : (
                  <span className="byline-beneficiary-tag direct">
                    {beneficiaryDisplayName}
                  </span>
                )}
              </div>
              <div className="byline-secondary-row">
                <span className="byline-affiliation">{affiliationLabel}</span>
                <span className="byline-dot">•</span>
                <span className="byline-time">{timeAgo(need.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Categorical & Urgency Flairs */}
          <div className="reddit-flair-row">
            <span
              className="reddit-flair reddit-flair-category"
              style={{ background: cat.color }}
            >
              {formatCategory(need.ai_tags.category)}
            </span>
            <span className="reddit-flair reddit-flair-area">
              {need.area}
            </span>
            <span
              className="reddit-flair reddit-flair-urgency"
              style={{ color: urg.color, background: `${urg.color}1c`, borderColor: `${urg.color}55` }}
            >
              {formatUrgency(need.ai_tags.urgency)}
            </span>
            <span
              className="reddit-flair-status"
              style={{
                color: STATUS_COLOR[need.status],
                background: `${STATUS_COLOR[need.status]}18`,
                border: `1px solid ${STATUS_COLOR[need.status]}44`,
              }}
            >
              {STATUS_LABEL[need.status]}
            </span>
          </div>
        </div>

        {/* Post Body */}
        <div className="reddit-post-body">
          <h2 className="reddit-post-title">{need.caption}</h2>

          <div className="reddit-post-meta-details">
            <span className="reddit-meta-pill">
              Item: <strong>{need.ai_tags.item_type}</strong>
            </span>
            <span className="reddit-meta-pill">
              Quantity: <strong>{need.quantity}</strong>
            </span>
            {need.tagged_org && (
              <span className="reddit-meta-pill org-pill">
                Org: @{need.tagged_org}
              </span>
            )}
          </div>

          {/* Media Frame */}
          <div className="reddit-post-media">
            <Poster
              mediaKey={need.media_key}
              category={need.ai_tags.category}
              caption={need.caption}
              height="16 / 8"
            />
          </div>
        </div>

        {/* Bottom Action Row: STRICT ORDER = Support -> Comment -> Share -> Pledge Help */}
        <div className="reddit-post-actions">
          {/* 1. Support Button (Toggleable) */}
          <button
            type="button"
            className={`reddit-action-pill ${hasSupported ? "active" : ""}`}
            onClick={handleSupport}
            title={hasSupported ? "Click to unsupport" : "Support this need"}
            aria-pressed={hasSupported}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill={hasSupported ? "var(--reddit-orange)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <span>{hasSupported ? "Supported" : "Support"} ({localReactions})</span>
          </button>

          {/* 2. Comments Toggle */}
          <button
            type="button"
            className={`reddit-action-pill ${showComments ? "active" : ""}`}
            onClick={() => setShowComments((prev) => !prev)}
            title="View discussion comments"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{comments.length} Comments</span>
          </button>

          {/* 3. Share Button (Instant Copy & Feedback) */}
          <button
            type="button"
            className={`reddit-action-pill ${shareCopied ? "active" : ""}`}
            onClick={handleShare}
            title="Share this need with neighbors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>{shareCopied ? "Copied Link!" : "Share"} ({localShares})</span>
          </button>

          {/* 4. Pledge / Handoff Triggers (Right Aligned) */}
          {need.status !== "fulfilled" && need.status !== "cancelled" && (
            <button
              type="button"
              className={`reddit-action-pill help-btn ${showPledge ? "active" : ""}`}
              onClick={() => setShowPledge((prev) => !prev)}
            >
              {showPledge ? "Close" : "Pledge Help"}
            </button>
          )}

          {myPledge && !myHandedOff && need.status !== "fulfilled" && (
            <button
              type="button"
              className="reddit-action-pill"
              style={{ marginLeft: "auto", borderColor: "var(--reddit-green)", color: "var(--reddit-green)" }}
              disabled={busy}
              onClick={handleHandoff}
            >
              Mark Handed Off
            </button>
          )}

          {myHandedOff && (
            <span className="reddit-action-pill" style={{ marginLeft: "auto", color: "var(--reddit-warn)" }}>
              Awaiting Steward Confirmation
            </span>
          )}
        </div>

        {/* Expandable Pledge Pool Drawer */}
        {showPledge && need.status !== "fulfilled" && (
          <div className="reddit-pledge-drawer">
            <div className="reddit-pledge-header">
              Open Pledge Pool (In-Kind Only - No Cash)
            </div>

            {pledgeSuccess && (
              <div style={{ color: "var(--reddit-green)", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Pledge successfully registered! Thank you for supporting your neighbor.
              </div>
            )}

            <div className="reddit-pledge-list">
              {localPledges.filter((p) => p.status !== "cancelled").map((p) => {
                const giver = users.find((u) => u.id === p.giver_id);
                return (
                  <div className="reddit-pledge-item" key={p.id}>
                    <span>
                      <strong>{p.portion}</strong> pledged by{" "}
                      {p.giver_id === viewerId ? "You" : (giver?.display_name ?? "Neighbor")}
                      {giver?.honor_badge ? ` (Honor x${giver.honor_badge})` : ""}
                    </span>
                    <span
                      className="chip"
                      style={
                        p.status === "confirmed"
                          ? { color: "var(--reddit-green)" }
                          : p.status === "handed_off"
                          ? { color: "var(--reddit-warn)" }
                          : {}
                      }
                    >
                      {PLEDGE_LABEL[p.status]}
                    </span>
                  </div>
                );
              })}
            </div>

            <form className="reddit-pledge-form" onSubmit={handlePledgeSubmit}>
              <input
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                placeholder={`How much can you provide? (e.g. ${need.quantity})`}
                required
              />
              <select value={anchor} onChange={(e) => setAnchor(e.target.value)}>
                <option value="">Choose Drop Point / Anchor Point...</option>
                {anchorPoints.map((a) => (
                  <option key={a.id} value={a.id}>
                    Leave at {a.name} ({a.area})
                  </option>
                ))}
              </select>
              <button type="submit" disabled={busy || !portion.trim()}>
                {busy ? "Saving..." : "Confirm Pledge"}
              </button>
            </form>
          </div>
        )}

        {/* Threaded Comments Section */}
        <NeedCardComments
          needId={need.id}
          comments={comments}
          users={users}
          viewerId={viewerId}
          isOpen={showComments}
        />
      </div>
    </article>
  );
}
