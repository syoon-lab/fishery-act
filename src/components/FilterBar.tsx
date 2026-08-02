import { GROUP_LABEL } from "@/domain/display";
import { isoToCalendarDate, toIsoDate } from "@/domain/date";
import { GROUP_ORDER, industriesByGroup, regions } from "@/domain/repository";
import type { Filters } from "@/hooks/useFilters";

interface Props {
  filters: Filters;
  isToday: boolean;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}

/** 어업 선택·날짜·지역 + 구분 탭(알약형) 필터 바 — URL 동기화 (fishery-regulation 조회 화면 패턴) */
export default function FilterBar({ filters, isToday, onChange, onReset }: Props) {
  const grouped = industriesByGroup();
  const sortedRegions = [...regions].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-500 min-w-52 flex-1">
          어업 선택
          <select
            value={filters.industryId}
            onChange={(e) => onChange({ industryId: e.target.value })}
            className="border border-slate-300 rounded-md px-2.5 py-2 text-sm text-slate-800 bg-white"
          >
            <option value="">전체 어업</option>
            {GROUP_ORDER.map((g) => {
              const list = grouped.get(g) ?? [];
              if (list.length === 0) return null;
              return (
                <optgroup key={g} label={GROUP_LABEL[g]}>
                  {list.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          기준일{isToday ? " (오늘)" : ""}
          <input
            type="date"
            value={toIsoDate(filters.date)}
            onChange={(e) => e.target.value && onChange({ date: isoToCalendarDate(e.target.value) })}
            className="border border-slate-300 rounded-md px-2.5 py-1.5 text-sm text-slate-800 bg-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          지역 (시·도)
          <select
            value={filters.regionCode}
            onChange={(e) => onChange({ regionCode: e.target.value })}
            className="border border-slate-300 rounded-md px-2.5 py-2 text-sm text-slate-800 bg-white"
          >
            <option value="">전국</option>
            {sortedRegions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 구분 탭 — 누르는 라벨 (fishery-regulation 분류 탭 패턴) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {["", ...GROUP_ORDER].map((g) => (
            <button
              key={g || "전체"}
              type="button"
              onClick={() => onChange({ group: g })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filters.group === g
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
              }`}
            >
              {g ? GROUP_LABEL[g] : "전체"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
