import type { PeriodSpec, Rule, RuleKind } from "./schema";

/**
 * 기간 표시: {4,1}~{6,30} → "4. 1.~6. 30." / allYear → "연중".
 * 종료일 {2,29}는 법령 표현("2월 말일")로 표시한다 — 평년·윤년 모두 포괄하는 인코딩.
 */
export function formatPeriod(p: PeriodSpec): string {
  if (p.kind === "allYear") return "연중";
  const s = `${p.start.month}. ${p.start.day}.`;
  const isFebEnd = p.end.month === 2 && p.end.day === 29;
  const e = isFebEnd ? "2월 말일" : `${p.end.month}. ${p.end.day}.`;
  const crossing = p.start.month * 100 + p.start.day > p.end.month * 100 + p.end.day;
  return crossing ? `${s}~다음 해 ${e}` : `${s}~${e}`;
}

export function formatPeriods(periods: PeriodSpec[]): string {
  return periods.map(formatPeriod).join(", ");
}

/** 배지 표기 — 법령(법 제60조, 별표 5·7·8)의 용어를 그대로 사용 */
export const KIND_LABEL: Record<RuleKind, string> = {
  fullClosure: "조업금지",
  gearUseBan: "어구사용금지",
  speciesCaptureBan: "포획금지",
  lightBan: "불빛이용금지",
  gearFormBan: "어구사용금지",
  meshLimit: "그물코의 규격",
  methodBan: "사용방법",
  zoneLimit: "조업구역",
};

/** kind별 색상 클래스 (배지) */
export const KIND_BADGE_CLASS: Record<RuleKind, string> = {
  fullClosure: "bg-red-100 text-red-800 border-red-200",
  gearUseBan: "bg-amber-100 text-amber-800 border-amber-200",
  speciesCaptureBan: "bg-orange-100 text-orange-800 border-orange-200",
  lightBan: "bg-yellow-100 text-yellow-800 border-yellow-200",
  gearFormBan: "bg-purple-100 text-purple-800 border-purple-200",
  meshLimit: "bg-sky-100 text-sky-800 border-sky-200",
  methodBan: "bg-slate-100 text-slate-700 border-slate-200",
  zoneLimit: "bg-teal-100 text-teal-800 border-teal-200",
};

/**
 * 위반 시 제재 기본값.
 * - 별표 7·8·2 기반(어구의 규모등, 법 제60조제1항) 위반 → 법 제109조 + 별표 7은 과징금 갈음 불가
 * - 조업구역(법 제55조 명령) 위반 → 법 제107조
 */
/**
 * 위반 시 제재.
 * - 조업구역(별표 5, 법 제55조 명령) 위반 → 법 제107조. 근해어업 조업구역 위반은
 *   어업정지 처분을 과징금으로 갈음할 수 없음(시행령 제69조제2항제4호).
 * - 어구의 규모등(법 제60조제1항) 위반 → 법 제109조. 이 중 **별표 7**(어구사용의
 *   금지구역·금지기간, 제38조제2항) 위반만 과징금 갈음 불가(제69조제2항제5호) —
 *   별표 8(그물코)·별표 2(사용방법) 위반은 갈음 불가 목록에 없음.
 */
export function penaltyFor(rule: Rule): string {
  if (rule.penalty) return rule.penalty;
  const noSubstitute = "어업정지 처분을 과징금으로 갈음할 수 없음(시행령 제69조제2항)";
  if (rule.kind === "zoneLimit") {
    return `법 제107조(2년 이하의 징역 또는 2천만원 이하의 벌금) · ${noSubstitute}`;
  }
  const base = "법 제109조(1천만원 이하의 벌금)";
  const fromAnnex7 = rule.sourceId === "annex-7";
  const noSub = rule.noSubstituteFine ?? fromAnnex7;
  return noSub ? `${base} · ${noSubstitute}` : base;
}

export const GROUP_LABEL: Record<string, string> = {
  offshore: "근해어업",
  coastal: "연안어업",
  demarcated: "구획어업",
  licensed: "면허어업",
  reported: "신고어업",
};
