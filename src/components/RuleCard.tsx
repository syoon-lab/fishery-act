import { Link } from "react-router";
import type { JudgedRule } from "@/domain/judge";
import { formatPeriods, KIND_BADGE_CLASS, KIND_LABEL, penaltyFor } from "@/domain/display";
import { getRegion, getSource, getZone } from "@/domain/repository";

/**
 * 판정된 규칙 1건의 표시 카드.
 * 가독성 원칙: 첫눈에는 "무엇이 · 언제 · 어디서"만 보이고,
 * 예외·비고·제재·근거 원문은 "자세히"로 접어 둔다 (법령 문구는 원문 그대로 유지).
 */
export default function RuleCard({ judged, showPenalty }: { judged: JudgedRule; showPenalty?: boolean }) {
  const { rule } = judged;
  const source = getSource(rule.sourceId);
  const hasDetails =
    (rule.exceptions?.length ?? 0) > 0 || rule.note || showPenalty || rule.rawText;

  const groupBadge = judged.fromGroup
    ? rule.id.startsWith("common-offshore")
      ? "모든 근해어업"
      : rule.id.startsWith("common-coastal")
        ? "모든 연안어업"
        : "구획어업 중 모든 어업"
    : null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded border ${KIND_BADGE_CLASS[rule.kind]}`}
        >
          {KIND_LABEL[rule.kind]}
        </span>
        <span className="font-semibold text-slate-800">{rule.label}</span>
        {groupBadge && (
          <span className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
            {groupBadge}
          </span>
        )}
      </div>

      <div className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-0.5">
        <span>
          금지기간: <b>{formatPeriods(judged.effectivePeriods)}</b>
          {rule.timeOfDay && (
            <span>
              {" "}
              ({rule.timeOfDay.from}~{rule.timeOfDay.to})
            </span>
          )}
        </span>
        {judged.regionDependent && (
          <span className="text-amber-700">지역에 따라 기간이 다름 — 시·도를 선택하세요</span>
        )}
        {rule.sidos && (
          <span className="text-amber-700">
            적용 시·도 한정: {rule.sidos.map((s) => getRegion(s)?.shortName ?? s).join("·")}
          </span>
        )}
      </div>

      {rule.zoneIds && rule.zoneIds.length > 0 && (
        <div className="text-sm text-slate-600">
          금지구역:{" "}
          {rule.zoneIds.map((zid, i) => {
            const zone = getZone(zid);
            const hasMap = (zone?.polygons?.length ?? 0) > 0;
            return (
              <span key={zid}>
                {i > 0 && ", "}
                {hasMap ? (
                  <Link to={`/zones/${zid}`} className="text-accent hover:underline">
                    {zone?.name ?? zid} 🗺
                  </Link>
                ) : (
                  <span>{zone?.name ?? zid}</span>
                )}
              </span>
            );
          })}
        </div>
      )}

      {hasDetails && (
        <details className="text-xs group">
          <summary className="cursor-pointer text-slate-400 hover:text-accent select-none">
            자세히 (예외·제재·근거)
          </summary>
          <div className="mt-1.5 space-y-1 border-l-2 border-slate-100 pl-3">
            {rule.exceptions && rule.exceptions.length > 0 && (
              <ul className="text-slate-500 list-disc pl-4">
                {rule.exceptions.map((e) => (
                  <li key={e}>예외: {e}</li>
                ))}
              </ul>
            )}
            {rule.note && <p className="text-slate-500">{rule.note}</p>}
            {showPenalty && <p className="text-red-700/80">위반 시: {penaltyFor(rule)}</p>}
            <p className="text-slate-400">
              근거: {source?.name ?? rule.sourceId} — “{rule.rawText}”
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
