import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { getUser } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id } = body as { user_id: string };
    if (!user_id || !(await getUser(user_id))) {
      return NextResponse.json({ error: "Unknown user" }, { status: 400 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, user_id, {
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
