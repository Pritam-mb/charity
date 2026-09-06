"use client";

import { useMemo, useState } from "react";
import type { AnchorPoint, CasePage, NeedCard as NeedCardType, Pledge } from "@/lib/types";
import { AREAS, CATEGORIES } from "@/lib/categories";
import NeedCard from "./need-card";

export default function Feed({
  needs,
  pledges,
  cases,
  anchorPoints,
  viewerId,
  shareCounts,
}: {
  needs: NeedCardType[];
  pledges: Pledge[];
  cases: CasePage[];
  anchorPoints: AnchorPoint[];
  viewerId: string;
  shareCounts: Record<string, number>;
}) {
  const [cat, setCat] = useState<string>("all");
  const [area, setArea] = useState<string>("all");

  const caseById = useMemo(
    () => new Map(cases.map((c) => [c.id, c])),
    [cases]
  );

  const filtered = needs.filter((n) => {
    if (cat !== "all" && n.ai_tags.category !== cat) return false;
    if (area !== "all" && n.area !== area) return false;
    return true;
  });

  const openCount = filtered.filter(
    (n) => n.status === "open" || n.status === "partially_fulfilled"
  ).length;

  return (
    <div>
      <div className="feed-toolbar">
        <div className="filter-row">
          <button
            className={`filter-btn ${cat === "all" ? "active" : ""}`}
            onClick={() => setCat("all")}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`filter-btn ${cat === c.value ? "active" : ""}`}
              onClick={() => setCat(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <button
            className={`filter-btn ${area === "all" ? "active" : ""}`}
            onClick={() => setArea("all")}
          >
            Anywhere
          </button>
          {AREAS.map((a) => (
            <button
              key={a}
              className={`filter-btn ${area === a ? "active" : ""}`}
              onClick={() => setArea(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
        {filtered.length} needs · {openCount} open
      </div>

      {filtered.length === 0 && (
        <div className="empty">No needs match these filters.</div>
      )}

      {filtered.map((need) => (
        <NeedCard
          key={need.id}
          need={need}
          pledges={pledges.filter((p) => p.need_card_id === need.id)}
          caseAlias={
            need.owner_type === "case_page"
              ? caseById.get(need.owner_id)?.alias
              : undefined
          }
          caseArea={
            need.owner_type === "case_page"
              ? caseById.get(need.owner_id)?.broad_area
              : undefined
          }
          anchorPoints={anchorPoints}
          viewerId={viewerId}
          shareCount={shareCounts[need.id] ?? 0}
        />
      ))}
    </div>
  );
}