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
  isOpen = false,
}: {
  needId: string;
  comments: Comment[];
  users: User[];
  viewerId: string;
  isOpen?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const commentText = text.trim();
    if (!commentText) return;
    setBusy(true);

    const tempComment: Comment = {
      id: `c-temp-${Date.now()}`,
      need_card_id: needId,
      author_id: viewerId,
      text: commentText,
      created_at: new Date().toISOString(),
    };

    setPendingComments((prev) => [...prev, tempComment]);
    setText("");

    try {
      await fetch(`/api/needs/${needId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });
      router.refresh();
    } catch {
      // Revert if failed
      setPendingComments((prev) => prev.filter((c) => c.id !== tempComment.id));
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  const displayedComments = [
    ...comments,
    ...pendingComments.filter((p) => !comments.some((c) => c.id === p.id || c.text === p.text)),
  ];

  return (
    <div className="reddit-comments-block">
      <form onSubmit={submitComment} className="reddit-comment-composer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What are your thoughts or local updates?"
          required
        />
        <button type="submit" disabled={busy || !text.trim()}>
          {busy ? "Posting..." : "Comment"}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        {displayedComments.map((c) => {
          const author = users.find((u) => u.id === c.author_id);
          const authorInitial = (author?.display_name ?? "U").slice(0, 1).toUpperCase();
          return (
            <div key={c.id} className="reddit-comment-thread">
              <div className="reddit-comment-avatar">
                {authorInitial}
              </div>
              <div className="reddit-comment-main">
                <div className="reddit-comment-meta">
                  <span>u/{author?.display_name ?? "community_member"}</span>
                  {author?.honor_badge ? (
                    <span className="reddit-author-badge">Honor x{author.honor_badge}</span>
                  ) : null}
                  <span className="faint">•</span>
                  <span className="reddit-post-time">{timeAgo(c.created_at)}</span>
                </div>
                <p className="reddit-comment-text">{c.text}</p>
              </div>
            </div>
          );
        })}
        {displayedComments.length === 0 && (
          <div className="faint" style={{ fontSize: 13, padding: "12px 0", textAlign: "center" }}>
            No comments yet. Be the first to start the discussion!
          </div>
        )}
      </div>
    </div>
  );
}
