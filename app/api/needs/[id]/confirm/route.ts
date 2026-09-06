import { NextRequest, NextResponse } from "next/server";
import { confirmPledge } from "@/lib/store";
import { getCasePage, getNeed } from "@/lib/store";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { pledge_id, steward_id } = body as { pledge_id: string; steward_id: string };
    if (!pledge_id || !steward_id) {
      return NextResponse.json({ error: "Missing pledge_id or steward_id" }, { status: 400 });
    }

    const need = await getNeed(id);
    if (!need) {
      return NextResponse.json({ error: "Need not found" }, { status: 404 });
    }
    if (need.owner_type === "case_page") {
      const page = await getCasePage(need.owner_id);
      if (!page || !page.stewards.includes(steward_id)) {
        return NextResponse.json(
          { error: "Only a steward of this Case Page can confirm" },
          { status: 403 }
        );
      }
    }

    const result = await confirmPledge({ pledge_id, steward_id });
    if (!result) {
      return NextResponse.json(
        { error: "Pledge must be marked handed-off by the giver before confirmation (two-party rule)" },
        { status: 409 }
      );
    }
    return NextResponse.json({ pledge: result.pledge, record: result.record });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}