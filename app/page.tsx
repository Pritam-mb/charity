import { getStore } from "@/lib/store";
import { DEMO_VIEWER_ID } from "@/lib/demo";
import Feed from "@/components/feed";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = await getStore();

  const shareCounts: Record<string, number> = {};
  for (const s of store.shares) {
    shareCounts[s.need_card_id] = (shareCounts[s.need_card_id] ?? 0) + 1;
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>
            The reel — real needs, no money
          </h1>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            Pledge in-kind help. Stewards confirm. Your badge is earned, not claimed.
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
        viewerId={DEMO_VIEWER_ID}
        shareCounts={shareCounts}
      />
    </div>
  );
}