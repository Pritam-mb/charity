import { categoryInfo } from "@/lib/categories";
import type { Category } from "@/lib/types";

function hash(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function Poster({
  mediaKey,
  category,
  caption,
  height = "16 / 7",
  tagline,
}: {
  mediaKey: string;
  category: Category;
  caption?: string;
  height?: string;
  tagline?: string;
}) {
  const cat = categoryInfo(category);
  const h = hash(mediaKey || caption || category);
  const hue = parseInt(cat.color.slice(1), 16);
  const r1 = (hue >> 16) & 255;
  const g1 = (hue >> 8) & 255;
  const b1 = hue & 255;
  const r2 = (r1 * 0.4 + 10) | 0;
  const g2 = (g1 * 0.4 + 10) | 0;
  const b2 = (b1 * 0.4 + 12) | 0;
  const circleX = 12 + (h % 76);
  const circleY = 14 + ((h >> 8) % 58);
  const lineTilt = ((h >> 16) % 160) - 80;

  if (mediaKey && mediaKey.startsWith("data:image")) {
    return (
      <div style={{ width: "100%", aspectRatio: height, overflow: "hidden", borderRadius: 8, background: "#000" }}>
        <img
          src={mediaKey}
          alt={caption ?? "Need image"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 320 140"
      preserveAspectRatio="xMidYMid slice"
      style={{
        width: "100%",
        height: "auto",
        aspectRatio: height,
        display: "block",
        background: "transparent",
      }}
      role="img"
      aria-label={caption ?? category}
    >
      <defs>
        <linearGradient id={`g-${mediaKey}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`rgb(${r1},${g1},${b1})`} />
          <stop offset="100%" stopColor={`rgb(${r2},${g2},${b2})`} />
        </linearGradient>
        <pattern id={`p-${mediaKey}`} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill={`rgba(0,0,0,0.0)`} />
          <rect x="4" y="4" width="2" height="14" fill={`rgba(255,255,255,0.06)`} transform={`rotate(${lineTilt} 10 10)`} />
          <circle cx="26" cy="28" r="3" fill={`rgba(255,255,255,0.07)`} />
        </pattern>
      </defs>
      <rect width="320" height="140" fill={`url(#g-${mediaKey})`} />
      <rect width="320" height="140" fill={`url(#p-${mediaKey})`} />
      <circle cx={circleX * 3} cy={circleY * 2.6} r="100" fill="rgba(255,255,255,0.08)" />
      <circle cx={circleX * 6} cy={circleY * 1.6} r="46" fill="rgba(0,0,0,0.10)" />
      <text
        x="24"
        y="92"
        fill="rgba(255,255,255,0.85)"
        fontSize="15"
        fontWeight="800"
        fontFamily="inherit"
      >
        {cat.label}
      </text>
      {tagline ? (
        <text x="24" y="114" fill="rgba(255,255,255,0.65)" fontSize="11" fontWeight="600">
          {tagline}
        </text>
      ) : (
        <text
          x="24"
          y="114"
          fill="rgba(255,255,255,0.65)"
          fontSize="11"
          fontWeight="600"
          fontFamily="inherit"
        >
          {caption ?? "Need on the reel"}
        </text>
      )}
    </svg>
  );
}