"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(j?.error ?? "Invalid credentials");
      } else {
        router.push("/");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto" }}>
      <div className="card glass">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>Welcome Back</h1>
        <p className="muted" style={{ textAlign: "center", marginBottom: 24 }}>Sign in to continue helping.</p>
        
        {error && <div style={{ color: "var(--warn)", background: "rgba(212,162,51,0.1)", padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label>Username</label>
            <input required type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password (optional)" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14 }}>
          <span className="muted">Don't have an account? </span>
          <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
