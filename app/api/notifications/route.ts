import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getNotificationsForUser, markNotificationsRead } from "@/lib/store";
import { AUTH_COOKIE } from "@/lib/auth";

export async function GET() {
  try {
    const jar = await cookies();
    const viewerId = jar.get(AUTH_COOKIE)?.value;
    if (!viewerId) {
      return NextResponse.json({ notifications: [] });
    }
    const notifications = await getNotificationsForUser(viewerId);
    return NextResponse.json({ notifications });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { user_id } = body as { user_id?: string };
    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }
    await markNotificationsRead(user_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}