import { getStore } from "@/lib/store";
import { DEMO_VIEWER_ID } from "@/lib/demo";
import UploadForm from "@/components/upload-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const store = await getStore();
  const cases = store.case_pages.filter((c) => c.status === "active");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Post a need</h1>
      <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
        A caption is enough — local auto-tagging proposes category, item type and urgency.
        You review before publishing.
      </p>

      <UploadForm cases={cases} viewerId={DEMO_VIEWER_ID} />

      <div className="card" style={{ marginTop: 16 }}>
        <div className="pledge-pool-title">No Case Page exists for the person yet?</div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          A Steward opens a persistent Case Page for someone who can&apos;t represent themselves
          online — every need, update and fulfillment logs to the same page over time. No payment
          fields, ever.
        </p>
        <Link href="/upload/case" className="btn btn-ghost">
          + Open a Case Page
        </Link>
      </div>
    </div>
  );
}