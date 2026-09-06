import { notFound } from "next/navigation";
import {
  getCasePage,
  getStore,
  getTimeline,
} from "@/lib/store";
import { DEMO_STEWARD_ID } from "@/lib/demo";
import TimelineComposer from "@/components/case-update-form";
import StewardConfirmPanel from "@/components/steward-confirm-panel";
import { timeAgo, getLetterBg } from "@/lib/utils";
import MapView from "@/components/map";
import CaseChatForm from "@/components/case-chat-form";
import { getCurrentUserId } from "@/lib/auth";
import QRCode from "@/components/qr-code";
import NeedCardItem from "@/components/need-card";
import CaseDonorsDropdown from "@/components/case-donors-dropdown";

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
  const [page, store, timeline, viewerId] = await Promise.all([
    getCasePage(id),
    getStore(),
    getTimeline(id),
    getCurrentUserId(),
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

  const reactionCounts: Record<string, number> = {};
  for (const r of store.reactions) reactionCounts[r.need_card_id] = (reactionCounts[r.need_card_id] ?? 0) + 1;

  const commentsByNeed: Record<string, typeof store.comments> = {};
  for (const c of store.comments) {
    commentsByNeed[c.need_card_id] = commentsByNeed[c.need_card_id] ?? [];
    commentsByNeed[c.need_card_id].push(c);
  }

  const userVotes: Record<string, "up" | "down"> = {};
  for (const v of store.votes) {
    if (v.user_id === viewerId) userVotes[v.need_card_id] = v.kind;
  }

  const userReactions: Record<string, boolean> = {};
  for (const r of store.reactions) {
    if (r.user_id === viewerId && r.kind === "support") {
      userReactions[r.need_card_id] = true;
    }
  }

  // Demo: visit as the first available steward of this page.
  const demoSteward = page.stewards.includes(DEMO_STEWARD_ID)
    ? DEMO_STEWARD_ID
    : page.stewards[0];

  const readyToConfirm = pageNeeds
    .flatMap((n) => pledgesForNeeds.get(n.id) ?? [])
    .filter((p) => p.status === "handed_off");

  // Calculate Funds
  const pageDonations = store.donations.filter((d) => d.case_page_id === page.id);
  const totalRaised = pageDonations.reduce((sum, d) => sum + d.amount, 0);
  const progressPercent = page.fundraiser_goal ? Math.min(100, Math.round((totalRaised / page.fundraiser_goal) * 100)) : 0;

  // Helping Hand List
  const helpingHandsIds = new Set<string>();
  pageDonations.forEach((d) => helpingHandsIds.add(d.donor_id));
  store.confirmations.forEach((c) => {
    const need = store.needs.find((n) => n.id === c.need_card_id);
    if (need?.owner_id === page.id) helpingHandsIds.add(c.giver_id);
  });
  const helpingHands = Array.from(helpingHandsIds).map((uid) => store.users.find((u) => u.id === uid)).filter(Boolean);

  const caseMessages = store.case_messages.filter(m => m.case_page_id === page.id);

  const firstLetter = page.alias.trim().slice(0, 1).toUpperCase() || "C";
  const avatarBg = getLetterBg(firstLetter);
  const cleanBio = page.intro_text.replace(/A verbal consent clip was recorded before this page opened\.?/gi, "").trim();

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* Beneficiary Profile Header Card with Clumped QR & Fundraiser Section */}
      <div className="reddit-case-header-card">
        <div className="reddit-case-header-top">
          <div className="reddit-case-header-left">
            <div
              className="reddit-case-avatar"
              style={{ background: avatarBg, color: "#ffffff", fontWeight: 800 }}
              title={`Avatar letter '${firstLetter}'`}
            >
              {firstLetter}
            </div>
            <div className="reddit-case-title-row">
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h1 className="reddit-case-name">{page.alias}</h1>
                <span className="chip area-chip">{page.broad_area}</span>
                {page.consent_clip && (
                  <span className="chip" style={{ color: "var(--reddit-green)", borderColor: "rgba(0, 166, 126, 0.4)" }}>
                    Verbal consent recorded
                  </span>
                )}
              </div>
              {/* About this Beneficiary moved under the name section */}
              {cleanBio && (
                <div className="reddit-case-bio-box">
                  <span className="reddit-case-bio-label">About:</span>
                  <span className="reddit-case-bio-text">{cleanBio}</span>
                </div>
              )}
            </div>
          </div>

          {/* Clumped QR & Mutual Aid Fundraiser Section with Donors Dropdown */}
          {page.upi_id && (
            <div className="reddit-case-qr-cluster" title="Direct UPI & Bank Mutual Aid Support">
              <div className="reddit-case-qr-box">
                <QRCode
                  value={`upi://pay?pa=${page.upi_id}&pn=${encodeURIComponent(page.bank_account_name ?? page.alias)}`}
                  size={58}
                  compact
                  hideCaption
                />
              </div>
              <div className="reddit-case-qr-info">
                <div className="reddit-case-qr-stats">
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                    <span className="reddit-case-qr-raised">Rs. {totalRaised.toLocaleString()}</span>
                    <span className="reddit-case-qr-goal">of Rs. {(page.fundraiser_goal ?? 0).toLocaleString()}</span>
                  </div>
                  <span className="reddit-case-qr-pct">{progressPercent}%</span>
                </div>
                <div className="reddit-case-qr-bar-track">
                  <div className="reddit-case-qr-bar-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="reddit-case-qr-meta">
                  <span className="reddit-case-qr-pill" title={`Direct UPI ID: ${page.upi_id}`}>
                    <strong style={{ color: "var(--reddit-orange)" }}>UPI:</strong> {page.upi_id}
                  </span>
                  <span className="reddit-case-qr-pill" title={`${page.bank_name} A/C ${page.bank_account_number} IFSC ${page.bank_ifsc}`}>
                    <strong>Bank:</strong> {page.bank_name?.split(" ")[0]} ••••{page.bank_account_number?.slice(-4)}
                  </span>
                  {/* Dropdown list showing all contributors */}
                  <CaseDonorsDropdown donations={pageDonations} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="reddit-case-meta-row">
          <span className="faint" style={{ fontSize: 13 }}>
            Managed by: <strong>{page.handler_name}</strong> ({page.handler_type})
          </span>
          <span className="faint">•</span>
          <span className="faint" style={{ fontSize: 13 }}>Stewards:</span>
          {stewards.map((s) => (
            <span key={s!.id} className="chip" style={{ fontSize: 12 }}>
              {s!.display_name} {s!.honor_badge ? `(Honor x${s!.honor_badge})` : ""}
            </span>
          ))}
        </div>
      </div>

      {/* 2-Column Reddit Community Layout */}
      <div className="reddit-feed-layout" style={{ maxWidth: "100%" }}>
        {/* Left Main Stream */}
        <div className="reddit-feed-main">
          {/* Linked Needs on this Case */}
          <div>
            <div className="section-title">
              Active Needs for {page.alias} ({pageNeeds.length})
            </div>
            {pageNeeds.length === 0 ? (
              <div className="empty">No open needs on this page right now.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {pageNeeds.map((need) => (
                  <NeedCardItem
                    key={need.id}
                    need={need}
                    pledges={pledgesForNeeds.get(need.id) ?? []}
                    casePage={page}
                    caseAlias={page.alias}
                    caseArea={page.broad_area}
                    anchorPoints={store.anchor_points}
                    viewerId={viewerId}
                    shareCount={shareCounts[need.id] ?? 0}
                    reactionCount={reactionCounts[need.id] ?? 0}
                    isSupported={!!userReactions[need.id]}
                    users={store.users}
                    comments={commentsByNeed[need.id] ?? []}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Append-Only Timeline */}
          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>
              Audit Timeline (Append-Only)
            </h2>
            <div className="timeline">
              {timeline.map((t) => (
                <div key={t.id} className="tl-entry">
                  <div className="tl-kind">{KIND_LABEL[t.kind] ?? t.kind}</div>
                  <p className="tl-text">{t.text}</p>
                  <div className="tl-meta">
                    {timeAgo(t.created_at)}
                    {t.author_id === demoSteward ? " • steward" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discussion Channel */}
          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>
              Case Discussion Channel
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {caseMessages.map((m) => {
                const author = store.users.find(u => u.id === m.author_id);
                return (
                  <div key={m.id} style={{ padding: 10, background: "var(--reddit-elevated)", borderRadius: 8, borderLeft: "3px solid var(--reddit-orange)" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "var(--reddit-text)" }}>
                      {author?.display_name ?? "Neighbor"}
                    </div>
                    <p style={{ margin: "4px 0", fontSize: 13, color: "var(--reddit-text-dim)" }}>{m.text}</p>
                    <div className="faint" style={{ fontSize: 11 }}>{timeAgo(m.created_at)}</div>
                  </div>
                );
              })}
              {caseMessages.length === 0 && (
                <div className="empty">No discussion messages yet. Leave an update for stewards and neighbors.</div>
              )}
            </div>
            <CaseChatForm caseId={page.id} userId={viewerId} />
          </div>
        </div>

        {/* Right Info Rail */}
        <aside className="reddit-feed-right-rail">
          {/* Location & Map */}
          <div className="reddit-widget">
            <div className="reddit-widget-body">
              <div className="reddit-widget-title">Handoff Location</div>
              <p className="reddit-widget-desc">
                {page.location_label || page.broad_area}
              </p>
              <MapView label={page.location_label || page.alias} query={page.map_query || page.broad_area} />
            </div>
          </div>

          {/* Helping Hands Recognitions */}
          <div className="reddit-widget">
            <div className="reddit-widget-body">
              <div className="reddit-widget-title">
                <span>Helping Hands</span>
                <span className="reddit-author-badge">{helpingHands.length}</span>
              </div>
              <p className="reddit-widget-desc">
                Verified community members who have fulfilled pledges or provided support.
              </p>
              {helpingHands.length > 0 ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {helpingHands.map((h) => (
                    <span key={h!.id} className="chip" style={{ color: "var(--reddit-green)", borderColor: "rgba(0,166,126,0.35)" }}>
                      u/{h!.display_name} {h!.honor_badge ? `(Honor x${h!.honor_badge})` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="faint" style={{ fontSize: 12 }}>Be the first to fulfill a need for {page.alias}!</div>
              )}
            </div>
          </div>


          {/* Steward Mod Tools */}
          <div className="reddit-widget">
            <div className="reddit-widget-body">
              <div className="reddit-widget-title">
                <span>Steward Verification Tools</span>
                <span style={{ fontSize: 11, color: "var(--reddit-orange)" }}>Mod Panel</span>
              </div>
              <StewardConfirmPanel
                stewardId={demoSteward}
                needs={pageNeeds}
                readyToConfirm={readyToConfirm}
              />
              <div style={{ marginTop: 12 }}>
                <TimelineComposer caseId={page.id} stewardId={demoSteward} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
