import { getStore, getOffers } from "@/lib/store";
import { getCurrentUserId } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import OfferForm from "@/components/offer-form";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const [store, offers, viewerId] = await Promise.all([getStore(), getOffers(), getCurrentUserId()]);

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Offers Board</h1>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            Have something to provide? Offer food, books, time, or services here.
          </p>
        </div>
      </div>

      <OfferForm userId={viewerId} />

      <h2 className="section-title" style={{ marginTop: 24 }}>Available Offers</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {offers.map((o) => {
          const user = store.users.find(u => u.id === o.user_id);
          return (
            <div key={o.id} className="card" style={{ borderLeft: "4px solid var(--good)" }}>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="chip area-chip">📍 {o.area}</span>
                  <span className="chip" style={{ background: "var(--surface)" }}>{o.category}</span>
                </div>
                <span className="faint">{timeAgo(o.created_at)}</span>
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>{o.title}</h3>
              <div style={{ fontSize: 14, marginBottom: 12 }}>
                <strong>Quantity / Details:</strong> {o.quantity}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                Offered by: <strong>{user?.display_name ?? "Unknown"}</strong> {user?.honor_badge ? `🏆x${user.honor_badge}` : ""}
                <br />
                Contact: {o.contact}
              </div>
            </div>
          );
        })}
        {offers.length === 0 && (
          <div className="empty">No offers posted yet. Be the first to offer help!</div>
        )}
      </div>
    </div>
  );
}
