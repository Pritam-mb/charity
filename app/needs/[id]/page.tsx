import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore, getFollowForUser } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";
import NeedCardItem from "@/components/need-card";
import FollowButton from "@/components/follow-button";
import { categoryInfo, formatCategory, formatUrgency, urgencyInfo } from "@/lib/categories";
import { timeAgo, getLetterBg } from "@/lib/utils";
import MapView from "@/components/map";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  partially_fulfilled: "Partial",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  open: "var(--reddit-green)",
  partially_fulfilled: "var(--reddit-warn)",
  fulfilled: "var(--reddit-blue)",
  cancelled: "var(--reddit-danger)",
};

export default async function NeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [store, viewerId] = await Promise.all([getStore(), getCurrentUserId()]);

  const need = store.needs.find((n) => n.id === id);
  if (!need) notFound();

  const casePage =
    need.owner_type === "case_page"
      ? store.case_pages.find((c) => c.id === need.owner_id)
      : undefined;

  const viewerFollow = casePage
    ? await getFollowForUser(viewerId, "case", casePage.id)
    : undefined;

  const pledges = store.pledges.filter(
    (p) => p.need_card_id === need.id && p.status !== "cancelled"
  );

  const shareCount = store.shares.filter((s) => s.need_card_id === need.id).length;
  const reactionCount = store.reactions.filter((r) => r.need_card_id === need.id).length;
  const comments = store.comments.filter((c) => c.need_card_id === need.id);
  const isSupported =
    store.reactions.some(
      (r) => r.need_card_id === need.id && r.user_id === viewerId && r.kind === "support"
    ) ?? false;

  const cat = categoryInfo(need.ai_tags.category);
  const urg = urgencyInfo(need.ai_tags.urgency);

  const steward = casePage
    ? store.users.find((u) => casePage.stewards.includes(u.id))
    : null;
  const posterDisplayName = casePage
    ? (steward?.display_name ?? `${casePage.alias} Care Steward`)
    : (store.users.find((u) => u.id === need.owner_id)?.display_name ??
      "Community Volunteer");

  const caseNeeds = casePage
    ? store.needs.filter((n) => n.owner_type === "case_page" && n.owner_id === casePage.id)
    : [];
  const openCount = caseNeeds.filter(
    (n) => n.status === "open" || n.status === "partially_fulfilled"
  ).length;

  const firstLetter = casePage?.alias.trim().slice(0, 1).toUpperCase() || "C";
  const avatarBg = getLetterBg(firstLetter);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div className="need-detail-breadcrumb">
        {casePage ? (
          <>
            <Link href="/" className="need-detail-crumb">Feed</Link>
            <span className="need-detail-crumb-sep">/</span>
            <Link href={`/cases/${casePage.id}`} className="need-detail-crumb">
              {casePage.alias}&apos;s case
            </Link>
            <span className="need-detail-crumb-sep">/</span>
            <span className="need-detail-crumb current">Need detail</span>
          </>
        ) : (
          <>
            <Link href="/" className="need-detail-crumb">Feed</Link>
            <span className="need-detail-crumb-sep">/</span>
            <span className="need-detail-crumb current">Need detail</span>
          </>
        )}
      </div>

      <div className="reddit-feed-layout" style={{ maxWidth: "100%" }}>
        {/* Main: this post / issue only */}
        <div className="reddit-feed-main" style={{ maxWidth: 720 }}>
          {/* Post summary hero */}
          <div className="need-detail-hero">
            <div className="reddit-flair-row" style={{ marginBottom: 10 }}>
              <span className="reddit-flair reddit-flair-category" style={{ background: cat.color }}>
                {formatCategory(need.ai_tags.category)}
              </span>
              <span className="reddit-flair reddit-flair-area">{need.area}</span>
              <span
                className="reddit-flair reddit-flair-urgency"
                style={{ color: urg.color, background: `${urg.color}1c`, borderColor: `${urg.color}55` }}
              >
                {formatUrgency(need.ai_tags.urgency)}
              </span>
              <span
                className="reddit-flair reddit-flair-status"
                style={{
                  color: STATUS_COLOR[need.status],
                  background: `${STATUS_COLOR[need.status]}18`,
                  border: `1px solid ${STATUS_COLOR[need.status]}44`,
                }}
              >
                {STATUS_LABEL[need.status]}
              </span>
            </div>

            <h1 className="need-detail-title">{need.caption}</h1>

            <div className="need-detail-meta">
              <span className="reddit-meta-pill">
                Item: <strong>{need.ai_tags.item_type}</strong>
              </span>
              <span className="reddit-meta-pill">
                Quantity: <strong>{need.quantity}</strong>
              </span>
              {need.tagged_org && (
                <span className="reddit-meta-pill org-pill">Org: @{need.tagged_org}</span>
              )}
              <span className="need-detail-byline">
                Posted by <strong>{posterDisplayName}</strong> • {timeAgo(need.created_at)}
              </span>
            </div>
          </div>

          {/* The full interactive post card for this issue */}
          <NeedCardItem
            need={need}
            pledges={pledges}
            casePage={casePage}
            caseAlias={casePage?.alias}
            caseArea={casePage?.broad_area}
            anchorPoints={store.anchor_points}
            viewerId={viewerId}
            shareCount={shareCount}
            reactionCount={reactionCount}
            isSupported={isSupported}
            users={store.users}
            comments={comments}
            follow={viewerFollow}
          />
        </div>

        {/* Right: the person this is about -> full history */}
        <aside className="reddit-feed-right-rail">
          {casePage ? (
            <div className="reddit-widget">
              <div className="reddit-widget-body">
                <div className="need-case-summary-top">
                  <div
                    className="reddit-case-avatar"
                    style={{ background: avatarBg, color: "#ffffff", fontWeight: 800, width: 50, height: 50, fontSize: 20 }}
                  >
                    {firstLetter}
                  </div>
                  <div>
                    <div className="reddit-widget-title" style={{ margin: 0 }}>
                      {casePage.alias}
                    </div>
                    <div className="faint" style={{ fontSize: 12 }}>{casePage.broad_area}</div>
                  </div>
                </div>

                <p className="reddit-widget-desc" style={{ marginTop: 10 }}>
                  {casePage.intro_text
                    .replace(/A verbal consent clip was recorded before this page opened\.?/gi, "")
                    .trim() || "A neighbor supported by verified community stewards."}
                </p>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className="chip" style={{ color: "var(--reddit-green)" }}>{openCount} open needs</span>
                  <span className="chip">{caseNeeds.length} total needs</span>
                  {casePage.handler_name && (
                    <span className="chip" style={{ color: "var(--reddit-orange)" }}>
                      {casePage.handler_name}
                    </span>
                  )}
                </div>

                <FollowButton
                  followeeType="case"
                  followeeId={casePage.id}
                  viewerId={viewerId}
                  initialFollowed={!!viewerFollow}
                  initialWantUpdates={viewerFollow?.want_updates ?? true}
                  label={viewerFollow ? "Following case" : "Follow this case"}
                />

                <Link href={`/cases/${casePage.id}`} className="btn btn-primary" style={{ width: "100%", marginTop: 12, justifyContent: "center" }}>
                  View {casePage.alias}&apos;s full history
                </Link>
              </div>
            </div>
          ) : (
            <div className="reddit-widget">
              <div className="reddit-widget-body">
                <div className="reddit-widget-title">About this post</div>
                <p className="reddit-widget-desc">
                  This need was posted directly by a neighbor without a case page. You can support
                  it through the open pledge pool on the card.
                </p>
                <MapView label={need.area} query={need.area} />
              </div>
            </div>
          )}

          <div className="reddit-widget">
            <div className="reddit-widget-body">
              <div className="reddit-widget-title">NeedReel Platform Rules</div>
              <div className="reddit-rule-list">
                <div className="reddit-rule-item">
                  <span className="reddit-rule-num">1.</span>
                  <span><strong>Strictly In-Kind:</strong> Goods, time, and essential help only. Zero cash transactions.</span>
                </div>
                <div className="reddit-rule-item">
                  <span className="reddit-rule-num">2.</span>
                  <span><strong>Two-Party Handoff:</strong> Giver marks handoff, steward confirms receipt before honor badges earn.</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}