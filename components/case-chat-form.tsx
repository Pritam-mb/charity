"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CaseChatForm({
  caseId,
  userId,
}: {
  caseId: string;
  userId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), author_id: userId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(j?.error ?? "Failed to post message");
      } else {
        setText("");
      }
    } finally {
      setBusy(false);
      router.refresh();
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message to the group..."
          className="field"
          style={{ flex: 1, margin: 0 }}
        />
        <button className="btn btn-primary" disabled={busy || !text.trim()} type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
