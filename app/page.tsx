import { getStore } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";
import Feed from "@/components/feed";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; area?: string; q?: string; sort?: string }>;
}) {
  const [store, viewerId, params] = await Promise.all([
    getStore(),
    getCurrentUserId(),
    searchParams ? searchParams : Promise.resolve({ category: "all", area: "all", q: "", sort: "new" }),
  ]);

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

  // Build userReactions by need
  const userReactions: Record<string, boolean> = {};
  for (const r of store.reactions) {
    if (r.user_id === viewerId && r.kind === "support") {
      userReactions[r.need_card_id] = true;
    }
  }

  return (
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
      userReactions={userReactions}
      initialCategory={params.category || "all"}
      initialArea={params.area || "all"}
      initialSort={(params.sort as "hot" | "new" | "urgent" | "open") || "new"}
      searchQuery={params.q || ""}
    />
  );
}
