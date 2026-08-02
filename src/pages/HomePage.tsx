import { useMemo } from "react";
import FilterBar from "@/components/FilterBar";
import IndustryCard from "@/components/IndustryCard";
import { GROUP_LABEL } from "@/domain/display";
import { judgeIndustry } from "@/domain/judge";
import { getRegion, GROUP_ORDER, groupRulesFor, industries } from "@/domain/repository";
import type { IndustryGroup } from "@/domain/schema";
import { useFilters } from "@/hooks/useFilters";

/** 구분별 섹션 헤더 색상 (fishery-regulation 조회 화면 패턴) */
const GROUP_HEADER: Record<IndustryGroup, string> = {
  offshore: "bg-sky-50 border-sky-200 text-sky-800",
  coastal: "bg-teal-50 border-teal-200 text-teal-800",
  demarcated: "bg-amber-50 border-amber-200 text-amber-800",
  licensed: "bg-emerald-50 border-emerald-200 text-emerald-800",
  reported: "bg-slate-100 border-slate-300 text-slate-700",
};

export default function HomePage() {
  const { filters, update, reset, isToday } = useFilters();

  const judged = useMemo(() => {
    const query = { date: filters.date, sido: filters.regionCode || undefined };
    return industries.map((industry) => ({
      industry,
      judgement: judgeIndustry(industry, groupRulesFor(industry.group), query),
    }));
  }, [filters.date, filters.regionCode]);

  const visible = useMemo(
    () =>
      judged.filter(({ industry, judgement }) => {
        if (filters.industryId && industry.id !== filters.industryId) return false;
        if (filters.group && industry.group !== filters.group) return false;
        if (filters.closedOnly && judgement.fullClosures.length === 0) return false;
        if (filters.limitedOnly && !industry.targetLimit) return false;
        return true;
      }),
    [judged, filters],
  );

  // 섹션(근해→연안→구획→면허→신고)은 유지, 각 섹션 안은 어업명 가나다순
  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        items: visible
          .filter((e) => e.industry.group === group)
          .sort((a, b) => a.industry.name.localeCompare(b.industry.name, "ko")),
      })).filter((g) => g.items.length > 0),
    [visible],
  );

  const stats = useMemo(
    () => ({
      total: judged.length,
      closed: judged.filter((e) => e.judgement.fullClosures.length > 0).length,
      limited: judged.filter((e) => e.industry.targetLimit).length,
    }),
    [judged],
  );

  const dateLabel = `${filters.date.year}. ${filters.date.month}. ${filters.date.day}.`;

  return (
    <div className="space-y-4">
      {/* 요약 통계 = 필터 버튼 */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => update({ closedOnly: false, limitedOnly: false })}
          className={`bg-white rounded-xl border p-4 text-center transition-all hover:shadow-md ${
            !filters.closedOnly && !filters.limitedOnly
              ? "border-primary ring-2 ring-primary/30"
              : "border-slate-200"
          }`}
        >
          <p className="text-2xl font-black text-primary">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">등록 어업 전체</p>
        </button>
        <button
          type="button"
          aria-pressed={filters.closedOnly}
          onClick={() => update({ closedOnly: !filters.closedOnly })}
          className={`bg-white rounded-xl border p-4 text-center transition-all hover:shadow-md ${
            filters.closedOnly ? "border-rose-500 ring-2 ring-rose-300" : "border-rose-200"
          }`}
        >
          <p className="text-2xl font-black text-rose-600">{stats.closed}</p>
          <p className="text-xs text-slate-500 mt-1">
            {isToday ? "오늘" : dateLabel} 조업금지
            {filters.regionCode ? " (조건 적용)" : ""}
          </p>
        </button>
        <button
          type="button"
          aria-pressed={filters.limitedOnly}
          onClick={() => update({ limitedOnly: !filters.limitedOnly })}
          className={`bg-white rounded-xl border p-4 text-center transition-all hover:shadow-md ${
            filters.limitedOnly ? "border-amber-500 ring-2 ring-amber-300" : "border-amber-200"
          }`}
        >
          <p className="text-2xl font-black text-amber-600">{stats.limited}</p>
          <p className="text-xs text-slate-500 mt-1">포획할 수 있는 수산동물 한정</p>
        </button>
      </div>

      <FilterBar filters={filters} isToday={isToday} onChange={update} onReset={reset} />

      <p className="text-xs text-slate-500">
        {dateLabel} 기준 · {visible.length}개 어업 표시
        {filters.regionCode && ` · ${getRegion(filters.regionCode)?.name ?? filters.regionCode} 기준`}
      </p>

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
          <p className="text-sm text-slate-500">조건에 맞는 어업이 없습니다.</p>
          <button type="button" onClick={reset} className="text-sm text-accent underline">
            모든 조건 초기화
          </button>
        </div>
      ) : (
        grouped.map(({ group, items }) => (
          <section key={group} className="space-y-2">
            <h2
              className={`text-sm font-bold px-3 py-1.5 rounded-lg border inline-block ${GROUP_HEADER[group]}`}
            >
              {GROUP_LABEL[group]} ({items.length})
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(({ industry, judgement }) => (
                <IndustryCard key={industry.id} industry={industry} judgement={judgement} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
