import { NextRequest, NextResponse } from "next/server";
import { toggleFollow, setFollowUpdates, getCasePage, getUser } from "@/lib/store";
import type { FolloweeType } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, followee_type, followee_id, action, want_updates } = body as {
      user_id?: string;
      followee_type?: FolloweeType;
      followee_id?: string;
      action?: "toggle" | "unfollow" | "set_updates";
      want_updates?: boolean;
    };

    if (!user_id || !followee_type || !followee_id) {
      return NextResponse.json({ error: "Missing user_id, followee_type or followee_id" }, { status: 400 });
    }
    if (followee_type !== "case" && followee_type !== "user") {
      return NextResponse.json({ error: "followee_type must be 'case' or 'user'" }, { status: 400 });
    }

    const target =
      followee_type === "case"
        ? await getCasePage(followee_id)
        : await getUser(followee_id);
    if (!target) {
      return NextResponse.json({ error: "Follow target not found" }, { status: 404 });
    }

    if (action === "set_updates") {
      if (typeof want_updates !== "boolean") {
        return NextResponse.json({ error: "want_updates must be a boolean for set_updates" }, { status: 400 });
      }
      await setFollowUpdates({ user_id, followee_type, followee_id, want_updates });
      return NextResponse.json({ followed: true, want_updates });
    }

    if (action === "unfollow") {
      await toggleFollow({ user_id, followee_type, followee_id, want_updates: true });
      return NextResponse.json({ followed: false });
    }

    const result = await toggleFollow({
      user_id,
      followee_type,
      followee_id,
      want_updates: want_updates ?? true,
    });
    return NextResponse.json({
      followed: result.followed,
      want_updates: result.follow?.want_updates ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}