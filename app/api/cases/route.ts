import { NextRequest, NextResponse } from "next/server";
import { createCase } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alias, broad_area, intro_text, steward_id, consent_clip } = body as {
      alias: string;
      broad_area: string;
      intro_text: string;
      steward_id: string;
      consent_clip: boolean;
    };
    if (!alias || !broad_area || !intro_text || !steward_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const page = await createCase({
      alias,
      broad_area,
      intro_text,
      steward_id,
      consent_clip: Boolean(consent_clip),
    });
    return NextResponse.json({ page }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}