import { GoogleGenAI } from "@google/genai";
import { autoTag, type TagProposal } from "./auto-tag";
import type { AITags } from "./types";

/**
 * Real Google AI tagging (Gemini). Lazy client — if GOOGLE_AI_API_KEY is
 * absent, or the call fails, we fall back to the local keyword tagger
 * (lib/auto-tag.ts) so the upload flow never breaks. Steward still edits
 * before publishing (problems.md #10).
 */

const KEY = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const MODEL = () => process.env.GOOGLE_AI_MODEL ?? "gemini-3.6-flash";

function client(): GoogleGenAI | null {
  if (!KEY()) return null;
  return new GoogleGenAI({ apiKey: KEY() });
}

export const hasGoogleAi = () => !!KEY();

const PROMPT = `You tag a posted "need" for a community help app (in-kind help only, English + Hindi captions).
From the caption text, return ONLY JSON (no markdown) like:
{"category":"food","item_type":"dry ration pack","urgency":"high","confidence":0.9,"notes":"Reason"}
Category must be exactly one of: shelter, clothing, food, medical, hygiene, mobility, education.
item_type is a short noun phrase. urgency is one of low, medium, high, critical.
Notes is a one-line reason in plain text.`;

interface RawTags {
  category?: string;
  item_type?: string;
  urgency?: string;
  confidence?: number;
  notes?: string;
}

function parseJson(raw: string): RawTags | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (obj && typeof obj === "object") return obj as RawTags;
    return null;
  } catch {
    return null;
  }
}

export async function generateTags(caption: string): Promise<TagProposal> {
  const fallback = autoTag(caption);
  const c = client();
  if (!c) {
    return fallback;
  }
  try {
    const res = await c.models.generateContent({
      model: MODEL(),
      contents: `${PROMPT}\n\nCaption: ${caption}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    const text = res.text;
    if (!text) return fallback;

    const parsed = parseJson(text);
    if (!parsed) return fallback;

    const category = parsed.category as AITags["category"] | undefined;
    const urgency = parsed.urgency as AITags["urgency"] | undefined;
    if (!category || !["shelter", "clothing", "food", "medical", "hygiene", "mobility", "education"].includes(category)) {
      return fallback;
    }
    if (!urgency || !["low", "medium", "high", "critical"].includes(urgency)) {
      return fallback;
    }

    return {
      tags: {
        category,
        item_type: parsed.item_type?.trim() || fallback.tags.item_type,
        urgency,
      },
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
      notes: parsed.notes || "AI-generated tags — review before publishing.",
    };
  } catch (e) {
    // Fall back to local tagging on any API failure; surface the reason.
    return {
      ...fallback,
      notes: `Gemini unavailable (${e instanceof Error ? e.message : String(e)}); used local tagger.`,
    };
  }
}