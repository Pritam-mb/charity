"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User, UserRole } from "@/lib/types";
import { AREAS } from "@/lib/categories";
import { getLetterBg, timeAgo } from "@/lib/utils";

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "citizen", label: "Citizen", desc: "Everyday community member participating in local mutual aid" },
  { value: "volunteer", label: "Volunteer", desc: "Active helper delivering goods and supporting handoffs" },
  { value: "steward", label: "Steward", desc: "Verified case manager advocating for vulnerable neighbors" },
  { value: "ngo", label: "NGO Partner", desc: "Non-profit organization providing structured community relief" },
  { value: "leader", label: "Community Leader", desc: "Neighborhood coordinator organizing local anchor points" },
  { value: "teacher", label: "Teacher / Mentor", desc: "Educational advocate supporting child stationery and uniforms" },
];

export default function SettingsForm({ user }: { user: User }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [role, setRole] = useState<UserRole>(user.role || "citizen");
  const [area, setArea] = useState(user.area || "Bansdroni");
  const [bio, setBio] = useState(user.bio || "");
  const [contact, setContact] = useState(user.contact || "");
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setAreaDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstLetter = displayName.trim().slice(0, 1).toUpperCase() || "U";
  const avatarBg = getLetterBg(firstLetter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg("Display name cannot be empty");
      return;
    }
    setBusy(true);
    setErrorMsg("");
    setSuccessMsg(false);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          role,
          area,
          bio: bio.trim(),
          contact: contact.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error || "Failed to save profile changes");
      } else {
        setSuccessMsg(true);
        router.refresh();
        setTimeout(() => setSuccessMsg(false), 3500);
      }
    } catch {
      setErrorMsg("Network error occurred while saving profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1 className="settings-title">Account Settings</h1>
        <p className="settings-subtitle">
          Manage your NeedFeed profile, community role, and neighborhood coordination preferences.
        </p>
      </div>

      {successMsg && (
        <div className="settings-alert success">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Account changes saved successfully! Your profile has been updated.</span>
        </div>
      )}

      {errorMsg && (
        <div className="settings-alert error">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      <form className="settings-card" onSubmit={handleSubmit}>
        {/* Avatar Showcase Section */}
        <div className="settings-avatar-section">
          <div
            className="settings-pfp-large"
            style={{ background: avatarBg }}
            title={`Dynamic PFP for letter '${firstLetter}'`}
          >
            {firstLetter}
          </div>
          <div className="settings-avatar-meta">
            <div className="settings-avatar-name">{displayName || "Your Name"}</div>
            <div className="settings-avatar-sub">
              Dynamic Avatar Color • Generated for letter <strong>{firstLetter}</strong>
            </div>
            <div className="settings-avatar-chips">
              <span className="settings-chip role-chip">
                {ROLES.find((r) => r.value === role)?.label || role}
              </span>
              <span className="settings-chip honor-chip">
                Honor x{user.honor_badge ?? user.badge ?? 0}
              </span>
              <span className="settings-chip rank-chip">
                {user.rank_points ?? 0} Rank Pts
              </span>
            </div>
          </div>
        </div>

        <div className="settings-divider" />

        {/* Input Fields */}
        <div className="settings-form-grid">
          <div className="settings-field">
            <label htmlFor="settings-name">Display Name</label>
            <input
              id="settings-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your public name (e.g. Priya S.)"
              required
            />
            <span className="field-hint">The first letter of your name dictates your unique avatar color.</span>
          </div>

          <div className="settings-field" ref={roleDropdownRef}>
            <label id="settings-role-label">Platform Role</label>
            <div className="themed-select-container">
              <button
                type="button"
                className={`themed-select-trigger ${roleDropdownOpen ? "open" : ""}`}
                onClick={() => {
                  setRoleDropdownOpen((prev) => !prev);
                  setAreaDropdownOpen(false);
                }}
                aria-haspopup="listbox"
                aria-expanded={roleDropdownOpen}
                aria-labelledby="settings-role-label"
              >
                <div className="themed-select-value">
                  <span className="themed-select-label">
                    {ROLES.find((r) => r.value === role)?.label || role}
                  </span>
                  <span className="themed-select-sub">
                    {ROLES.find((r) => r.value === role)?.desc}
                  </span>
                </div>
                <svg
                  className={`themed-select-chevron ${roleDropdownOpen ? "rotated" : ""}`}
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

              {roleDropdownOpen && (
                <div className="themed-select-menu" role="listbox" aria-labelledby="settings-role-label">
                  {ROLES.map((r) => {
                    const isSelected = role === r.value;
                    return (
                      <div
                        key={r.value}
                        role="option"
                        aria-selected={isSelected}
                        className={`themed-select-option ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setRole(r.value);
                          setRoleDropdownOpen(false);
                        }}
                      >
                        <div className="themed-option-info">
                          <span className="themed-option-title">{r.label}</span>
                          <span className="themed-option-desc">{r.desc}</span>
                        </div>
                        {isSelected && (
                          <svg className="themed-option-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <span className="field-hint">Defines your permissions and stewardship tags.</span>
          </div>

          <div className="settings-field" ref={areaDropdownRef}>
            <label id="settings-area-label">Primary Neighborhood (Kolkata)</label>
            <div className="themed-select-container">
              <button
                type="button"
                className={`themed-select-trigger ${areaDropdownOpen ? "open" : ""}`}
                onClick={() => {
                  setAreaDropdownOpen((prev) => !prev);
                  setRoleDropdownOpen(false);
                }}
                aria-haspopup="listbox"
                aria-expanded={areaDropdownOpen}
                aria-labelledby="settings-area-label"
              >
                <div className="themed-select-value">
                  <span className="themed-select-label">{area}</span>
                  <span className="themed-select-sub">Zone for local anchor drops</span>
                </div>
                <svg
                  className={`themed-select-chevron ${areaDropdownOpen ? "rotated" : ""}`}
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

              {areaDropdownOpen && (
                <div className="themed-select-menu" role="listbox" aria-labelledby="settings-area-label">
                  {AREAS.map((a) => {
                    const isSelected = area === a;
                    return (
                      <div
                        key={a}
                        role="option"
                        aria-selected={isSelected}
                        className={`themed-select-option ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setArea(a);
                          setAreaDropdownOpen(false);
                        }}
                      >
                        <div className="themed-option-info">
                          <span className="themed-option-title">{a}</span>
                          <span className="themed-option-desc">Kolkata Municipal Region</span>
                        </div>
                        {isSelected && (
                          <svg className="themed-option-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <span className="field-hint">Used to prioritize local mutual aid opportunities and anchor points.</span>
          </div>

          <div className="settings-field">
            <label htmlFor="settings-contact">Contact Info (Private to Stewards)</label>
            <input
              id="settings-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. Phone, WhatsApp, or Telegram handle"
            />
            <span className="field-hint">Shared with stewards only when you pledge or accept an in-kind handoff.</span>
          </div>

          <div className="settings-field full-width">
            <label htmlFor="settings-bio">Community Bio / Notes</label>
            <textarea
              id="settings-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief note about your availability, supplies you can offer, or local causes you champion..."
            />
          </div>
        </div>

        {/* Member metadata footer */}
        <div className="settings-meta-footer">
          <span>Member since: <strong>{user.created_at ? timeAgo(user.created_at) : "Active citizen"}</strong></span>
          <span>User ID: <code>{user.id}</code></span>
        </div>

        <div className="settings-actions">
          <button
            type="submit"
            className="settings-save-btn"
            disabled={busy}
          >
            {busy ? "Saving changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
