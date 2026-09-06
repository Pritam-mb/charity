import { NextRequest, NextResponse } from "next/server";
import { createNeed } from "@/lib/store";
import type { AITags } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caption, ai_tags, quantity, area, owner_type, owner_id } = body as {
      caption: string;
      ai_tags: AITags;
      quantity?: string;
      area: string;
      owner_type: "self" | "case_page";
      owner_id: string;
    };
    if (!caption || !ai_tags || !area || !owner_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const need = await createNeed({
      caption,
      ai_tags,
      quantity: quantity || "1 item",
      area,
      owner_type,
      owner_id,
    });
    return NextResponse.json({ need }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}