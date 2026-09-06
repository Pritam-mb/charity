import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCasePage,
  getStore,
  getTimeline,
} from "@/lib/store";
import { DEMO_STEWARD_ID } from "@/lib/demo";
import { formatUrgency } from "@/lib/categories";
import Poster from "@/components/poster";
import TimelineComposer from "@/components/case-update-form";
import StewardConfirmPanel from "@/components/steward-confirm-panel";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  intro: "Page opened",
  need: "New need",
  update: "Update",
  fulfillment: "Fulfillment",
};

export default async function CasePageView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [page, store, timeline] = await Promise.all([
    getCasePage(id),
    getStore(),
    getTimeline(id),
  ]);
  if (!page) notFound();

  const stewards = page.stewards
    .map((sid) => store.users.find((u) => u.id === sid))
    .filter(Boolean);

  const pageNeeds = store.needs
    .filter((n) => n.owner_type === "case_page" && n.owner_id === page.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const pledgesForNeeds = new Map(
    pageNeeds.map((n) => [
      n.id,
      store.pledges.filter((p) => p.need_card_id === n.id && p.status !== "cancelled"),
    ])
  );

  const shareCounts: Record<string, number> = {};
  for (const s of store.shares) shareCounts[s.need_card_id] = (shareCounts[s.need_card_id] ?? 0) + 1;

  // Demo: visit as the first available steward of this page.
  const demoSteward = page.stewards.includes(DEMO_STEWARD_ID)
    ? DEMO_STEWARD_ID
    : page.stewards[0];

  const readyToConfirm = pageNeeds
    .flatMap((n) => pledgesForNeeds.get(n.id) ?? [])
    .filter((p) => p.status === "handed_off");

  return (
    <div>
      <div className="card case-hero">
        <div className="case-hero-top">
          <div>
            <h1 className="case-title">{page.alias}</h1>
            <p className="muted">
              {page.broad_area} · page opened {timeAgo(page.created_at)} · last update{" "}
              {timeAgo(page.last_update_at)}
            </p>
          </div>
          <div className="case-badges" style={{ marginLeft: "auto" }}>
            <span className="chip area-chip">📍 {page.broad_area}</span>
            <span className="chip">
              {page.blur_public ? "Faces blurred in feed" : "Open profile"}
            </span>
            {page.consent_clip && (
              <span className="chip" style={{ color: "var(--good)", borderColor: "rgba(76,175,80,0.5)" }}>
                ✔ Verbal consent recorded
              </span>
            )}
          </div>
        </div>

        <Poster
          mediaKey={page.intro_media}
          category="shelter"
          caption={page.alias}
          tagline={`Case page · ${page.broad_area}`}
          height="16 / 6"
        />

        <p className="case-intro" style={{ marginTop: 12 }}>
          {page.intro_text}
        </p>

        <div className="case-stewards" style={{ marginTop: 12 }}>
          <span className="faint">Stewards:</span>
          {stewards.map((s) => (
            <span key={s!.id} className="chip">
              🛡️ {s!.display_name}
            </span>
          ))}
          <Link href="/#open-pool" className="chip" style={{ color: "var(--accent)" }}>
            How stewardship works
          </Link>
        </div>
      </div>

      <h2 className="section-title">Needs on this page</h2>
      {pageNeeds.map((n) => (
        <div className="card" key={n.id}>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <div className="row-between" style={{ gap: 10 }}>
              <span className="chip tag-chip" style={{ background: "#e25151" }}>
                {n.ai_tags.item_type}
              </span>
              <span className="chip">
                {formatUrgency(n.ai_tags.urgency)} urgency
              </span>
              <span className="chip">{n.status}</span>
            </div>
            <span className="faint">Linked: {n.id.slice(0, 14)}…</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>{n.caption}</p>
          <div className="muted" style={{ fontSize: 12 }}>
            {n.quantity} · {shareCounts[n.id] ?? 0} shares
            {n.status === "fulfilled" ? " · ✓ fulfilled" : ""}
          </div>
        </div>
      ))}
      {pageNeeds.length === 0 && (
        <div className="empty">No open needs on this page yet.</div>
      )}

      <h2 className="section-title">Timeline (append-only)</h2>
      <div className="timeline card">
        {timeline.map((t) => (
          <div key={t.id} className={`tl-entry kind-${t.kind}`}>
            <div className="tl-kind">{KIND_LABEL[t.kind] ?? t.kind}</div>
            <p className="tl-text">{t.text}</p>
            <div className="tl-meta">
              {timeAgo(t.created_at)}
              {t.author_id === demoSteward ? " · steward" : ""}
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Steward tools (demo)</h2>
      <StewardConfirmPanel
        stewardId={demoSteward}
        needs={pageNeeds}
        readyToConfirm={readyToConfirm}
      />
      <TimelineComposer caseId={page.id} stewardId={demoSteward} />
    </div>
  );
}