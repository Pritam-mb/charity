"use client";
import { QRCodeSVG } from "qrcode.react";

export default function QRCode({
  value,
  size = 140,
  compact = false,
  hideCaption = false,
}: {
  value: string;
  size?: number;
  compact?: boolean;
  hideCaption?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 3 : 8 }}>
      <div
        style={{
          background: "#fff",
          padding: compact ? 6 : 12,
          borderRadius: compact ? 8 : 12,
          display: "inline-block",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          lineHeight: 0,
        }}
      >
        <QRCodeSVG value={value} size={size} level="M" />
      </div>
      {!hideCaption && (
        <span
          style={{
            fontSize: compact ? 10 : 11,
            color: "var(--text-faint)",
            textAlign: "center",
            maxWidth: size + (compact ? 12 : 24),
            whiteSpace: compact ? "nowrap" : "normal",
          }}
        >
          Scan to donate via UPI
        </span>
      )}
    </div>
  );
}
