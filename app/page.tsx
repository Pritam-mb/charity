import { getStore } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";
import Feed from "@/components/feed";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [store, viewerId] = await Promise.all([getStore(), getCurrentUserId()]);

  const shareCounts: Record<string, number> = {};
  for (const s of store.shares) {
    shareCounts[s.need_card_id] = (shareCounts[s.need_card_id] ?? 0) + 1;
  }
  const reactionCounts: Record<string, number> = {};
  for (const r of store.reactions) {
    reactionCounts[r.need_card_id] = (reactionCounts[r.need_card_id] ?? 0) + 1;
  }

  // Build comments by need
  const commentsByNeed: Record<string, typeof store.comments> = {};
  for (const c of store.comments) {
    commentsByNeed[c.need_card_id] = commentsByNeed[c.need_card_id] ?? [];
    commentsByNeed[c.need_card_id].push(c);
  }

  // Build userVotes by need
  const userVotes: Record<string, "up" | "down"> = {};
  for (const v of store.votes) {
    if (v.user_id === viewerId) userVotes[v.need_card_id] = v.kind;
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
            Community Feed 🌏
          </h1>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            Real needs from real people. Pledge help, donate, raise your hand.
          </p>
        </div>
        <Link href="/upload" className="btn btn-primary">
          + Post a need
        </Link>
      </div>

      <Feed
        needs={store.needs}
        pledges={store.pledges}
        cases={store.case_pages}
        anchorPoints={store.anchor_points}
        viewerId={viewerId}
        shareCounts={shareCounts}
        reactionCounts={reactionCounts}
        users={store.users}
        commentsByNeed={commentsByNeed}
        userVotes={userVotes}
      />
    </div>
  );
}
