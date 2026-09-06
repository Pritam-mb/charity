"use client";

import { useState } from "react";
import type { FolloweeType } from "@/lib/types";

export default function FollowButton({
  followeeType,
  followeeId,
  viewerId,
  initialFollowed = false,
  initialWantUpdates = true,
  label,
  compact = false,
}: {
  followeeType: FolloweeType;
  followeeId: string;
  viewerId: string;
  initialFollowed?: boolean;
  initialWantUpdates?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const [followed, setFollowed] = useState(initialFollowed);
  const [wantUpdates, setWantUpdates] = useState(initialWantUpdates);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: viewerId, followee_type: followeeType, followee_id: followeeId, ...body }),
      });
      return await res.json();
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async () => {
    if (busy) return;
    if (followed) {
      const j = await call({ action: "unfollow" });
      if (j && j.followed === false) setFollowed(false);
      return;
    }
    const j = await call({ action: "toggle", want_updates: true });
    if (j && j.followed) {
      setFollowed(true);
      setWantUpdates(true);
      setNote("");
      setTimeout(() => setNote("Following"));
      setTimeout(() => setNote(""), 1800);
    }
  };

  const handleUpdates = async (val: boolean) => {
    if (busy) return;
    setWantUpdates(val);
    const j = await call({ action: "set_updates", want_updates: val });
    if (j && typeof j.want_updates === "boolean") setWantUpdates(j.want_updates);
  };

  return (
    <div className={`follow-pill ${followed ? "following" : ""} ${compact ? "compact" : ""}`}>
      {compact ? (
        <button
          type="button"
          className={`follow-plus-btn ${followed ? "following" : ""}`}
          onClick={handleToggle}
          disabled={busy}
          data-testid="follow-btn"
          title={
            followed
              ? "Following — click to unfollow"
              : "Follow to get case updates"
          }
        >
          {followed ? (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
      ) : (
        <>
          <button
            type="button"
            className="follow-pill-btn"
            onClick={handleToggle}
            disabled={busy}
            data-testid="follow-btn"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill={followed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>{label ? label : followed ? "Following" : "Follow"}</span>
          </button>

          {followed && (
            <label className={`follow-updates-toggle ${wantUpdates ? "on" : ""}`} title={wantUpdates ? "Updates on: you will be notified about this" : "Turn off future update notifications"}>
              <input
                type="checkbox"
                checked={wantUpdates}
                onChange={(e) => handleUpdates(e.target.checked)}
                disabled={busy}
              />
              <span className="follow-updates-slider" />
              <span className="follow-updates-label">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                </svg>
                Updates
              </span>
            </label>
          )}

          {note && <span className="follow-note">{note}</span>}
        </>
      )}
    </div>
  );
}