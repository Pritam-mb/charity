"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/lib/types";

export default function OfferForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category | "time" | "service">("food");
  const [area, setArea] = useState("");
  const [quantity, setQuantity] = useState("");
  const [contact, setContact] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !area || !contact) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, title, category, area, quantity, contact }),
      });
      if (!res.ok) {
        alert("Failed to post offer");
      } else {
        setOpen(false);
        setTitle("");
        setArea("");
        setQuantity("");
        setContact("");
      }
    } finally {
      setBusy(false);
      router.refresh();
    }
  };

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Create an Offer
      </button>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Create a Support Offer</h2>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="field">
          <label>What are you offering?</label>
          <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Free roadside classes for children" />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as any)}>
            <option value="food">Food</option>
            <option value="clothing">Clothing</option>
            <option value="medical">Medical</option>
            <option value="education">Education</option>
            <option value="time">Time</option>
            <option value="service">Service</option>
            <option value="shelter">Shelter</option>
          </select>
        </div>
        <div className="field">
          <label>Location / Area</label>
          <input required type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Park Street, Kolkata" />
        </div>
        <div className="field">
          <label>Quantity / Details</label>
          <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 10 books, or 2 hours every Sunday" />
        </div>
        <div className="field">
          <label>How to reach you (Contact Info)</label>
          <input required type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. Call +91 9876543210 or reply here" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={busy} type="submit">
            Post Offer
          </button>
          <button className="btn" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
