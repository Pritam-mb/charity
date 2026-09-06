"use client";
import { QRCodeSVG } from "qrcode.react";

export default function QRCode({ value, size = 140 }: { value: string; size?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{
        background: "#fff",
        padding: 12,
        borderRadius: 12,
        display: "inline-block",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}>
        <QRCodeSVG value={value} size={size} level="H" />
      </div>
      <span style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", maxWidth: size + 24 }}>
        Scan to donate via UPI
      </span>
    </div>
  );
}
