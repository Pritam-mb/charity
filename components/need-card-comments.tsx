"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Comment, User } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default function NeedCardComments({
  needId,
  comments,
  users,
  viewerId,
  upvotes,
  downvotes,
  userVote,
}: {
  needId: string;
  comments: Comment[];
  users: User[];
  viewerId: string;
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(downvotes);
  const [myVote, setMyVote] = useState<"up" | "down" | undefined>(userVote);

  const vote = async (kind: "up" | "down") => {
    const prev = myVote;
    // Optimistic
    if (myVote === kind) {
      setMyVote(undefined);
      kind === "up" ? setLocalUpvotes(v => v - 1) : setLocalDownvotes(v => v - 1);
    } else {
      if (myVote === "up") setLocalUpvotes(v => v - 1);
      if (myVote === "down") setLocalDownvotes(v => v - 1);
      setMyVote(kind);
      kind === "up" ? setLocalUpvotes(v => v + 1) : setLocalDownvotes(v => v + 1);
    }
    const res = await fetch(`/api/needs/${needId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    if (!res.ok) {
      // Revert
      setMyVote(prev);
      setLocalUpvotes(upvotes);
      setLocalDownvotes(downvotes);
    }
    router.refresh();
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/needs/${needId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setText("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-interactions">
      {/* Vote / Comment row */}
      <div className="interaction-bar">
        <button
          className={`vote-btn ${myVote === "up" ? "voted-up" : ""}`}
          onClick={() => vote("up")}
          title="Upvote"
        >
          ▲ <span>{localUpvotes}</span>
        </button>
        <button
          className={`vote-btn ${myVote === "down" ? "voted-down" : ""}`}
          onClick={() => vote("down")}
          title="Downvote"
        >
          ▼ <span>{localDownvotes}</span>
        </button>
        <button className="comment-toggle-btn" onClick={() => setOpen(o => !o)}>
          💬 {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </button>
      </div>

      {open && (
        <div className="comment-section">
          {comments.map(c => {
            const author = users.find(u => u.id === c.author_id);
            return (
              <div key={c.id} className="comment-item">
                <div className="comment-avatar">
                  {(author?.display_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="comment-body">
                  <div className="comment-author">
                    {author?.display_name ?? "Someone"}
                    {author?.honor_badge ? <span className="badge-pill" style={{ marginLeft: 6 }}>🏆 x{author.honor_badge}</span> : null}
                    <span className="comment-time">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && <div className="faint" style={{ fontSize: 13, padding: "8px 0" }}>Be the first to comment.</div>}
          <form onSubmit={submitComment} className="comment-form">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write a comment…"
              required
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
              {busy ? "…" : "Post"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
