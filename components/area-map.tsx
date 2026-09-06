"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

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

type AreaNeed = { id: string; caption: string; status: string };
type AreaPoint = { name: string; needs: AreaNeed[] };

function hashJitter(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return ((h % 100) + 100) % 100 / 100;
}

export default function AreaMap({ areas }: { areas: AreaPoint[] }) {
  const [coords, setCoords] = useState<Record<string, [number, number]>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const KOL: [number, number] = [22.5726, 88.3639];
    (async () => {
      const results: Record<string, [number, number]> = {};
      const uniqueAreas = Array.from(new Set(areas.map((a) => a.name)));
      await Promise.all(
        uniqueAreas.map(async (name) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
                `${name}, Kolkata`
              )}`
            );
            const data = await res.json();
            if (data && data.length > 0) {
              results[name] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            } else {
              results[name] = [
                KOL[0] + (hashJitter(name) - 0.5) * 0.2,
                KOL[1] + (hashJitter(`${name}x`) - 0.5) * 0.25,
              ];
            }
          } catch {
            results[name] = KOL;
          }
        })
      );
      setCoords(results);
      setReady(true);
    })();
  }, [areas]);

  // Fix Leaflet default icon issue in React
  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });
    });
  }, []);

  if (!ready) return <div className="area-map-loading">Locating local areas…</div>;

  const usedAreas = areas.filter((a) => coords[a.name]);
  const center: [number, number] = usedAreas[0]
    ? coords[usedAreas[0].name]
    : [22.5726, 88.3639];

  return (
    <div className="area-map-wrap">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {usedAreas.map((area) => (
          <Marker key={area.name} position={coords[area.name]}>
            <Popup>
              <div className="area-map-pop">
                <strong className="area-map-pop-title">{area.name}</strong>
                <div className="area-map-needs">
                  {area.needs.length === 0 && (
                    <div className="faint">No needs to show here right now.</div>
                  )}
                  {area.needs.slice(0, 3).map((n) => (
                    <Link key={n.id} href={`/needs/${n.id}`} className="area-map-need">
                      <span className="area-map-caption">{n.caption}</span>
                      <span
                        className="chip"
                        style={{ color: STATUS_COLOR[n.status], borderColor: `${STATUS_COLOR[n.status]}44` }}
                      >
                        {STATUS_LABEL[n.status]}
                      </span>
                    </Link>
                  ))}
                  {area.needs.length > 3 && (
                    <div className="area-map-more">
                      +{area.needs.length - 3} more nearby
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}