import { NextRequest, NextResponse } from "next/server";
import { addVote } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewerId = await getCurrentUserId();
  const { kind } = await req.json();
  if (kind !== "up" && kind !== "down") return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  await addVote({ need_card_id: id, user_id: viewerId, kind });
  return NextResponse.json({ ok: true });
}
