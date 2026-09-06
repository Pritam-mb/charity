import { getStore, getFollowsForUser } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";
import FollowButton from "@/components/follow-button";
import Link from "next/link";
import { getLetterBg } from "@/lib/utils";
import type { CasePage, User } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NgoDirectoryPage() {
  const [store, viewerId] = await Promise.all([getStore(), getCurrentUserId()]);
  const follows = await getFollowsForUser(viewerId);

  const followsUser = new Set(
    follows.filter((f) => f.followee_type === "user").map((f) => f.followee_id)
  );
  const wantsUpdates = (id: string) =>
    follows.find((f) => f.followee_type === "user" && f.followee_id === id)?.want_updates ?? true;

  // NGOs: platform users with the ngo role, plus registered organizations that
  // steward a case with handler_type "ngo".
  const ngoUsers = store.users.filter((u) => u.role === "ngo");
  const orgCases = store.case_pages.filter((c) => c.handler_type === "ngo");
  const orgStewardIds = new Set<string>();
  orgCases.forEach((c) => c.stewards.forEach((s) => orgStewardIds.add(s)));
  const orgViaCase = store.users.filter((u) => orgStewardIds.has(u.id) && !ngoUsers.includes(u));

  const ngoRows = [...ngoUsers, ...orgViaCase].reduce<{ user: User; orgName: string; cases: CasePage[]; handled: CasePage[] }[]>((acc, user) => {
    if (acc.some((r) => r.user.id === user.id)) return acc;
    const handled = store.case_pages.filter(
      (c) =>
        c.handler_type === "ngo" &&
        c.stewards.includes(user.id)
    );
    const orgName =
      handled.find((c) => c.handler_type === "ngo")?.handler_name ??
      user.display_name;
    const cases = store.case_pages.filter((c) => c.stewards.includes(user.id));
    acc.push({ user, orgName, cases, handled });
    return acc;
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", paddingTop: 8 }}>
      <div className="section-title" style={{ fontSize: 26, marginBottom: 4 }}>
        NGOs &amp; Helping Organizations
      </div>
      <p className="muted" style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
        Follow an org to see the cases they steward and get updates when good news happens.
        NGOs can register from the sign-up page with the <strong style={{ color: "var(--reddit-orange)" }}>NGO Leader</strong> role.
      </p>

      {ngoRows.length === 0 ? (
        <div className="empty">No registered NGOs yet. Register one from the sign-up page!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ngoRows.map(({ user, orgName, cases }) => {
            const firstLetter = user.display_name.slice(0, 1).toUpperCase() || "N";
            const avatarBg = getLetterBg(firstLetter);
            const isFollowed = followsUser.has(user.id);
            return (
              <div className="card ngo-card" key={user.id}>
                <div className="ngo-card-top">
                  <div
                    className="reddit-case-avatar"
                    style={{ background: avatarBg, color: "#ffffff", fontWeight: 800, width: 52, height: 52, fontSize: 22 }}
                  >
                    {firstLetter}
                  </div>
                  <div className="ngo-card-meta">
                    <div className="ngo-card-name">
                      {orgName}
                      {cases.length > 0 && (
                        <span className="chip" style={{ color: "var(--reddit-orange)", borderColor: "rgba(255,69,0,0.3)", fontSize: 11 }}>
                          {cases.length} case{cases.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <div className="ngo-card-sub">
                      Registered org representative •{" "}
                      <span style={{ color: "var(--reddit-orange)", fontWeight: 700 }}>
                        Honor ✦ {user.honor_badge ?? user.badge}
                      </span>
                    </div>
                    {user.bio && <p className="ngo-card-bio">{user.bio}</p>}
                  </div>
                  <FollowButton
                    followeeType="user"
                    followeeId={user.id}
                    viewerId={viewerId}
                    initialFollowed={isFollowed}
                    initialWantUpdates={wantsUpdates(user.id)}
                    label={isFollowed ? "Following org" : "Follow org"}
                  />
                </div>

                {cases.length > 0 && (
                  <div className="ngo-card-cases">
                    <span className="faint" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      Cases they steward
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {cases.map((c) => (
                        <Link key={c.id} href={`/cases/${c.id}`} className="chip footer-chip" style={{ color: "var(--reddit-blue)", borderColor: "rgba(113,147,255,0.35)" }}>
                          {c.alias} • {c.broad_area}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}