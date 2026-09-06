"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AREAS } from "@/lib/categories";

export default function CaseForm({
  stewardId,
  stewardName,
}: {
  stewardId: string;
  stewardName: string;
}) {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [area, setArea] = useState("");
  const [intro, setIntro] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = alias.trim() && area && intro.trim() && consent;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: alias.trim(),
          broad_area: area,
          intro_text: intro.trim(),
          steward_id: stewardId,
          consent_clip: true,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j?.error ?? "Failed to create page");
      } else {
        router.push(`/cases/${j.page.id}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <div className="field">
        <label>Alias name (never the legal name)</label>
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="e.g. Arjun, Maya, Uncle Shankar"
        />
      </div>

      <div className="field">
        <label>Broad area (neighborhood, never an exact address)</label>
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Select area…</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Introduction — what should givers understand before they pledge?</label>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="Who they are, what happened, what help actually looks like. Keep it factual."
        />
      </div>

      <div className="consent-box" style={{ marginBottom: 16 }}>
        <label className="toggle-row">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I confirm a <strong>recorded verbal consent clip</strong> was captured with the
            beneficiary (or a guardian/advocate), as required before any Case Page publishes.
          </span>
        </label>
      </div>

      <div className="consent-box" style={{ marginBottom: 16 }}>
        <p style={{ marginBottom: 6 }}>
          You&apos;re opening this page as <strong>{stewardName}</strong>. Stewardship is never a
          solo-run page in the long run — a second co-steward is required within a grace period
          after the page goes public. No payment fields exist on Case Pages by design.
        </p>
      </div>

      <button className="btn btn-primary" type="submit" disabled={busy || !canSubmit}>
        {busy ? "Opening…" : "Open the Case Page →"}
      </button>
    </form>
  );
}