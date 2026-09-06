import { NextRequest, NextResponse } from "next/server";
import { markHandedOff } from "@/lib/store";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  void ctx;
  try {
    const body = await req.json();
    const { pledge_id } = body as { pledge_id: string };
    if (!pledge_id) {
      return NextResponse.json({ error: "Missing pledge_id" }, { status: 400 });
    }
    const pledge = await markHandedOff(pledge_id);
    if (!pledge) {
      return NextResponse.json({ error: "Pledge not found or not in pledged state" }, { status: 409 });
    }
    return NextResponse.json({ pledge });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}