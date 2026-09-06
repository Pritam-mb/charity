"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "🌏 Feed" },
  { href: "/upload", label: "📋 Post Need" },
  { href: "/offers", label: "🎁 Offer Help" },
  { href: "/volunteers", label: "🙋 Volunteers" },
  { href: "/dashboard", label: "📊 Dashboard" },
  { href: "/login", label: "🔐 Login" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          Need<span className="accent">Reel</span>
        </Link>
        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
