import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/store";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password, role } = await req.json();
    if (!username || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const allowedRoles = ["citizen", "steward", "ngo"] as const;
    type SignupRole = (typeof allowedRoles)[number];
    const validRole: SignupRole = allowedRoles.includes(role) ? role : "citizen";

    const user = await createUser({
      display_name: username,
      password: password,
      role: validRole,
    });

    const jar = await cookies();
    jar.set(AUTH_COOKIE, user.id, { path: "/", httpOnly: true });

    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
