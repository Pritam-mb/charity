"use client";

import { useEffect, useState, useCallback } from "react";

export default function CaseHelpModal({
  caseId,
  caseAlias,
  area,
  introText,
  needsCount,
  openNeedsCount,
}: {
  caseId: string;
  caseAlias: string;
  area: string;
  introText?: string;
  needsCount: number;
  openNeedsCount: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const key = `needreel-help-modal-${caseId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    const t = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(t);
  }, [caseId]);

  const dismiss = useCallback(() => setShow(false), []);

  const goHelp = useCallback(() => {
    setShow(false);
    setTimeout(() => {
      const el = document.getElementById("case-open-needs");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
  }, []);

  if (!show) return null;

  return (
    <div className="case-help-overlay" onClick={dismiss}>
      <div
        className="case-help-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${caseAlias} needs help`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="case-help-modal-head">
          <div className="case-help-modal-avatar">!</div>
          <div className="case-help-modal-title">
            <span className="case-help-modal-name">{caseAlias} needs help</span>
            <span className="case-help-modal-sub">
              {area} • {openNeedsCount > 0 ? `${openNeedsCount} open need${openNeedsCount === 1 ? "" : "s"} right now` : "all needs currently fulfilled"}
            </span>
          </div>
          <button type="button" className="case-help-modal-close" onClick={dismiss} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="case-help-modal-body">
          {openNeedsCount > 0 ? (
            <>
              This neighbor is being supported by community stewards, but they still need help{" "}
              {needsCount > 1 ? "with several daily needs" : "right now"}. A small, in-kind pledge —{" "}
              <strong>{area === "Bansdroni" ? "food, medicines, or blankets" : "food, clothing, or essential supplies"}</strong> —{" "}
              can go a long way.
            </>
          ) : (
            <>
              This neighbor&apos;s current needs have been fulfilled. {introText ? "" : "Follow this case to hear future updates."}
            </>
          )}
          {introText && !openNeedsCount && (
            <span className="case-help-modal-extra"> Learn about {caseAlias} below.</span>
          )}
        </p>
        <div className="case-help-modal-actions">
          {openNeedsCount > 0 ? (
            <button type="button" className="case-help-give-btn" onClick={goHelp}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              I want to help
            </button>
          ) : (
            <button type="button" className="case-help-give-btn" onClick={goHelp}>
              View {caseAlias}&apos;s page
            </button>
          )}
          <button type="button" className="case-help-later-btn" onClick={dismiss}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}