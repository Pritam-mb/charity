import { NextRequest, NextResponse } from "next/server";
import { addCaseMessage, getCasePage } from "@/lib/store";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { text, author_id } = body as { text: string; author_id: string };
    if (!text || !author_id) {
      return NextResponse.json({ error: "Missing text or author_id" }, { status: 400 });
    }
    const page = await getCasePage(id);
    if (!page) {
      return NextResponse.json({ error: "Case Page not found" }, { status: 404 });
    }
    await addCaseMessage({ case_page_id: id, author_id, text });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
