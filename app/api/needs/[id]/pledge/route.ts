import { NextRequest, NextResponse } from "next/server";
import { createPledge } from "@/lib/store";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { giver_id, portion, anchor_point_id } = body as {
      giver_id: string;
      portion: string;
      anchor_point_id: string | null;
    };
    if (!giver_id) {
      return NextResponse.json({ error: "Missing giver_id" }, { status: 400 });
    }
    const pledge = await createPledge({
      need_card_id: id,
      giver_id,
      portion: portion || "A share",
      anchor_point_id: anchor_point_id ?? null,
    });
    return NextResponse.json({ pledge }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}