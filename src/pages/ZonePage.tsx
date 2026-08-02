import { Link, useParams } from "react-router";
import ZoneMap from "@/components/ZoneMap";
import { getZone, groupRulesMap, industries, zones } from "@/domain/repository";
import NotFoundPage from "./NotFoundPage";

/** 해역 상세 — 이 해역을 참조하는 규칙·어업 역인덱스 */
export default function ZonePage() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-bold text-slate-900">금지해역 목록</h1>
        <div className="grid sm:grid-cols-2 gap-2">
          {zones.map((z) => (
            <Link
              key={z.id}
              to={`/zones/${z.id}`}
              className="bg-white rounded-lg border border-slate-200 p-3 hover:border-accent"
            >
              <div className="font-semibold text-slate-800">{z.name}</div>
              <p className="text-xs text-slate-500 mt-0.5">{z.shortDesc}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  const zone = getZone(id);
  if (!zone) return <NotFoundPage />;
  return <ZoneDetail zoneId={zone.id} />;
}

function ZoneDetail({ zoneId }: { zoneId: string }) {
  const zone = getZone(zoneId)!;

  const referencing = industries
    .map((i) => ({
      industry: i,
      rules: i.rules.filter((r) => r.zoneIds?.includes(zone.id)),
    }))
    .filter((x) => x.rules.length > 0);
  const groupReferencing = Object.entries(groupRulesMap)
    .flatMap(([group, rules]) => rules.map((r) => ({ group, rule: r })))
    .filter((x) => x.rule.zoneIds?.includes(zone.id));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-xs text-slate-400 hover:text-accent"
        >
          ← 뒤로
        </button>
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-lg font-bold text-slate-900">{zone.name}</h1>
          {zone.ref && (
            <span className="text-xs text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">
              {zone.ref}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600">{zone.shortDesc}</p>
        {zone.mapRef && <p className="text-xs text-slate-400">원문 도면: {zone.mapRef}</p>}
      </div>

      {zone.polygons?.length ? (
        <ZoneMap zone={zone} />
      ) : (
        <p className="text-sm bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-3.5 py-2.5">
          이 해역은 좌표가 아니라 해안선 거리·행정구역 기준으로 정의되어 지도 표시를 제공하지
          않습니다. 시행령 별표 7 원문을 확인하세요.
        </p>
      )}
      <section className="space-y-2">
        <h2 className="text-sm font-bold text-slate-700">이 해역이 적용되는 규정</h2>
        {groupReferencing.map(({ group, rule }) => (
          <div key={rule.id} className="bg-white rounded-lg border border-slate-200 p-3 text-sm">
            <b>모든 {group === "offshore" ? "근해" : group === "coastal" ? "연안" : "구획"}어업</b> —{" "}
            {rule.label}
          </div>
        ))}
        {referencing.map(({ industry, rules }) => (
          <div key={industry.id} className="bg-white rounded-lg border border-slate-200 p-3 text-sm">
            <Link to={`/industries/${industry.id}`} className="font-semibold text-accent hover:underline">
              {industry.name}
            </Link>{" "}
            — {rules.map((r) => r.label).join(" · ")}
          </div>
        ))}
        {referencing.length === 0 && groupReferencing.length === 0 && (
          <p className="text-sm text-slate-500">이 해역을 참조하는 규칙이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
