"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TimelineComposer({
  caseId,
  stewardId,
}: {
  caseId: string;
  stewardId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), author_id: stewardId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(j?.error ?? "Failed to post update");
      } else {
        setText("");
      }
    } finally {
      setBusy(false);
      router.refresh();
    }
  };

  return (
    <div className="steward-composer-box">
      <div className="steward-subhead">
        <span className="steward-subhead-title">Post Timeline Update</span>
        <span className="steward-role-pill">Steward</span>
      </div>
      <form onSubmit={submit} className="steward-composer-form">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="What changed for the beneficiary? (Spoken updates become text here in the full product.)"
          className="steward-textarea"
        />
        <div className="steward-composer-actions">
          <span className="steward-composer-hint">
            Visible on public audit timeline
          </span>
          <button
            className="steward-post-btn"
            disabled={busy || !text.trim()}
            type="submit"
          >
            {busy ? (
              <span>Posting...</span>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
