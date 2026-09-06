import type { Category, Urgency } from "./types";

export const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: "shelter", label: "Shelter & bedding", color: "#5b8def" },
  { value: "clothing", label: "Clothing", color: "#e07a3f" },
  { value: "food", label: "Food & water", color: "#4caf50" },
  { value: "medical", label: "Medical supplies", color: "#e25151" },
  { value: "hygiene", label: "Hygiene essentials", color: "#38b6c4" },
  { value: "mobility", label: "Mobility aids", color: "#8e6bd8" },
  { value: "education", label: "Education", color: "#d4a233" },
];

export const URGENCIES: { value: Urgency; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "#7e9aa6" },
  { value: "medium", label: "Medium", color: "#d4a233" },
  { value: "high", label: "High", color: "#e07a3f" },
  { value: "critical", label: "Critical", color: "#e25151" },
];

export const AREAS = [
  "Bansdroni",
  "Garia",
  "Narendrapur",
  "Tollygunge",
  "Jadavpur",
  "Behala",
];

export const categoryInfo = (c: Category) =>
  CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[0];

export const urgencyInfo = (u: Urgency) =>
  URGENCIES.find((x) => x.value === u) ?? URGENCIES[1];

export const formatCategory = (c: Category) => categoryInfo(c).label;
export const formatUrgency = (u: Urgency) => urgencyInfo(u).label;