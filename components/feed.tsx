"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Achievement, AnchorPoint, CasePage, Comment, Follow, NeedCard as NeedCardType, Pledge, User } from "@/lib/types";
import { AREAS, CATEGORIES } from "@/lib/categories";
import { timeAgo } from "@/lib/utils";
import NeedCardItem from "./need-card";
import AreaMap from "./area-map";

type SortMode = "hot" | "new" | "urgent" | "open";

export default function Feed({
  needs,
  pledges,
  cases,
  anchorPoints,
  viewerId,
  shareCounts,
  reactionCounts,
  users,
  commentsByNeed,
  userVotes,
  userReactions = {},
  achievements = [],
  followsByCase = {},
  initialCategory = "all",
  initialArea = "all",
  initialSort = "new",
  searchQuery = "",
}: {
  needs: NeedCardType[];
  pledges: Pledge[];
  cases: CasePage[];
  anchorPoints: AnchorPoint[];
  viewerId: string;
  shareCounts: Record<string, number>;
  reactionCounts: Record<string, number>;
  users: User[];
  commentsByNeed: Record<string, Comment[]>;
  userVotes: Record<string, "up" | "down">;
  userReactions?: Record<string, boolean>;
  achievements?: Achievement[];
  followsByCase?: Record<string, Follow>;
  initialCategory?: string;
  initialArea?: string;
  initialSort?: SortMode;
  searchQuery?: string;
}) {
  const [cat, setCat] = useState<string>(initialCategory);
  const [area, setArea] = useState<string>(initialArea);
  const [sort, setSort] = useState<SortMode>(initialSort);
  const [showAchievements, setShowAchievements] = useState(false);

  const [prevProps, setPrevProps] = useState({
    category: initialCategory,
    area: initialArea,
    sort: initialSort,
  });

  if (
    prevProps.category !== initialCategory ||
    prevProps.area !== initialArea ||
    prevProps.sort !== initialSort
  ) {
    setPrevProps({
      category: initialCategory,
      area: initialArea,
      sort: initialSort,
    });
    setCat(initialCategory);
    setArea(initialArea);
    setSort(initialSort);
  }

  const caseById = useMemo(
    () => new Map(cases.map((c) => [c.id, c])),
    [cases]
  );

  // Filter & Search
  const filtered = useMemo(() => {
    return needs.filter((n) => {
      if (cat !== "all" && n.ai_tags.category !== cat) return false;
      if (area !== "all" && n.area.toLowerCase() !== area.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCaption = n.caption.toLowerCase().includes(q);
        const matchesItem = n.ai_tags.item_type.toLowerCase().includes(q);
        const matchesArea = n.area.toLowerCase().includes(q);
        const matchesCase = n.owner_type === "case_page" && (caseById.get(n.owner_id)?.alias.toLowerCase().includes(q) ?? false);
        if (!matchesCaption && !matchesItem && !matchesArea && !matchesCase) return false;
      }
      return true;
    });
  }, [needs, cat, area, searchQuery, caseById]);

  // Sort
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "new") {
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    if (sort === "urgent") {
      const rank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return list.sort((a, b) => (rank[b.ai_tags.urgency] ?? 0) - (rank[a.ai_tags.urgency] ?? 0));
    }
    if (sort === "open") {
      return list.filter((n) => n.status === "open" || n.status === "partially_fulfilled");
    }
    // "hot": reactions * 2 + shares
    return list.sort((a, b) => {
      const aScore = (reactionCounts[a.id] ?? 0) * 2 + (shareCounts[a.id] ?? 0);
      const bScore = (reactionCounts[b.id] ?? 0) * 2 + (shareCounts[b.id] ?? 0);
      return bScore - aScore;
    });
  }, [filtered, sort, reactionCounts, shareCounts]);

  const openCount = needs.filter(
    (n) => n.status === "open" || n.status === "partially_fulfilled"
  ).length;

  const areaMapPoints = useMemo(() => {
    const active = needs.filter(
      (n) =>
        (cat === "all" || n.ai_tags.category === cat) &&
        (n.status === "open" || n.status === "partially_fulfilled") &&
        (area === "all" || n.area.toLowerCase() === area.toLowerCase())
    );
    const byArea = new Map<string, { id: string; caption: string; status: string }[]>();
    active.forEach((n) => {
      const list = byArea.get(n.area) ?? [];
      list.push({ id: n.id, caption: n.caption, status: n.status });
      byArea.set(n.area, list);
    });
    const names = Array.from(byArea.keys()).sort();
    const suggestedAreas = names.length > 0 ? names : AREAS.map((a) => a.toLowerCase());
    return suggestedAreas.map((name) => ({
      name,
      needs: byArea.get(name) ?? [],
    }));
  }, [needs, cat, area]);

  const feedMainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = document.querySelector(".reddit-page-wrapper");
    if (wrapper) {
      wrapper.classList.add("feed-mode");
      return () => wrapper.classList.remove("feed-mode");
    }
  }, []);

  return (
    <div className="reddit-feed-layout home-feed-layout">
      {/* Central Stream */}
      <div className="reddit-feed-main" ref={feedMainRef}>
        {/* Beautified Central Feed Control Hub */}
        <div className="feed-control-hub">
          {/* Top Row: Sort Segmented Tabs & Pulse Stats */}
          <div className="feed-hub-top-row">
            <div className="feed-hub-tabs" role="tablist" aria-label="Sort Needs">
              {/* New First (Default) */}
              <button
                type="button"
                role="tab"
                aria-selected={sort === "new" && !showAchievements}
                className={`feed-hub-tab ${sort === "new" && !showAchievements ? "active" : ""}`}
                onClick={() => { setSort("new"); setShowAchievements(false); }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>New</span>
              </button>
              {/* Hot moved to the right of New */}
              <button
                type="button"
                role="tab"
                aria-selected={sort === "hot" && !showAchievements}
                className={`feed-hub-tab ${sort === "hot" && !showAchievements ? "active" : ""}`}
                onClick={() => { setSort("hot"); setShowAchievements(false); }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M12 23c4.97 0 9-4.03 9-9 0-4.02-2.61-7.05-5.18-9.42-.48-.45-1.25-.09-1.22.56.1 2.21-.86 3.86-2.6 4.86-.34.2-.78-.05-.75-.44.22-3.14-1.26-6.07-3.25-8.56-.4-.5-1.2-.2-1.21.45-.08 3.9-2.3 6.64-3.79 8.55C4.24 15.15 3 16.96 3 19c0 2.21.89 4.21 2.34 5.66C6.84 25.11 8.84 26 11 26h1c0-1-.3-2-.3-3zm-1 0c-2.76 0-5-2.24-5-5 0-1.63 1.05-3.08 2.37-4.63 1.3-1.52 2.63-3.64 2.63-6.37 1.13 1.48 2.07 3.32 2 5.5-.04.9.46 1.74 1.3 2.06 1.8.69 2.7 2.1 2.7 3.44 0 2.76-2.24 5-5 5z" />
                </svg>
                <span>Hot</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sort === "urgent" && !showAchievements}
                className={`feed-hub-tab ${sort === "urgent" && !showAchievements ? "active" : ""}`}
                onClick={() => { setSort("urgent"); setShowAchievements(false); }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Top Urgent</span>
              </button>
              {/* Achievements sub-tab: good news & success stories */}
              <button
                type="button"
                role="tab"
                aria-selected={showAchievements}
                className={`feed-hub-tab achievements-tab ${showAchievements ? "active" : ""}`}
                onClick={() => setShowAchievements(true)}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
                <span>Achievements</span>
              </button>
            </div>

            <div className="feed-hub-stats-badge">
              <span className="live-pulse-dot" />
              {showAchievements ? (
                <span><strong>{achievements.length}</strong> success {achievements.length === 1 ? "story" : "stories"}</span>
              ) : (
                <span><strong>{sorted.length}</strong> active • <strong>{openCount}</strong> open</span>
              )}
            </div>
          </div>

          {/* Section: Causes / Categories */}
          {!showAchievements && (<>
          <div className="feed-hub-filter-group">
            <span className="feed-hub-group-label">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Cause
            </span>
            <div className="feed-hub-chips-scroll">
              <button
                type="button"
                className={`feed-hub-chip ${cat === "all" ? "active" : ""}`}
                onClick={() => setCat("all")}
              >
                All Causes
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`feed-hub-chip ${cat === c.value ? "active" : ""}`}
                  onClick={() => setCat(c.value === cat ? "all" : c.value)}
                >
                  <span className="chip-color-indicator" style={{ background: c.color }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Neighborhood Area */}
          <div className="feed-hub-filter-group">
            <span className="feed-hub-group-label">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Area
            </span>
            <div className="feed-hub-chips-scroll">
              <button
                type="button"
                className={`feed-hub-chip ${area === "all" ? "active" : ""}`}
                onClick={() => setArea("all")}
              >
                All Areas
              </button>
              {AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`feed-hub-chip ${area.toLowerCase() === a.toLowerCase() ? "active" : ""}`}
                  onClick={() => setArea(a.toLowerCase() === area.toLowerCase() ? "all" : a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Status & Reset Strip (Convenience Bar) */}
          {(cat !== "all" || area !== "all") && !showAchievements && (
            <div className="feed-hub-active-banner">
              <span className="feed-hub-banner-text">
                Active filters:{" "}
                {cat !== "all" && <strong>{CATEGORIES.find((c) => c.value === cat)?.label ?? cat}</strong>}
                {cat !== "all" && area !== "all" && " • "}
                {area !== "all" && <strong>{area}</strong>}
                <span className="feed-hub-banner-count">({sorted.length} {sorted.length === 1 ? "need" : "needs"} found)</span>
              </span>
              <button
                type="button"
                className="feed-hub-reset-btn"
                onClick={() => { setCat("all"); setArea("all"); }}
                title="Reset all filters"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Reset Filters</span>
              </button>
            </div>
          )}
          </>)}
        </div>

        {/* Post Stream */}
        {showAchievements ? (
          achievements.length === 0 ? (
            <div className="empty">
              No success stories yet. When a need is fulfilled on a case you follow, the good news will show up here.
            </div>
          ) : (
            <div className="achievements-feed">
              <div className="achievements-intro">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
                <span>
                  Great news — neighbors helping neighbors. Every story below is a confirmed, fulfilled need on a case page.
                </span>
              </div>
              {achievements.map((a) => {
                const casePage = caseById.get(a.case_page_id);
                return (
                  <article className="achievement-card" key={a.id}>
                    <div className="achievement-card-head">
                      <span className="achievement-badge">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M12 2l2.4 2.4h3.2v3.2L20 10l-2.4 2.4v3.2h-3.2L12 18l-2.4-2.4H6.4v-3.2L4 10l2.4-2.4V4.4h3.2L12 2z" />
                        </svg>
                      </span>
                      <div className="achievement-card-title-wrap">
                        <h3 className="achievement-card-title">{a.title}</h3>
                        {casePage && (
                          <Link href={`/cases/${casePage.id}`} className="achievement-case-link">
                            View {casePage.alias}&apos;s case
                          </Link>
                        )}
                      </div>
                    </div>
                    <p className="achievement-card-text">{a.text}</p>
                    <div className="achievement-card-foot">
                      <span className="achievement-by">By {a.by_name}</span>
                      <span className="achievement-time">{timeAgo(a.created_at)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : sorted.length === 0 ? (
          <div className="empty">
            No needs found matching the current filters. Check other categories or post a need!
          </div>
        ) : (
          sorted.map((need) => (
            <NeedCardItem
              key={need.id}
              need={need}
              pledges={pledges.filter((p) => p.need_card_id === need.id)}
              casePage={need.owner_type === "case_page" ? caseById.get(need.owner_id) : undefined}
              caseAlias={need.owner_type === "case_page" ? caseById.get(need.owner_id)?.alias : undefined}
              caseArea={need.owner_type === "case_page" ? caseById.get(need.owner_id)?.broad_area : undefined}
              anchorPoints={anchorPoints}
              viewerId={viewerId}
              shareCount={shareCounts[need.id] ?? 0}
              reactionCount={reactionCounts[need.id] ?? 0}
              isSupported={!!userReactions[need.id]}
              users={users}
              comments={commentsByNeed[need.id] ?? []}
              follow={need.owner_type === "case_page" ? followsByCase[need.owner_id] : undefined}
            />
          ))
        )}
      </div>

      {/* Right Rail Info Widgets */}
      <aside className="reddit-feed-right-rail" aria-label="Community Information">
        {/* Widget: Local Area Explorer */}
        <div className="reddit-widget">
          <div className="reddit-widget-body">
            <div className="reddit-widget-title">
              <span>Local Area Explorer</span>
              <span style={{ fontSize: 11, color: "var(--reddit-green)", textTransform: "uppercase" }}>
                {area === "all" ? "All areas" : area}
              </span>
            </div>
            <p className="reddit-widget-desc">
              Click a marker to see what&apos;s needed in that local area. Suggested for you below.
            </p>
            {areaMapPoints.length > 1 && (
              <div className="local-area-suggests">
                {areaMapPoints.slice(0, 6).map((ap) => (
                  <button
                    key={ap.name}
                    type="button"
                    className={`chip local-area-chip ${area === ap.name ? "active" : ""}`}
                    onClick={() => setArea(area === ap.name ? "all" : ap.name)}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {ap.name.charAt(0).toUpperCase() + ap.name.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <AreaMap areas={areaMapPoints} />
          </div>
        </div>

        {/* Widget: Platform Rules */}
        <div className="reddit-widget">
          <div className="reddit-widget-body">
            <div className="reddit-widget-title">NeedReel Platform Rules</div>
            <div className="reddit-rule-list">
              <div className="reddit-rule-item">
                <span className="reddit-rule-num">1.</span>
                <span><strong>Strictly In-Kind:</strong> Goods, time, and essential help only. Zero cash transactions.</span>
              </div>
              <div className="reddit-rule-item">
                <span className="reddit-rule-num">2.</span>
                <span><strong>Two-Party Handoff:</strong> Giver marks handoff, steward confirms receipt before honor badges earn.</span>
              </div>
              <div className="reddit-rule-item">
                <span className="reddit-rule-num">3.</span>
                <span><strong>Verified Consent:</strong> Case pages require recorded verbal consent before publishing.</span>
              </div>
              <div className="reddit-rule-item">
                <span className="reddit-rule-num">4.</span>
                <span><strong>No Direct Tagging:</strong> All needs sit in open pledge pools to protect vulnerable people.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Widget: Snowflake Telemetry */}
        <div className="reddit-widget">
          <div className="reddit-widget-body">
            <div className="reddit-widget-title">
              <span>Snowflake Data HQ</span>
              <span style={{ fontSize: 11, color: "var(--reddit-blue)" }}>Warehouse</span>
            </div>
            <p className="reddit-widget-desc">
              Live steward health monitoring and demand analytics. Automatically falls back to local computation if Snowflake is offline.
            </p>
            <Link href="/dashboard" className="btn btn-ghost" style={{ width: "100%", fontSize: 13 }}>
              View Snowflake HQ Analytics
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
