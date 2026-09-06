import { NextRequest, NextResponse } from "next/server";
import { logReaction } from "@/lib/store";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { user_id, kind } = body as {
      user_id?: string;
      kind?: "support" | "urgent" | "pray";
    };
    await logReaction({
      need_card_id: id,
      user_id: user_id || "u-you",
      kind: kind || "support",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
