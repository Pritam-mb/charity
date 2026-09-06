import { NextRequest, NextResponse } from "next/server";
import { generateTags, hasGoogleAi } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const caption = String(body?.caption ?? "").trim();
    if (!caption) {
      return NextResponse.json({ error: "Missing caption" }, { status: 400 });
    }
    if (caption.length > 2000) {
      return NextResponse.json({ error: "Caption too long" }, { status: 400 });
    }
    const proposal = await generateTags(caption);
    return NextResponse.json({
      proposal,
      engine: hasGoogleAi() ? "google-ai" : "local",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}