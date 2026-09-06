import AuthSwitcher from "@/components/auth-switcher";
import { getCurrentUserId } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const [store, currentUserId] = await Promise.all([getStore(), getCurrentUserId()]);
  const user = store.users.find((u) => u.id === currentUserId) ?? store.users[0];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Demo auth</h1>
      <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
        Choose the active role for the hackathon demo. Leaders, NGOs, teachers, stewards and
        citizens all use the same society support zone.
      </p>

      <div className="card">
        <div className="pledge-pool-title">Signed in as</div>
        <div className="profile-row">
          <div className="avatar">{user?.display_name.slice(0, 1) ?? "U"}</div>
          <div>
            <div style={{ fontWeight: 800 }}>{user?.display_name}</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {user?.role ?? "citizen"} - Helping hand badges {user?.badge ?? 0} - Honour badges{" "}
              {user?.honor_badge ?? 0}
            </div>
          </div>
        </div>
        <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
          <label>Switch persona</label>
          <AuthSwitcher users={store.users} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
