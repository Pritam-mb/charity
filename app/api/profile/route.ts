import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getUser, updateUser } from "@/lib/store";

export async function GET() {
  const userId = await getCurrentUserId();
  const user = await getUser(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json();
    const { display_name, role, bio, area, contact } = body;

    if (display_name !== undefined && !display_name.trim()) {
      return NextResponse.json({ error: "Display name cannot be empty" }, { status: 400 });
    }

    const updated = await updateUser(userId, {
      display_name,
      role,
      bio,
      area,
      contact,
    });

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updated, ok: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
