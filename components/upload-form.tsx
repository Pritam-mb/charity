"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CasePage, Urgency, Category } from "@/lib/types";
import { autoTag } from "@/lib/auto-tag";
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
  const [ownerType, setOwnerType] = useState<"self" | "case_page">("self");
  const [caseId, setCaseId] = useState(cases[0]?.id ?? "");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const proposal = useMemo(() => autoTag(caption), [caption]);

  const [cat, setCat] = useState<Category>(proposal.tags.category);
  const [itemType, setItemType] = useState(proposal.tags.item_type);
  const [urgency, setUrgency] = useState<Urgency>(proposal.tags.urgency);

  const onCaptionChange = (value: string) => {
    setCaption(value);
    const p = autoTag(value);
    setCat(p.tags.category);
    setItemType(p.tags.item_type);
    setUrgency(p.tags.urgency);
  };

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

  return (
    <form className="card" onSubmit={submit}>
      <div className="field">
        <label>What does the person need? (film/dictate style caption)</label>
        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="e.g. Arjun needs a dry ration pack for tonight — he has nothing to eat."
        />
      </div>

      <div className="propose-box">
        <div className="prop-title">
          ✨ Local auto-tag (editable) — confidence {Math.round(proposal.confidence * 100)}%
        </div>
        <div className="propose-row">
          <select value={cat} onChange={(e) => setCat(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            placeholder="Item type"
            style={{ flex: 1 }}
          />
          <select value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
            {URGENCIES.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
        <div className="faint">{proposal.notes}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="field">
          <label>Area (neighborhood, never an exact address)</label>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Select area…</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Quantity / portion</label>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 1 week's ration"
          />
        </div>
      </div>

      <div className="field">
        <label>Posting on behalf of</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className={`filter-btn ${ownerType === "self" ? "active" : ""}`}
            onClick={() => setOwnerType("self")}
          >
            Myself / my community
          </button>
          <button
            type="button"
            className={`filter-btn ${ownerType === "case_page" ? "active" : ""}`}
            onClick={() => setOwnerType("case_page")}
          >
            A Case Page (as steward)
          </button>
        </div>
      </div>

      {ownerType === "case_page" && (
        <>
          <div className="field">
            <label>Which Case Page?</label>
            <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.alias} · {c.broad_area}
                </option>
              ))}
            </select>
          </div>
          <div className="consent-box" style={{ marginBottom: 16 }}>
            <label className="toggle-row">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                Check to confirm the beneficiary (or an advocate for them) has given recorded,
                informed consent for this post. This is mandatory — see problems.md
              </span>
            </label>
          </div>
        </>
      )}

      <button className="btn btn-primary" type="submit" disabled={busy || !canSubmit}>
        {busy ? "Posting…" : "Publish to the reel →"}
      </button>
    </form>
  );
}