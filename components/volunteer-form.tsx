"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "medical", label: "Medical" },
  { value: "education", label: "Education" },
  { value: "teaching", label: "Teaching" },
  { value: "clothing", label: "Clothing" },
  { value: "shelter", label: "Shelter" },
  { value: "time", label: "Time / Labour" },
  { value: "skills", label: "Skills / Services" },
];

export default function VolunteerForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("teaching");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [availability, setAvailability] = useState("");
  const [contact, setContact] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, name, category, description, area, availability, contact }),
      });
      if (res.ok) {
        setOpen(false);
        setName(""); setDescription(""); setArea(""); setAvailability(""); setContact("");
        router.refresh();
      } else {
        alert("Failed to register");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="btn btn-primary" style={{ fontSize: 15 }} onClick={() => setOpen(true)}>
        Register as a Volunteer
      </button>
    );
  }

  return (
    <div className="card" style={{ borderTop: "3px solid var(--good)", marginBottom: 28 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, marginTop: 0 }}>Register Your Service</h2>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Your Name</label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="E.g. Ramesh Kumar" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>What can you offer?</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Describe what you provide</label>
          <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="E.g. I am a retired school teacher and can teach Maths & Science to children every Sunday morning on roadside..." />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Area / Location</label>
            <input required value={area} onChange={e => setArea(e.target.value)} placeholder="E.g. Park Street, Kolkata" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Availability</label>
            <input required value={availability} onChange={e => setAvailability(e.target.value)} placeholder="E.g. Every Sunday 9-11 AM" />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Contact</label>
          <input required value={contact} onChange={e => setContact(e.target.value)} placeholder="E.g. +91 9876543210 or come find me at the park" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Registering..." : "Register"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
