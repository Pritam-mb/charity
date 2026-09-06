import { NextRequest, NextResponse } from "next/server";
import { registerVolunteer } from "@/lib/store";
import type { Volunteer } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, name, category, description, area, availability, contact } = body as Partial<Volunteer>;
  if (!user_id || !name || !category || !description || !area || !availability || !contact) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const vol = await registerVolunteer({ user_id, name, category, description, area, availability, contact });
  return NextResponse.json({ vol }, { status: 201 });
}
