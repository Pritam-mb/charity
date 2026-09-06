import { getStore } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";
import UploadForm from "@/components/upload-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const [store, viewerId] = await Promise.all([getStore(), getCurrentUserId()]);
  const cases = store.case_pages.filter((c) => c.status === "active");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Post a need</h1>
      <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
        A caption is enough. Local auto-tagging proposes category, item type and urgency.
        You review before publishing.
      </p>

      <UploadForm cases={cases} viewerId={viewerId} />

      <div className="card" style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: 20 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--reddit-text)", marginBottom: 4 }}>
            No Case Page exists for this person yet?
          </div>
          <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            A verified steward can open a persistent page for individuals unable to represent themselves online.
          </p>
        </div>
        <Link href="/upload/case" className="btn btn-ghost" style={{ borderRadius: 9999, padding: "9px 20px", fontWeight: 700, whiteSpace: "nowrap" }}>
          + Open a Case Page
        </Link>
      </div>
    </div>
  );
}
