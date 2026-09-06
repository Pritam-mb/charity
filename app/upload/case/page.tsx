import { getUser } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";
import CaseForm from "@/components/case-form";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const viewerId = await getCurrentUserId();
  const steward = await getUser(viewerId);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Open a Case Page</h1>
      <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
        A persistent public page for someone who can&apos;t represent themselves online. Every
        need, update and fulfillment logs to this same page over time.
      </p>

      <CaseForm stewardId={viewerId} stewardName={steward?.display_name ?? "Demo steward"} />

      <div className="card" style={{ marginTop: 20, padding: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--reddit-text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--reddit-orange)" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Safety & Governance Protocol</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, fontSize: 13, color: "var(--reddit-text-dim)", lineHeight: 1.5 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: "var(--reddit-green)", fontWeight: 800 }}>•</span>
            <span><strong>Minor Protection:</strong> No Case Page may be created for a minor without an identifiable guardian listed as primary co-steward.</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: "var(--reddit-green)", fontWeight: 800 }}>•</span>
            <span><strong>Beneficiary Rights:</strong> A one-tap freeze or takedown request is always immediately honored upon beneficiary or steward request.</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: "var(--reddit-green)", fontWeight: 800 }}>•</span>
            <span><strong>Strict In-Kind Boundary:</strong> Physical goods, essentials, time, and shelter only. Never direct cash solicitation.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
