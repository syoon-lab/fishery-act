import type { Rule } from "@/domain/schema";
import type { PeriodSpec } from "@/domain/schema";
import { KIND_BADGE_CLASS } from "@/domain/display";

/**
 * 연간 타임라인 — 기간 규칙을 12개월 막대로 표시.
 * regionVariants가 있으면 기본 기간과 변형 기간을 각각의 행으로 그린다.
 */

const MONTH_DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const YEAR_DAYS = MONTH_DAYS.reduce((a, b) => a + b, 0);

function dayOfYear(month: number, day: number): number {
  let acc = 0;
  for (let m = 1; m < month; m++) acc += MONTH_DAYS[m - 1];
  return acc + Math.min(day, MONTH_DAYS[month - 1]);
}

/** 기간 → [시작%, 끝%] 구간 목록 (연도 경계 넘는 기간은 2개로 분할) */
function periodSegments(p: PeriodSpec): [number, number][] {
  if (p.kind === "allYear") return [[0, 100]];
  const s = (dayOfYear(p.start.month, p.start.day) / YEAR_DAYS) * 100;
  const e = (dayOfYear(p.end.month, p.end.day) / YEAR_DAYS) * 100;
  return s <= e
    ? [[s, e]]
    : [
        [s, 100],
        [0, e],
      ];
}

const BAR_COLOR: Record<string, string> = {
  fullClosure: "bg-red-500/80",
  gearUseBan: "bg-amber-500/80",
  speciesCaptureBan: "bg-orange-500/80",
  lightBan: "bg-yellow-500/80",
  gearFormBan: "bg-purple-500/80",
  meshLimit: "bg-sky-500/70",
  methodBan: "bg-slate-400/70",
  zoneLimit: "bg-teal-500/70",
};

interface Row {
  label: string;
  kind: Rule["kind"];
  periods: PeriodSpec[];
  suffix?: string;
}

function rowsForRule(rule: Rule): Row[] {
  const rows: Row[] = [{ label: rule.label, kind: rule.kind, periods: rule.periods }];
  for (const v of rule.regionVariants ?? []) {
    rows.push({
      label: rule.label,
      kind: rule.kind,
      periods: v.periods,
      suffix: v.note ?? "지역 변형",
    });
  }
  return rows;
}

export default function YearTimeline({ rules }: { rules: Rule[] }) {
  const rows = rules.flatMap(rowsForRule);
  if (rows.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex text-[10px] text-slate-400 pl-44">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="flex-1 border-l border-slate-200 pl-0.5">
            {i + 1}월
          </span>
        ))}
      </div>
      {rows.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="w-42 shrink-0 text-xs text-slate-600 truncate" title={row.label} style={{ width: "10.5rem" }}>
            {row.label}
            {row.suffix && <span className="text-slate-400"> · {row.suffix}</span>}
          </div>
          <div className="relative flex-1 h-4 bg-slate-100 rounded overflow-hidden">
            {row.periods.flatMap((p, pi) =>
              periodSegments(p).map(([s, e], si) => (
                <div
                  key={`${pi}-${si}`}
                  className={`absolute top-0 bottom-0 rounded-sm ${BAR_COLOR[row.kind] ?? "bg-slate-400"}`}
                  style={{ left: `${s}%`, width: `${Math.max(e - s, 0.8)}%` }}
                  title={row.label}
                />
              )),
            )}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-slate-400 pl-44">
        색상: <span className={`inline-block w-3 h-2 rounded-sm ${KIND_BADGE_CLASS.fullClosure}`} /> 붉은색=조업금지 ·
        주황=포획금지 · 노랑·호박·보라=어구사용금지 · 하늘=그물코의 규격
      </p>
    </div>
  );
}
