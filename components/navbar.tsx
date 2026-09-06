"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { User } from "@/lib/types";
import { getLetterBg } from "@/lib/utils";

export default function NavBar({
  currentUser,
}: {
  currentUser?: User;
  users?: User[];
}) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const user = currentUser ?? {
    id: "u-you",
    display_name: "You",
    role: "citizen",
    badge: 0,
    honor_badge: 0,
    rank_points: 0,
    created_at: "",
  };

  const displayName = (user.display_name || "You").replace(/\s*\(Demo\)/gi, "").trim() || "You";
  const firstLetter = displayName.slice(0, 1).toUpperCase() || "U";
  const avatarBg = getLetterBg(firstLetter);

  return (
    <header className="reddit-navbar">
      <div className="reddit-nav-container">
        {/* BRAND (NeedFeed) */}
        <div className="reddit-nav-left">
          <Link href="/" className="reddit-brand" aria-label="NeedFeed Home">
            <span className="reddit-brand-text">
              <span className="brand-need">need</span>
              <span className="brand-feed">feed</span>
            </span>
          </Link>
        </div>

        {/* SEARCH BAR (Centered in middle) */}
        <div className="reddit-nav-center">
          <form className="reddit-search-box" onSubmit={handleSearchSubmit}>
            <svg className="reddit-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search Needs, Areas, Cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="reddit-search-input"
            />
          </form>
        </div>

        {/* PROFILE (Right Aligned) */}
        <div className="reddit-nav-right">
          {/* User Profile Pill & Dropdown */}
          <div className="reddit-profile-container" ref={dropdownRef}>
            <button
              type="button"
              className={`reddit-profile-pill ${profileOpen ? "open" : ""}`}
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="User profile and settings menu"
              aria-expanded={profileOpen}
            >
              <div
                className="reddit-avatar"
                style={{ background: avatarBg, color: "#ffffff", fontWeight: 800 }}
                title={`Profile for ${displayName}`}
              >
                {firstLetter}
              </div>
              <div className="reddit-profile-info">
                <span className="reddit-profile-name">{displayName}</span>
                <span className="reddit-profile-badge">
                  <span className="honor-icon">✦</span>
                  <span>Honor {user.honor_badge ?? user.badge ?? 0}</span>
                </span>
              </div>
              <svg className={`reddit-chevron ${profileOpen ? "rotated" : ""}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Audited Profile Dropdown Menu */}
            {profileOpen && (
              <div className="reddit-dropdown-menu audited-dropdown">
                {/* Profile Header Card */}
                <div className="reddit-dropdown-header">
                  <div
                    className="reddit-dropdown-avatar"
                    style={{ background: avatarBg, color: "#ffffff", fontWeight: 800 }}
                  >
                    {firstLetter}
                  </div>
                  <div className="reddit-dropdown-meta">
                    <div className="reddit-dropdown-title">{displayName}</div>
                    <div className="reddit-dropdown-role">Role: {user.role ?? "citizen"}</div>
                    <div className="reddit-dropdown-stats">
                      <span>✦ Honor {user.honor_badge ?? user.badge ?? 0}</span>
                      <span>•</span>
                      <span>{user.rank_points ?? 0} Rank pts</span>
                    </div>
                  </div>
                </div>

                <div className="reddit-dropdown-divider" />

                {/* Profile Options: Settings Link */}
                <div className="reddit-dropdown-actions">
                  <Link
                    href="/settings"
                    className="reddit-dropdown-action-btn primary"
                    onClick={() => setProfileOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Account Settings & Profile</span>
                  </Link>

                  <Link
                    href="/login"
                    className="reddit-dropdown-action-btn"
                    onClick={() => setProfileOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    <span>Switch Account / Sign In</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
