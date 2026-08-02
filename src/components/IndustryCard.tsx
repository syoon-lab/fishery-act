import { Link, useLocation } from "react-router";
import type { IndustryJudgement } from "@/domain/judge";
import type { Industry } from "@/domain/schema";
import { formatPeriods } from "@/domain/display";

interface Props {
  industry: Industry;
  judgement: IndustryJudgement;
}

/**
 * 판정 배지 — fishery-regulation StatusBadge 패턴.
 * 해역 한정 규정만 있는 경우는 전면 금지와 구분해 표시한다 (그 해역 밖에서는 조업 가능).
 */
function StatusBadge({ j }: { j: IndustryJudgement }) {
  if (j.fullClosures.length > 0) {
    const allZoneLimited = j.fullClosures.every((x) => x.zoneLimited);
    return (
      <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
        조업금지{allZoneLimited ? " (해역 한정)" : ""}
      </span>
    );
  }
  if (j.activeBans.length > 0) {
    const allZoneLimited = j.activeBans.every((x) => x.zoneLimited);
    return allZoneLimited ? (
      <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        해역 한정 금지 {j.activeBans.length}건
      </span>
    ) : (
      <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
        금지 {j.activeBans.length}건 적용 중
      </span>
    );
  }
  return (
    <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
      적용 중 금지 없음
    </span>
  );
}

const labelClass = "font-bold text-slate-900 mr-1";

/**
 * 조회 목록용 어업 카드 — 판정 배지와 핵심 규정 요약, 상세로 링크 (검색조건 유지).
 * 세부 조건(해역·예외·지역 변형)은 상세 페이지 몫 — 카드는 존재만 알린다.
 */
export default function IndustryCard({ industry, judgement: j }: Props) {
  const location = useLocation();
  // 조업금지 규정 요약 (발동 여부와 무관하게 기간 표시)
  const closureRules = industry.rules.filter((r) => r.kind === "fullClosure");
  const standingCount = j.standing.length;

  return (
    <Link
      to={{ pathname: `/industries/${industry.id}`, search: location.search }}
      className="block bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 min-w-0">{industry.name}</h3>
        <StatusBadge j={j} />
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-600">
        {closureRules.length > 0 ? (
          closureRules.map((r) => (
            <p key={r.id} className="truncate">
              <span className={labelClass}>조업금지</span>
              {formatPeriods(r.periods)}
              {r.zoneIds && r.zoneIds.length > 0 && (
                <span className="text-slate-400"> (해역 한정)</span>
              )}
              {r.regionVariants && <span className="text-slate-400"> (지역별 상이)</span>}
            </p>
          ))
        ) : (
          <p className="text-slate-400">조업금지 기간 없음</p>
        )}
        {industry.targetLimit ? (
          <p className="truncate">
            <span className={labelClass}>포획 가능</span>
            {industry.targetLimit.species}
            {industry.targetLimit.excludeNote && ` (${industry.targetLimit.excludeNote})`}
            {industry.bycatch?.allowed && (
              <span className="text-slate-400"> · 혼획 {industry.bycatch.allowedPercent}% 이내</span>
            )}
          </p>
        ) : (
          <p className="text-slate-400">포획할 수 있는 수산동물 한정 없음</p>
        )}
        {standingCount > 0 && (
          <p className="text-blue-700">연중 적용 제한 {standingCount}건 (상세 참조)</p>
        )}
      </div>
    </Link>
  );
}
