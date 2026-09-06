import type { AITags, Category, Urgency } from "./types";

/**
 * Local auto-tagging — a deterministic, keyword-driven stand-in for the
 * Google AI multimodal tagging described in plan.md §4. It proposes
 * category / item-type / urgency from the caption, steward edits before
 * publishing (problems.md #10). Swappable for a real Gemini call later.
 */

const KEYWORDS: Record<Category, string[]> = {
  shelter: [
    "tent", "blanket", "bed", "mattress", "sleeping", "roof", "sheet",
    "shade", "rain-proof", "tarpaulin", "cot"
  ],
  clothing: [
    "cloth", "jacket", "shirt", "sweater", "saree", "kurta", "pant",
    "shoes", "sandal", "winter coat", "sock", "glove", "hoodie", "wool"
  ],
  food: [
    "food", "rice", "meal", "ration", "grocery", "bread", "daal", "oil",
    "water", "dry food", "cooked", "lunch", "dinner", "milk", "fruit"
  ],
  medical: [
    "medic", "pill", "tablet", "bandage", "diabetes", "bp", "blood pressure",
    "insulin", "wheelchair", "crutch", "physio", "ointment", "first aid",
    "glucose", "oxygen"
  ],
  hygiene: [
    "soap", "shampoo", "toothbrush", "paste", "sanitary", "pad", "tissue",
    "towel", "detergent", "comb", "razor", "deodorant", "napkin"
  ],
  mobility: [
    "wheelchair", "crutch", "walker", "tricycle", "stick", "scooter",
    "prosthetic", "braces", "ramp"
  ],
  education: [
    "book", "notebook", "pen", "school", "bag", "uniform", "pencil",
    "stationery", "copy", "tuition", "study", "bicycle"
  ],
};

const URGENCY_HINTS: Record<Urgency, (string | RegExp)[]> = {
  critical: ["today", "tonight", "no roof", "hospital", "surgery", "urgent", "asap", "immediately", "emergency"],
  high: ["soon", "needed this week", "medic", "weather", "monsoon", "winter", "out of"],
  medium: ["could use", "would help", "missing", "in need", "short of"],
  low: ["someday", "eventually", "when possible", "optional", "nice to have"],
};

export interface TagProposal {
  tags: AITags;
  confidence: number;
  notes: string;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function autoTag(text: string): TagProposal {
  const lower = text.toLowerCase();
  let bestCat: Category = "food";
  let bestScore = 0;

  for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    const score = words.reduce(
      (acc, w) => acc + (lower.includes(w) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }

  // Basic item type guess from the first keyword hit.
  let itemType = "household item";
  const matched = KEYWORDS[bestCat].filter((w) => lower.includes(w));
  if (matched.length > 0) itemType = matched[0];

  let urgency: Urgency = "medium";
  for (const [level, hints] of Object.entries(URGENCY_HINTS) as [Urgency, (string | RegExp)[]][]) {
    const hit = hints.some((h) => (typeof h === "string" ? lower.includes(h) : h.test(lower)));
    if (hit) {
      urgency = level;
      break;
    }
  }

  const confidence =
    bestScore === 0 ? 0.35 : Math.min(0.95, 0.5 + bestScore * 0.12);

  const notes =
    bestScore === 0
      ? "No strong category signals — review before publishing."
      : `Matched "${matched[0]}" under ${bestCat}.`;

  return {
    tags: { category: bestCat, item_type: itemType, urgency },
    confidence,
    notes,
  };
}

export function posterKey(caption: string): string {
  // Deterministic key so a caption maps to the same poster every render.
  let h = 2166136261;
  for (let i = 0; i < caption.length; i++) {
    h ^= caption.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `p-${(h >>> 0).toString(16)}`;
}

const SAMPLE_ITEMS: Record<Category, string[]> = {
  shelter: ["sleeping bag", "tarpaulin sheet", "camp mat", "warm blanket"],
  clothing: ["winter jacket", "pair of shoes", "men's shirt bundle", "wool sweater"],
  food: ["dry ration pack", "cooked meal", "grocery bag", "water canister"],
  medical: ["bandage pack", "diabetes test strips", "first-aid kit", "ointment"],
  hygiene: ["soap & shampoo pack", "sanitary pads", "toothbrush set", "towel"],
  mobility: ["folding walker", "pair of crutches", "push tricycle", "walking stick"],
  education: ["notebook bundle", "school bag", "stationery set", "textbooks"],
};

export function randomTag(caption: string): TagProposal {
  const proposed = autoTag(caption);
  // Occasionally pick a different category to show steward-editable tags (realism).
  if (Math.random() < 0.25) {
    proposed.tags.category = pick(CATEGORIES_LIST) as Category;
  }
  proposed.tags.item_type = pick(SAMPLE_ITEMS[proposed.tags.category]);
  return proposed;
}

const CATEGORIES_LIST = [
  "shelter",
  "clothing",
  "food",
  "medical",
  "hygiene",
  "mobility",
  "education",
] as const satisfies readonly Category[];