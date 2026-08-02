import { Link, useLocation, useParams } from "react-router";
import RuleCard from "@/components/RuleCard";
import YearTimeline from "@/components/YearTimeline";
import { GROUP_LABEL } from "@/domain/display";
import { judgeIndustry } from "@/domain/judge";
import { toIsoDate } from "@/domain/date";
import { getIndustry, getRegion, groupRulesFor } from "@/domain/repository";
import { useFilters } from "@/hooks/useFilters";
import NotFoundPage from "./NotFoundPage";

/** 어업 상세 = 판정 화면. 조회 화면에서 넘어온 기준일·지역(URL)을 그대로 적용한다. */
export default function IndustryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { filters, isToday } = useFilters();
  const industry = id ? getIndustry(id) : undefined;
  if (!industry) return <NotFoundPage />;

  const region = filters.regionCode ? getRegion(filters.regionCode) : undefined;
  const j = judgeIndustry(industry, groupRulesFor(industry.group), {
    date: filters.date,
    sido: filters.regionCode || undefined,
  });
  const groupRules = groupRulesFor(industry.group);
  const timelineRules = [...industry.rules, ...groupRules].filter(
    (r) => r.periods.some((p) => p.kind === "annual") || r.timeOfDay,
  );
  const dateLabel = isToday ? "오늘" : toIsoDate(filters.date);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link
          to={{ pathname: "/", search: location.search }}
          className="text-xs text-slate-400 hover:text-accent"
        >
          ← 조회 목록
        </Link>
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-lg font-bold text-slate-900">{industry.name}</h1>
          <span className="text-sm text-slate-500">{GROUP_LABEL[industry.group]}</span>
          <span className="text-sm text-slate-500">
            — {dateLabel}
            {region ? ` · ${region.shortName}` : ""} 기준 판정
          </span>
        </div>
        <p className="text-sm text-slate-600">{industry.definition.rawText}</p>
        <p className="text-xs text-slate-400">근거: {industry.definition.articleRef}</p>
      </div>

      {j.fullClosures.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-red-700">
            ⛔ 조업금지 적용 중 ({j.fullClosures.length}건)
          </h2>
          {j.fullClosures.map((jr) => (
            <RuleCard key={jr.rule.id} judged={jr} showPenalty />
          ))}
        </section>
      ) : (
        <p className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3.5 py-2.5">
          이 날짜 기준 <b>조업금지(전 구역)는 적용되지 않습니다</b>
          {j.activeBans.length > 0 || j.standing.length > 0
            ? " — 아래 어구·포획·해역 제한은 확인이 필요합니다."
            : "."}
        </p>
      )}

      {(industry.targetLimit || industry.bycatch) && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
          <h2 className="text-sm font-bold text-slate-700">
            포획할 수 있는 수산동물의 종류·혼획 (법 제40조제4항·제42조)
          </h2>
          {industry.targetLimit && (
            <p className="text-sm text-slate-700">
              포획할 수 있는 수산동물: <b>{industry.targetLimit.species}</b>
              {industry.targetLimit.excludeNote && ` (${industry.targetLimit.excludeNote})`}
              {industry.targetLimit.regionNote && ` — ${industry.targetLimit.regionNote}`}
            </p>
          )}
          <p className="text-sm text-slate-600">
            {industry.bycatch?.allowed
              ? `혼획: 그 밖의 수산동물을 총어획량의 ${industry.bycatch.allowedPercent}퍼센트 이내에서 허용(별표 3). 혼획저감장치 부착·지정된 매매장소에서 매매 의무(법 제42조).`
              : industry.targetLimit
                ? "혼획: 허용 규정 없음 — 다른 종류의 수산동물을 혼획하여서는 안 됨(법 제42조제1항, 위반 시 2년 이하의 징역 또는 2천만원 이하의 벌금)."
                : "포획할 수 있는 수산동물의 종류 한정 없음(수산동물 일반)."}
          </p>
        </section>
      )}

      {(industry.operationZoneNote || industry.permitQuota) && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
          <h2 className="text-sm font-bold text-slate-700">조업구역·허가정수 (별표 5)</h2>
          {industry.operationZoneNote && (
            <p className="text-sm text-slate-700">{industry.operationZoneNote}</p>
          )}
          {industry.permitQuota && (
            <ul className="text-sm text-slate-600 list-disc pl-5">
              {industry.permitQuota.map((q, i) => (
                <li key={i}>
                  {q.zoneNote}: <b>{q.count}건</b>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-red-700/80">
            조업구역 위반 시: 법 제107조(2년 이하의 징역 또는 2천만원 이하의 벌금) · 어업정지 처분을
            과징금으로 갈음할 수 없음(시행령 제69조제2항)
          </p>
        </section>
      )}

      {timelineRules.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-700">연간 타임라인</h2>
          <YearTimeline rules={timelineRules} />
        </section>
      )}

      {j.activeBans.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-amber-800">적용 중인 금지 ({j.activeBans.length}건)</h2>
          {j.activeBans.map((jr) => (
            <RuleCard key={jr.rule.id} judged={jr} showPenalty />
          ))}
        </section>
      )}

      {j.standing.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-600">연중 적용되는 제한 ({j.standing.length}건)</h2>
          {j.standing.map((jr) => (
            <RuleCard key={jr.rule.id} judged={jr} showPenalty />
          ))}
        </section>
      )}

      {j.inactive.length > 0 && (
        <details className="space-y-2">
          <summary className="text-sm font-bold text-slate-400 cursor-pointer select-none hover:text-slate-600">
            이 날짜에 적용되지 않는 기간 규정 ({j.inactive.length}건) — 펼쳐보기
          </summary>
          <div className="space-y-2 mt-2">
            {j.inactive.map((jr) => (
              <RuleCard key={jr.rule.id} judged={jr} showPenalty />
            ))}
          </div>
        </details>
      )}

      {industry.note && (
        <p className="text-sm bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-3.5 py-2.5">
          {industry.note}
        </p>
      )}
    </div>
  );
}
