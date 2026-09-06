import { getStore } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import VolunteerForm from "@/components/volunteer-form";

export const dynamic = "force-dynamic";

const CAT_EMOJI: Record<string, string> = {
  food: "🍱",
  clothing: "👕",
  medical: "🏥",
  education: "📚",
  shelter: "🏠",
  hygiene: "🧼",
  mobility: "♿",
  time: "⏰",
  service: "🔧",
  teaching: "📖",
  skills: "💡",
};

export default async function VolunteersPage() {
  const [store, viewerId] = await Promise.all([getStore(), getCurrentUserId()]);

  // Group volunteers by category
  const byCategory = store.volunteers.reduce<Record<string, typeof store.volunteers>>((acc, v) => {
    acc[v.category] = acc[v.category] ?? [];
    acc[v.category].push(v);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Volunteer Register 🙌
        </h1>
        <p className="muted" style={{ fontSize: 15, maxWidth: 560 }}>
          Are you a retired teacher, a doctor with spare time, or someone who cooks extra? Register yourself here and let the community find you.
        </p>
      </div>

      <VolunteerForm userId={viewerId} />

      {Object.keys(byCategory).length > 0 ? (
        <div style={{ marginTop: 36 }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>Available Volunteers</h2>
          {Object.entries(byCategory).map(([cat, vols]) => (
            <div key={cat} style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>{CAT_EMOJI[cat] ?? "🤝"}</span>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                <span className="chip" style={{ fontWeight: 600, fontSize: 12 }}>{vols.length}</span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {vols.map(v => {
                  const user = store.users.find(u => u.id === v.user_id);
                  return (
                    <div key={v.id} className="card volunteer-card" style={{ borderTop: "3px solid var(--accent)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div className="avatar" style={{ background: "var(--accent)", fontSize: 18, width: 44, height: 44 }}>
                          {v.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>
                            {v.name}
                            {user?.honor_badge ? <span className="badge-pill" style={{ marginLeft: 6 }}>🏆 x{user.honor_badge}</span> : null}
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>{timeAgo(v.created_at)}</div>
                        </div>
                      </div>
                      <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>{v.description}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                        <span className="chip area-chip">📍 {v.area}</span>
                        <span className="chip">⏰ {v.availability}</span>
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        📞 {v.contact}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ marginTop: 40 }}>
          No volunteers registered yet. Be the first one! 🌟
        </div>
      )}
    </div>
  );
}
