import { NextRequest, NextResponse } from "next/server";
import { logShare } from "@/lib/store";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { sharer_id } = body as { sharer_id: string };
    const sharer = sharer_id || "u-you";
    await logShare({ need_card_id: id, sharer_id: sharer });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}