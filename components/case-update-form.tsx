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
    <div className="card">
      <div className="pledge-pool-title" style={{ marginBottom: 10 }}>
        Post an update to the timeline (as steward)
      </div>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What changed for the beneficiary? (Spoken updates become text here in the full product.)"
          style={{ flex: 1, minWidth: 260, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}
        />
        <button className="btn btn-primary" disabled={busy || !text.trim()} type="submit">
          Post →
        </button>
      </form>
    </div>
  );
}