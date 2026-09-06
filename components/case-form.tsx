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
    <form className="form-card" onSubmit={submit}>
      {/* Alias Name Field */}
      <div className="form-field">
        <label className="form-label">
          <span>Alias name (never the legal name)</span>
          <span className="form-hint" style={{ color: "var(--reddit-orange)" }}>* Required</span>
        </label>
        <input
          className="form-input"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="e.g. Arjun, Maya, Uncle Shankar"
        />
        <div className="form-hint">Protects the beneficiary&apos;s dignity, safety, and privacy from public exposure.</div>
      </div>

      {/* Broad Area Field */}
      <div className="form-field">
        <label className="form-label">
          <span>Broad area (neighborhood)</span>
          <span className="form-hint" style={{ color: "var(--reddit-orange)" }}>* Required</span>
        </label>
        <select className="form-select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Select Kolkata neighborhood...</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="form-hint">Used for hyperlocal matching. Never provide an exact street or home address.</div>
      </div>

      {/* Introduction Textarea */}
      <div className="form-field">
        <label className="form-label">
          <span>Introduction & Context</span>
          <span className="form-hint" style={{ color: "var(--reddit-orange)" }}>* Required</span>
        </label>
        <textarea
          className="form-textarea"
          style={{ minHeight: 110 }}
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="Who they are, current situation, what direct in-kind help actually looks like. Keep it factual and respectful."
        />
        <div className="form-hint">Givers review this background before pledging supplies or offering volunteer support.</div>
      </div>

      {/* Consent Verification Card */}
      <div className="consent-card">
        <input
          type="checkbox"
          id="case-consent-checkbox"
          className="consent-checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <label htmlFor="case-consent-checkbox" className="consent-text" style={{ cursor: "pointer" }}>
          I confirm a <strong>recorded verbal consent clip</strong> was captured with the beneficiary (or an authorized guardian/advocate), as required before any Case Page publishes.
        </label>
      </div>

      {/* Steward Governance Notice */}
      <div className="callout-notice">
        You&apos;re opening this page as <strong>{stewardName}</strong>. Stewardship is never a solo-run page in the long run. A second co-steward is required within a grace period after the page goes public. No payment fields exist on Case Pages by design.
      </div>

      {/* Action Buttons Bar - Website Theme Aligned to Right */}
      <div className="form-actions-bar">
        <button
          type="button"
          className="btn-form-cancel"
          onClick={() => router.push("/upload")}
        >
          Cancel
        </button>
        <button
          className="btn-form-submit"
          type="submit"
          disabled={busy || !canSubmit}
        >
          {busy ? "Opening..." : "Open Case Page"}
        </button>
      </div>
    </form>
  );
}
