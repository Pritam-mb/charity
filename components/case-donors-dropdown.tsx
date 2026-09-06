"use client";

import { useState, useRef, useEffect } from "react";
import type { DonationLog } from "@/lib/types";
import { getLetterBg, timeAgo } from "@/lib/utils";

export default function CaseDonorsDropdown({
  donations = [],
}: {
  donations: DonationLog[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="case-donors-dropdown-wrapper" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        className={`case-donors-trigger-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title="View all contributors to this mutual aid fund"
      >
        <span className="case-donors-icon">🎁</span>
        <span className="case-donors-label">
          Contributors ({donations.length})
        </span>
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`case-donors-chevron ${isOpen ? "rotated" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="case-donors-popover" role="dialog" aria-label="Community Contributors List">
          <div className="case-donors-popover-header">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: "var(--reddit-text)" }}>
                Community Contributors
              </span>
              <span className="case-donors-count-chip">{donations.length}</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--reddit-text-dim)" }}>Direct Mutual Aid</span>
          </div>

          <div className="case-donors-list">
            {donations.length === 0 ? (
              <div className="case-donors-empty">
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--reddit-text-dim)" }}>
                  No monetary contributions recorded yet. Scan the QR code or send via UPI to support!
                </p>
              </div>
            ) : (
              donations.map((d) => {
                const initial = d.donor_name.trim().slice(0, 1).toUpperCase() || "D";
                const bg = getLetterBg(initial);
                return (
                  <div key={d.id} className="case-donor-row">
                    <div
                      className="case-donor-avatar"
                      style={{ background: bg }}
                      title={d.donor_name}
                    >
                      {initial}
                    </div>
                    <div className="case-donor-details">
                      <div className="case-donor-name-row">
                        <span className="case-donor-name">{d.donor_name}</span>
                        <span className="case-donor-amount">
                          Rs. {d.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="case-donor-sub">
                        <span className="case-donor-method-tag">
                          {d.method.toUpperCase()}
                        </span>
                        {d.at && (
                          <span className="case-donor-time">
                            • {timeAgo(d.at)}
                          </span>
                        )}
                      </div>
                      {d.note && (
                        <div className="case-donor-note" title={d.note}>
                          &ldquo;{d.note}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="case-donors-popover-footer">
            <span>Verified 100% direct mutual aid. Zero platform fees.</span>
          </div>
        </div>
      )}
    </div>
  );
}
