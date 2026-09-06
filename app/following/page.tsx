import Link from "next/link";
import { getStore, getFollowsForUser } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";
import FollowButton from "@/components/follow-button";
import { getLetterBg } from "@/lib/utils";
import type { CasePage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FollowingPage() {
  const [store, viewerId] = await Promise.all([getStore(), getCurrentUserId()]);
  const follows = await getFollowsForUser(viewerId);

  const caseFollows = follows.filter((f) => f.followee_type === "case");
  const userFollows = follows.filter((f) => f.followee_type === "user");

  const followedCases = caseFollows
    .map((f) => store.case_pages.find((c) => c.id === f.followee_id))
    .filter((c): c is CasePage => Boolean(c))
    .map((c) => ({
      page: c,
      follow: caseFollows.find((f) => f.followee_id === c.id)!,
    }));

  const followedUsers = userFollows
    .map((f) => store.users.find((u) => u.id === f.followee_id))
    .filter(Boolean)
    .map((u) => {
      const handled = store.case_pages.filter(
        (c) =>
          c.handler_type === "ngo" &&
          c.stewards.includes(u!.id)
      );
      const orgName =
        handled.find((c) => c.handler_type === "ngo")?.handler_name ??
        u!.display_name;
      const cases = store.case_pages.filter((c) => c.stewards.includes(u!.id));
      const follow = userFollows.find((f) => f.followee_id === u!.id)!;
      return { user: u!, orgName, cases, follow };
    });

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", paddingTop: 8 }}>
      <div className="section-title" style={{ fontSize: 26, marginBottom: 4 }}>
        Your Following
      </div>
      <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
        Everyone you follow, and the update notifications you get from them.
      </p>

      {/* Followed Cases */}
      <h2 className="section-title" style={{ fontSize: 17, marginTop: 0 }}>
        Cases You&apos;re Following <span className="chip">{followedCases.length}</span>
      </h2>
      {followedCases.length === 0 ? (
        <div className="empty" style={{ marginBottom: 20 }}>
          You aren&apos;t following any cases yet. When you help someone, you&apos;ll get the option to
          follow their case for future updates.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {followedCases.map(({ page, follow }) => {
            const firstLetter = page.alias.trim().slice(0, 1).toUpperCase() || "C";
            return (
              <div className="card following-row" key={page.id}>
                <div
                  className="reddit-case-avatar"
                  style={{ background: getLetterBg(firstLetter), color: "#ffffff", fontWeight: 800, width: 46, height: 46, fontSize: 19 }}
                >
                  {firstLetter}
                </div>
                <div className="following-row-meta">
                  <div>
                    <Link href={`/cases/${page.id}`} className="following-row-name">
                      {page.alias}
                    </Link>
                  </div>
                  <div className="faint" style={{ fontSize: 12.5 }}>
                    {page.broad_area} • Managed by {page.handler_name} ({page.handler_type})
                  </div>
                </div>
                <div className="following-row-actions">
                  <Link href={`/cases/${page.id}`} className="btn btn-ghost" style={{ fontSize: 12 }}>
                    Full history
                  </Link>
                  <FollowButton
                    followeeType="case"
                    followeeId={page.id}
                    viewerId={viewerId}
                    initialFollowed
                    initialWantUpdates={follow.want_updates}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Followed NGOs / Orgs */}
      <h2 className="section-title" style={{ fontSize: 17, marginTop: 0 }}>
        Organizations You Follow <span className="chip">{followedUsers.length}</span>
      </h2>
      {followedUsers.length === 0 ? (
        <div className="empty">
          You aren&apos;t following any organizations yet.{" "}
          <Link href="/ngos" style={{ color: "var(--reddit-orange)" }}>Browse NGO directory</Link>.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {followedUsers.map(({ user, orgName, cases, follow }) => {
            const firstLetter = (orgName[0] ?? user.display_name[0] ?? "N").toUpperCase();
            return (
              <div className="card following-row" key={user.id}>
                <div
                  className="reddit-case-avatar"
                  style={{ background: getLetterBg(firstLetter), color: "#ffffff", fontWeight: 800, width: 46, height: 46, fontSize: 19 }}
                >
                  {firstLetter}
                </div>
                <div className="following-row-meta">
                  <div className="following-row-name">{orgName}</div>
                  <div className="faint" style={{ fontSize: 12.5 }}>
                    u/{user.display_name} • {cases.length} case{cases.length === 1 ? "" : "s"} stewarded
                  </div>
                </div>
                <div className="following-row-actions">
                  <FollowButton
                    followeeType="user"
                    followeeId={user.id}
                    viewerId={viewerId}
                    initialFollowed
                    initialWantUpdates={follow.want_updates}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}