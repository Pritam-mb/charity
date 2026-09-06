import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/store";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const jar = await cookies();
    jar.set(AUTH_COOKIE, user.id, { path: "/", httpOnly: true });

    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
