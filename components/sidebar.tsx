"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { CasePage } from "@/lib/types";
import { getLetterBg } from "@/lib/utils";

export default function Sidebar({
  cases = [],
}: {
  cases?: CasePage[];
  activeCategory?: string;
  activeArea?: string;
  onSelectCategory?: (cat: string) => void;
  onSelectArea?: (area: string) => void;
}) {
  const pathname = usePathname();

  // Sidebar minimize / expand state
  const [minimized, setMinimized] = useState(false);

  // Collapsible Accordion sections (default open)
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const [communitiesOpen, setCommunitiesOpen] = useState(true);

  // Favorite toggles
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    "c-arjun": true,
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={`reddit-sidebar ${minimized ? "minimized" : ""}`}
      aria-label="NeedFeed Navigation"
    >
      <div className="reddit-sidebar-inner">
        {/* SIDEBAR MINIMIZE / MAXIMIZE TOGGLE HEADER */}
        <div className="sidebar-control-header">
          <span className="sidebar-control-label">FEEDS & HUBS</span>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setMinimized((prev) => !prev)}
            title={minimized ? "Maximize sidebar" : "Minimize sidebar"}
            aria-label={minimized ? "Maximize sidebar" : "Minimize sidebar"}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {minimized ? (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="m14 9 3 3-3 3" />
                </>
              ) : (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="m16 15-3-3 3-3" />
                </>
              )}
            </svg>
          </button>
        </div>
        {/* PRIMARY NAV SECTION */}
        <div className="sidebar-group">
          <Link
            href="/"
            className={`sidebar-nav-row ${pathname === "/" ? "active" : ""}`}
            title="Home"
          >
            <span className="sidebar-nav-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className="sidebar-nav-text">Home</span>
          </Link>

          <Link
            href="/?sort=open"
            className={`sidebar-nav-row ${pathname === "/?sort=open" ? "active" : ""}`}
            title="Open Needs"
          >
            <span className="sidebar-nav-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8" />
                <path d="M15 18h-5" />
                <path d="M10 6h8v4h-8V6Z" />
              </svg>
            </span>
            <span className="sidebar-nav-text">Open Needs</span>
          </Link>

          <Link
            href="/offers"
            className={`sidebar-nav-row ${pathname === "/offers" ? "active" : ""}`}
            title="Explore Offerings"
          >
            <span className="sidebar-nav-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </span>
            <span className="sidebar-nav-text">Explore Offerings</span>
          </Link>

          <Link
            href="/upload"
            className={`sidebar-nav-row ${pathname === "/upload" ? "active" : ""}`}
            title="Create Need Post"
          >
            <span className="sidebar-nav-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className="sidebar-nav-text">Create Need Post</span>
          </Link>
        </div>

        <div className="sidebar-thin-divider" />

        {/* COMMUNITY RESOURCES (Collapsible) */}
        <div className="sidebar-group">
          <button
            type="button"
            className="sidebar-accordion-header"
            onClick={() => setResourcesOpen((prev) => !prev)}
            aria-expanded={resourcesOpen}
            title={resourcesOpen ? "Collapse Community Resources" : "Expand Community Resources"}
          >
            <span>Community Resources</span>
            <svg
              className={`sidebar-chevron ${resourcesOpen ? "open" : ""}`}
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {(resourcesOpen || minimized) && (
            <div className="sidebar-accordion-body">
              <Link
                href="/upload/case"
                className={`sidebar-nav-row ${pathname === "/upload/case" ? "active" : ""}`}
                title="Start a Case Page"
              >
                <span className="sidebar-nav-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
                <span className="sidebar-nav-text">Start a Case Page</span>
              </Link>

              <Link
                href="/volunteers"
                className={`sidebar-nav-row ${pathname === "/volunteers" ? "active" : ""}`}
                title="Volunteer Register"
              >
                <span className="sidebar-nav-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span className="sidebar-nav-text">Volunteer Register</span>
              </Link>

              <Link
                href="/ngos"
                className={`sidebar-nav-row ${pathname === "/ngos" ? "active" : ""}`}
                title="NGOs & Helping Organizations"
              >
                <span className="sidebar-nav-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                    <path d="M19 11a7 7 0 0 1-14 0" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                  </svg>
                </span>
                <span className="sidebar-nav-text">NGOs &amp; Orgs</span>
              </Link>

              <Link
                href="/following"
                className={`sidebar-nav-row ${pathname === "/following" ? "active" : ""}`}
                title="Your following list"
              >
                <span className="sidebar-nav-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                <span className="sidebar-nav-text">Following</span>
              </Link>

              <Link
                href="/dashboard"
                className={`sidebar-nav-row ${pathname === "/dashboard" ? "active" : ""}`}
                title="Snowflake HQ Data"
              >
                <span className="sidebar-nav-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </span>
                <span className="sidebar-nav-text">Snowflake HQ Data</span>
              </Link>
            </div>
          )}
        </div>

        <div className="sidebar-thin-divider" />

        {/* COMMUNITIES / CASE PAGES (Matching Reddit Communities List in Image) */}
        <div className="sidebar-group">
          <button
            type="button"
            className="sidebar-accordion-header"
            onClick={() => setCommunitiesOpen((prev) => !prev)}
            aria-expanded={communitiesOpen}
            title={communitiesOpen ? "Collapse Case Pages" : "Expand Case Pages"}
          >
            <span>Case Pages</span>
            <svg
              className={`sidebar-chevron ${communitiesOpen ? "open" : ""}`}
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {(communitiesOpen || minimized) && (
            <div className="sidebar-accordion-body">
              <Link
                href="/upload/case"
                className={`sidebar-nav-row ${pathname === "/upload/case" ? "active" : ""}`}
                title="Manage Case Pages"
              >
                <span className="sidebar-nav-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span className="sidebar-nav-text">Manage Case Pages</span>
              </Link>

              {cases.map((c) => {
                const isFav = !!favorites[c.id];
                const isActive = pathname === `/cases/${c.id}`;
                const firstChar = c.alias.slice(0, 1).toUpperCase();
                const caseBg = getLetterBg(firstChar);
                return (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className={`sidebar-community-row ${isActive ? "active" : ""}`}
                    title={c.alias}
                  >
                    <span
                      className="sidebar-community-avatar"
                      style={{ background: caseBg, color: "#ffffff", fontWeight: 800 }}
                    >
                      {firstChar}
                    </span>
                    <span className="sidebar-community-name">{c.alias}</span>
                    <button
                      type="button"
                      className={`sidebar-star-btn ${isFav ? "favorited" : ""}`}
                      onClick={(e) => toggleFavorite(c.id, e)}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                      aria-label="Toggle favorite"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill={isFav ? "#ff4500" : "none"} stroke={isFav ? "#ff4500" : "currentColor"} strokeWidth="1.9">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
