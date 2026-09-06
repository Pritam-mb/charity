import { getUser } from "@/lib/store";
import { DEMO_STEWARD_ID } from "@/lib/demo";
import CaseForm from "@/components/case-form";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const steward = await getUser(DEMO_STEWARD_ID);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Open a Case Page</h1>
      <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
        A persistent public page for someone who can&apos;t represent themselves online. Every
        need, update and fulfillment logs to this same page over time.
      </p>

      <CaseForm stewardId={DEMO_STEWARD_ID} stewardName={steward?.display_name ?? "Demo steward"} />

      <div className="card" style={{ marginTop: 16 }}>
        <div className="pledge-pool-title">Read this before opening</div>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          ◗ No Case Page for a minor without an identifiable guardian listed as co-steward.
          <br />
          ◗ One-tap freeze/takedown request is always available for the beneficiary.
          <br />
          ◗ In-kind items, time and help only — never money. That is the product&apos;s boundary.
        </p>
      </div>
    </div>
  );
}