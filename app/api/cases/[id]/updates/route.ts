import { NextRequest, NextResponse } from "next/server";
import { addCaseUpdate, getCasePage } from "@/lib/store";

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
    if (!page.stewards.includes(author_id)) {
      return NextResponse.json({ error: "Only stewards can update a Case Page" }, { status: 403 });
    }
    const entry = await addCaseUpdate({ case_page_id: id, author_id, text });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}