"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { Notification } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

const KIND_ICON: Record<string, string> = {
  case_update: "📋",
  help_confirmed: "🤝",
  good_news: "🎉",
  new_need: "🆕",
  system: "🔔",
};

export default function NotificationsDropdown({
  viewerId,
  initialNotifications = [],
}: {
  viewerId: string;
  initialNotifications?: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep server-rendered props in sync (navigation/revalidation).
  const [prev, setPrev] = useState(initialNotifications);
  if (prev !== initialNotifications) {
    setPrev(initialNotifications);
    setNotifications(initialNotifications);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setNotifications((prevN) => prevN.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: viewerId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const targetHref = (n: Notification) =>
    n.case_page_id ? `/cases/${n.case_page_id}` : "/";

  return (
    <div className="reddit-notif-container" ref={boxRef}>
      <button
        type="button"
        className={`reddit-notif-btn ${open ? "open" : ""}`}
        onClick={() => setOpen((prev2) => !prev2)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="reddit-notif-badge">{unread}</span>}
      </button>

      {open && (
        <div className="reddit-notif-popover">
          <div className="reddit-notif-header">
            <span className="reddit-notif-title">Notifications</span>
            {unread > 0 && (
              <button type="button" className="reddit-notif-mark-read" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="reddit-notif-empty">
              No notifications yet. Follow a case or NGO to get updates here.
            </div>
          ) : (
            <div className="reddit-notif-list">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={targetHref(n)}
                  className={`reddit-notif-item ${n.read ? "read" : "unread"}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="reddit-notif-icon">{KIND_ICON[n.kind] ?? "🔔"}</span>
                  <span className="reddit-notif-content">
                    <span className="reddit-notif-text">{n.text}</span>
                    <span className="reddit-notif-time">{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.read && <span className="reddit-notif-dot" />}
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/following"
            className="reddit-notif-footer"
            onClick={() => setOpen(false)}
          >
            See your following list →
          </Link>
        </div>
      )}
    </div>
  );
}