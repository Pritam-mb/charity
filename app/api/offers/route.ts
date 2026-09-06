import { NextRequest, NextResponse } from "next/server";
import { createOffer } from "@/lib/store";
import type { SupportOffer } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, title, category, area, quantity, contact } = body as {
      user_id: string;
      title: string;
      category: SupportOffer["category"];
      area: string;
      quantity: string;
      contact: string;
    };
    if (!user_id || !title || !category || !area) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const offer = await createOffer({ user_id, title, category, area, quantity, contact });
    return NextResponse.json({ offer }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
