import { NextRequest, NextResponse } from "next/server";
import { addComment } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewerId = await getCurrentUserId();
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Empty comment" }, { status: 400 });
  const comment = await addComment({ need_card_id: id, author_id: viewerId, text: text.trim() });
  return NextResponse.json({ comment }, { status: 201 });
}
