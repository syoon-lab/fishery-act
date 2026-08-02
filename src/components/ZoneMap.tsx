import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Zone } from "@/domain/schema";

/**
 * 금지해역 지도 — 별표 7 좌표를 차례대로 연결한 선을 OSM 지도 위에 그린다.
 * 첫 점과 끝 점이 같으면 폐곡선(폴리곤), 아니면 경계선(폴리라인)으로 그린다
 * (법령이 "…를 연결한 선 안의 해역"으로 정의하므로 해안선 쪽은 선이 열려 있을 수 있음).
 */
export default function ZoneMap({ zone }: { zone: Zone }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !zone.polygons?.length) return;
    const map = L.map(ref.current, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 12,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const bounds = L.latLngBounds([]);
    for (const poly of zone.polygons) {
      const pts = poly.points.map(([lat, lng]) => L.latLng(lat, lng));
      pts.forEach((p) => bounds.extend(p));
      const first = poly.points[0];
      const last = poly.points[poly.points.length - 1];
      const isClosed = poly.points.length >= 4 && first[0] === last[0] && first[1] === last[1];
      const tooltip = [poly.label, poly.note].filter(Boolean).join(" — ");
      // 폐곡선(첫 점=끝 점)만 면으로 그린다. 열린 좌표열은 해안선으로 닫히는
      // 경계선이므로 절대 임의로 닫지 않고 점선 폴리라인으로만 표시한다.
      const layer = isClosed
        ? L.polygon(pts, { color: "#b91c1c", weight: 2, fillOpacity: 0.15 })
        : L.polyline(pts, { color: "#b91c1c", weight: 3, dashArray: "6 4" });
      if (tooltip) layer.bindTooltip(tooltip, { sticky: true });
      layer.addTo(map);
    }
    map.fitBounds(bounds.pad(0.2));
    return () => {
      map.remove();
    };
  }, [zone]);

  if (!zone.polygons?.length) return null;
  return (
    <div className="space-y-1">
      <div ref={ref} className="h-96 w-full rounded-xl border border-slate-200 z-0" />
      <p className="text-[11px] text-slate-400">
        별표 7 좌표(도·분·초)를 그대로 연결해 표시한 참고용 그림입니다. 점선·열린 선은 해안선과
        만나 닫히는 경계선이며, 실제 범위는 원문·부도를 기준으로 하세요.
      </p>
    </div>
  );
}
