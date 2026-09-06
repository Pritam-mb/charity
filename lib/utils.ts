export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function getLetterBg(nameOrLetter: string): string {
  if (!nameOrLetter) return "#ff4500";
  const char = nameOrLetter.trim().charAt(0).toUpperCase();
  const charCode = char.charCodeAt(0) || 65;
  const letterPalette = [
    "#e63946", // A
    "#457b9d", // B
    "#2a9d8f", // C
    "#e76f51", // D
    "#f4a261", // E
    "#8338ec", // F
    "#3a86ff", // G
    "#06d6a0", // H
    "#fb5607", // I
    "#118ab2", // J
    "#7209b7", // K
    "#4361ee", // L
    "#d90429", // M
    "#00b4d8", // N
    "#ff006e", // O
    "#f77f00", // P
    "#588157", // Q
    "#38b000", // R
    "#9d4edd", // S
    "#3f37c9", // T
    "#0077b6", // U
    "#0096c7", // V
    "#ef476f", // W
    "#2b9348", // X
    "#ff5400", // Y
    "#70e000", // Z
  ];
  const idx = Math.abs(charCode - 65) % letterPalette.length;
  return letterPalette[idx];
}