"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CasePage, Urgency, Category } from "@/lib/types";
import { autoTag, type TagProposal } from "@/lib/auto-tag";
import { AREAS, CATEGORIES, URGENCIES } from "@/lib/categories";

export default function UploadForm({
  cases,
  viewerId,
}: {
  cases: CasePage[];
  viewerId: string;
}) {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [quantity, setQuantity] = useState("");
  const [area, setArea] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [ownerType, setOwnerType] = useState<"self" | "case_page">("self");
  const [caseId, setCaseId] = useState(cases[0]?.id ?? "");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [taggedOrg, setTaggedOrg] = useState("");

  // Instant local proposal as immediate feedback; server refines below.
  const localProposal = useMemo(() => autoTag(caption), [caption]);

  const [cat, setCat] = useState<Category>(localProposal.tags.category);
  const [itemType, setItemType] = useState(localProposal.tags.item_type);
  const [urgency, setUrgency] = useState<Urgency>(localProposal.tags.urgency);

  const [serverProposal, setServerProposal] = useState<TagProposal | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [tagging, setTagging] = useState(false);
  const [touched, setTouched] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      if (caption.trim().length < 4) {
        setServerProposal(null);
        setEngine(null);
        setTagging(false);
        return;
      }
      setTagging(true);
      try {
        const res = await fetch("/api/auto-tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caption }),
        });
        if (!res.ok) return;
        const j = await res.json();
        if (reqId.current !== id) return; // stale response
        setServerProposal(j.proposal);
        setEngine(j.engine);
        if (!touched) {
          setCat(j.proposal.tags.category);
          setItemType(j.proposal.tags.item_type);
          setUrgency(j.proposal.tags.urgency);
        }
      } catch {
        /* keep local proposal */
      } finally {
        if (reqId.current === id) setTagging(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [caption, touched]);

  const onCaptionChange = (value: string) => {
    setCaption(value);
    const p = autoTag(value);
    setCat(p.tags.category);
    setItemType(p.tags.item_type);
    setUrgency(p.tags.urgency);
    setTouched(false);
  };

  const displayed = serverProposal ?? localProposal;
  const engineLabel =
    engine === "google-ai"
      ? "Google AI (Gemini) auto-tag"
    : engine === "local"
      ? "Local auto-tag"
    : tagging
      ? "Tagging..."
      : "Local auto-tag";

  const canSubmit =
    caption.trim() && area && (ownerType === "self" || (ownerType === "case_page" && caseId && consent));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = await fetch("/api/needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: caption.trim(),
          quantity: quantity.trim() || "1 item",
          area,
          photo_name: photoName,
          tagged_org: taggedOrg.trim() || undefined,
          owner_type: ownerType,
          owner_id: ownerType === "self" ? viewerId : caseId,
          ai_tags: {
            category: cat,
            item_type: itemType.trim() || "household item",
            urgency,
          },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(j?.error ?? "Failed to post");
      } else {
        router.push("/");
      }
    } finally {
      setBusy(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <form className="form-card" onSubmit={submit}>
      {/* File Upload Dropzone */}
      <div className="form-field">
        <label className="form-label">
          <span>Photo or video evidence</span>
          <span className="form-hint" style={{ color: "var(--reddit-text-faint)" }}>Optional but recommended</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (evt) => {
                setPhotoName(evt.target?.result as string);
              };
              reader.readAsDataURL(file);
            } else {
              setPhotoName("");
            }
          }}
        />

        {photoName && photoName.startsWith("data:") ? (
          <div className="form-upload-preview">
            <img src={photoName} alt="Uploaded evidence" />
            <button
              type="button"
              className="form-upload-remove-btn"
              onClick={() => {
                setPhotoName("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Remove
            </button>
          </div>
        ) : (
          <div
            className="form-upload-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="form-upload-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className="form-upload-prompt">Click to attach photo or video evidence</div>
            <div className="form-upload-sub">Supports JPG, PNG, WEBP, MP4 (increases verification & community trust)</div>
          </div>
        )}
      </div>

      {/* Caption Textarea */}
      <div className="form-field">
        <label className="form-label">
          <span>What does the person need?</span>
          <span className="form-hint" style={{ color: "var(--reddit-orange)" }}>* Required</span>
        </label>
        <textarea
          className="form-textarea"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="e.g. Caregiver notice: Arjun needs a dry ration pack for tonight — he has nothing to eat."
        />
        <div className="form-hint">A clear factual sentence is enough. Local auto-tagging below will propose categories automatically.</div>
      </div>

      {/* AI / Auto-Tagging Proposal Box */}
      <div className="propose-box">
        <div className="prop-title">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--reddit-orange)" strokeWidth="2.2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span>{engineLabel} (editable)</span>
          <span className="prop-badge">{Math.round(displayed.confidence * 100)}% Confidence</span>
          {touched && <span style={{ color: "var(--reddit-orange)", fontSize: 11, marginLeft: "auto", fontWeight: 700 }}>Customized</span>}
        </div>
        <div className="propose-row">
          <select
            value={cat}
            onChange={(e) => { setCat(e.target.value as Category); setTouched(true); }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            value={itemType}
            onChange={(e) => { setItemType(e.target.value); setTouched(true); }}
            placeholder="Specific item type (e.g. Dry ration pack)"
          />
          <select
            value={urgency}
            onChange={(e) => { setUrgency(e.target.value as Urgency); setTouched(true); }}
          >
            {URGENCIES.map((u) => (
              <option key={u.value} value={u.value}>{u.label} Priority</option>
            ))}
          </select>
        </div>
        <div className="form-hint" style={{ fontSize: 12, marginTop: 4 }}>{displayed.notes}</div>
      </div>

      {/* Neighborhood & Quantity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <span>Area (neighborhood)</span>
            <span className="form-hint" style={{ color: "var(--reddit-orange)" }}>* Required</span>
          </label>
          <select className="form-select" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Select Kolkata neighborhood...</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="form-hint">Never post an exact home address for privacy.</div>
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="form-label">Quantity / portion</label>
          <input
            className="form-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 1 week's ration, 2 packets"
          />
          <div className="form-hint">Allows community members to fulfill pieces.</div>
        </div>
      </div>

      {/* Tag an Organisation */}
      <div className="form-field">
        <label className="form-label">
          <span>@ Tag an Organisation (optional)</span>
        </label>
        <input
          type="text"
          className="form-input"
          value={taggedOrg}
          onChange={(e) => setTaggedOrg(e.target.value)}
          placeholder="e.g. Bal Raksha, Red Cross, SOS Children's Village, Local Club"
        />
        <div className="form-hint">Tag an NGO or local community group to notify them directly about this request.</div>
      </div>

      {/* Posting on behalf of - Interactive Toggle Cards */}
      <div className="form-field">
        <label className="form-label">Posting on behalf of</label>
        <div className="persona-toggle-grid">
          <div
            className={`persona-toggle-card ${ownerType === "self" ? "active" : ""}`}
            onClick={() => setOwnerType("self")}
          >
            <div className="persona-radio-dot">
              <div className="persona-radio-inner" />
            </div>
            <div>
              <div className="persona-toggle-title">A Neighbor in Need</div>
              <div className="persona-toggle-sub">Posting as Volunteer / Advocate for a community member without a page</div>
            </div>
          </div>
          <div
            className={`persona-toggle-card ${ownerType === "case_page" ? "active" : ""}`}
            onClick={() => setOwnerType("case_page")}
          >
            <div className="persona-radio-dot">
              <div className="persona-radio-inner" />
            </div>
            <div>
              <div className="persona-toggle-title">A Verified Case Page</div>
              <div className="persona-toggle-sub">Post under an existing persistent Case Page as an authorized Steward</div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Page Selection & Consent */}
      {ownerType === "case_page" && (
        <div style={{ marginTop: 14 }}>
          <div className="form-field">
            <label className="form-label">Which Beneficiary Case Page?</label>
            <select className="form-select" value={caseId} onChange={(e) => setCaseId(e.target.value)}>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.alias} — {c.broad_area}
                </option>
              ))}
            </select>
          </div>
          <div className="consent-card">
            <input
              type="checkbox"
              id="need-consent-checkbox"
              className="consent-checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <label htmlFor="need-consent-checkbox" className="consent-text" style={{ cursor: "pointer" }}>
              I confirm that the beneficiary (or an identifiable advocate) has given <strong>recorded verbal consent</strong> for this post.
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons Row - Website Theme Aligned to Right */}
      <div className="form-actions-bar">
        <button
          type="button"
          className="btn-form-cancel"
          onClick={() => router.push("/")}
        >
          Cancel
        </button>
        <button
          className="btn-form-submit"
          type="submit"
          disabled={busy || !canSubmit}
        >
          {busy ? "Publishing..." : "Publish Need Post"}
        </button>
      </div>
    </form>
  );
}
