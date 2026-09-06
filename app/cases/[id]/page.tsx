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
import MapView from "@/components/map";
import CaseChatForm from "@/components/case-chat-form";
import { getCurrentUserId } from "@/lib/auth";
import QRCode from "@/components/qr-code";

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

  return (
    <div style={{ paddingBottom: 64 }}>
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
          <span className="faint">Managed by: {page.handler_name} ({page.handler_type})</span>
          <br/>
          <span className="faint">Stewards:</span>
          {stewards.map((s) => (
            <span key={s!.id} className="chip">
              🛡️ {s!.display_name} {s!.honor_badge ? `🏆x${s!.honor_badge}` : ""}
            </span>
          ))}
          <Link href="/#open-pool" className="chip" style={{ color: "var(--accent)" }}>
            How stewardship works
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: 16 }}>
        <div className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>Location</h2>
          <MapView label={page.location_label || page.alias} query={page.map_query || page.broad_area} />
        </div>
        
        <div className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>💰 Fundraiser</h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "var(--good)" }}>₹{totalRaised.toLocaleString()}</div>
              <div className="muted" style={{ fontSize: 13 }}>raised of ₹{(page.fundraiser_goal ?? 0).toLocaleString()} goal</div>
            </div>
            {page.upi_id && <QRCode value={`upi://pay?pa=${page.upi_id}&pn=${encodeURIComponent(page.bank_account_name ?? page.alias)}`} size={100} />}
          </div>
          <div style={{ width: "100%", height: 10, background: "var(--bg-elevated)", borderRadius: 5, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg, var(--good), var(--accent))", borderRadius: 5, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ padding: 12, background: "var(--bg-elevated)", borderRadius: 10, fontSize: 13 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Bank Details</div>
            <div className="muted" style={{ lineHeight: 1.8 }}>
              <div>🏦 {page.bank_name} · {page.bank_account_name}</div>
              <div>A/C: <strong>{page.bank_account_number}</strong> · IFSC: <strong>{page.bank_ifsc}</strong></div>
              <div>UPI: <strong>{page.upi_id}</strong></div>
            </div>
          </div>
          {pageDonations.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="pledge-pool-title">Donation Log</div>
              {pageDonations.map(d => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{d.donor_name}</span>
                    <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>{d.method} · {timeAgo(d.at)}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: "var(--good)" }}>₹{d.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <div style={{ padding: 12, background: "var(--bg-elevated)", borderRadius: 10, flex: 1, fontSize: 13 }}>
              <div className="faint" style={{ fontSize: 11, marginBottom: 4, textTransform: "uppercase", fontWeight: 800 }}>Govt Help</div>
              {page.government_help}
            </div>
            <div style={{ padding: 12, background: "var(--bg-elevated)", borderRadius: 10, flex: 1, fontSize: 13 }}>
              <div className="faint" style={{ fontSize: 11, marginBottom: 4, textTransform: "uppercase", fontWeight: 800 }}>Current Support</div>
              {page.current_support}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>🤝 Helping Hands</h2>
        {helpingHands.length > 0 ? (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {helpingHands.map((h) => (
              <span key={h!.id} className="chip" style={{ background: "var(--good-soft)", color: "var(--good)", border: "1px solid var(--good)", padding: "6px 14px", borderRadius: 20 }}>
                {h!.display_name} {h!.honor_badge ? `🏆 x${h!.honor_badge}` : ""}
              </span>
            ))}
          </div>
        ) : (
          <div className="empty">Be the first to help {page.alias}!</div>
        )}
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

      <h2 className="section-title">Case Discussion Channel</h2>
      <div className="card timeline" style={{ marginBottom: 16 }}>
        {caseMessages.map((m) => {
          const author = store.users.find(u => u.id === m.author_id);
          return (
            <div key={m.id} className="tl-entry" style={{ padding: 12, borderLeft: "3px solid var(--accent)" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{author?.display_name ?? "Unknown"}</div>
              <p style={{ margin: "4px 0", fontSize: 14 }}>{m.text}</p>
              <div className="muted" style={{ fontSize: 11 }}>{timeAgo(m.created_at)}</div>
            </div>
          );
        })}
        {caseMessages.length === 0 && (
          <div className="empty">No discussion messages yet.</div>
        )}
        <CaseChatForm caseId={page.id} userId={viewerId} />
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