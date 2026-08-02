import { isDateInAnyPeriod, type CalendarDate } from "./date";
import type { Industry, PeriodSpec, Rule } from "./schema";

/**
 * 판정 엔진 — 순수 함수 (React·데이터 로드 미의존).
 *
 * 정책:
 * - regionVariants: 질의 시·도가 variant에 매치되면 그 variant의 기간으로 "대체" 판정.
 *   시·도 미지정 질의에서는 기본 기간 ∪ 모든 variant 기간으로 판정하되
 *   regionDependent=true로 표시해 UI가 "지역에 따라 기간 다름"을 안내한다.
 * - zoneIds가 있는 규칙은 시·도 필터로 걸러내지 않는다(해역은 시·도 경계와 다름).
 *   발동 시 zoneLimited=true로 표시해 "해역 확인 필요"를 안내한다.
 * - exceptions는 판정을 뒤집지 않고 병기한다 (fishery-regulation의 suspensions 정책 계승).
 * - allYear 기간(또는 meshLimit·zoneLimit·methodBan)은 standing(상시)으로 분류한다.
 */

export interface JudgeQuery {
  date: CalendarDate;
  /** "sido:jeonnam" 등. 미지정 시 전국 관점 */
  sido?: string;
}

export interface JudgedRule {
  rule: Rule;
  /** 오늘 발동 중인가 (상시 규칙은 항상 true) */
  active: boolean;
  /** 발동 판단에 쓰인 기간들 (지역 변형 반영) */
  effectivePeriods: PeriodSpec[];
  /** 지역에 따라 기간이 달라지는 규칙인데 시·도 미지정으로 합집합 판정했는가 */
  regionDependent: boolean;
  /** 해역 한정 규칙 → "해역 확인 필요" */
  zoneLimited: boolean;
  /** 이 규칙이 그룹 공통 규칙("모든 근해어업")인가 */
  fromGroup: boolean;
}

export interface IndustryJudgement {
  /** 오늘 발동 중인 조업 전면금지 */
  fullClosures: JudgedRule[];
  /** 오늘 발동 중인 그 외 금지 (어구·어종·불빛 등) */
  activeBans: JudgedRule[];
  /** 상시 제한 (그물코·조업구역·사용방법·연중 금지) */
  standing: JudgedRule[];
  /** 오늘은 발동하지 않는 기간 규칙 (타임라인·정보 표시용) */
  inactive: JudgedRule[];
}

/**
 * 상시로 분류할 kind — 기간과 무관하게 항상 지켜야 하는 제한.
 * gearFormBan은 포함하지 않는다: 뻗침대+세목망처럼 기간 한정 규칙이 있어
 * 기간(allYear 여부)으로 분류해야 한다.
 */
const STANDING_KINDS = new Set(["meshLimit", "zoneLimit", "methodBan"]);

function isAllYearOnly(periods: PeriodSpec[]): boolean {
  return periods.every((p) => p.kind === "allYear");
}

/** 규칙 하나를 질의 기준으로 평가 */
export function evaluateRule(rule: Rule, query: JudgeQuery, fromGroup: boolean): JudgedRule {
  let effectivePeriods: PeriodSpec[] = rule.periods;
  let regionDependent = false;

  if (rule.regionVariants && rule.regionVariants.length > 0) {
    if (query.sido) {
      const matched = rule.regionVariants.find((v) => v.sidos.includes(query.sido!));
      if (matched) effectivePeriods = matched.periods;
    } else {
      // 시·도 미지정: 기본 ∪ 변형 기간 합집합으로 보수적으로 판정
      effectivePeriods = [
        ...rule.periods,
        ...rule.regionVariants.flatMap((v) => v.periods),
      ];
      regionDependent = true;
    }
  }

  const active = isDateInAnyPeriod(effectivePeriods, query.date);
  return {
    rule,
    active,
    effectivePeriods,
    regionDependent,
    zoneLimited: (rule.zoneIds?.length ?? 0) > 0,
    fromGroup,
  };
}

/** 규칙이 이 질의·어업에 적용되는가 (시·도 한정, 그룹 규칙의 어업 제외) */
function ruleApplies(rule: Rule, industryId: string, query: JudgeQuery): boolean {
  if (rule.excludeIndustries?.includes(industryId)) return false;
  if (rule.sidos && query.sido && !rule.sidos.includes(query.sido)) return false;
  return true;
}

export function judgeIndustry(
  industry: Industry,
  groupRules: Rule[],
  query: JudgeQuery,
): IndustryJudgement {
  const judged = [
    ...industry.rules
      .filter((r) => ruleApplies(r, industry.id, query))
      .map((r) => evaluateRule(r, query, false)),
    ...groupRules
      .filter((r) => ruleApplies(r, industry.id, query))
      .map((r) => evaluateRule(r, query, true)),
  ];

  const fullClosures: JudgedRule[] = [];
  const activeBans: JudgedRule[] = [];
  const standing: JudgedRule[] = [];
  const inactive: JudgedRule[] = [];

  for (const j of judged) {
    const isStanding =
      STANDING_KINDS.has(j.rule.kind) ||
      (isAllYearOnly(j.effectivePeriods) && !j.rule.timeOfDay);
    if (isStanding) {
      standing.push(j);
    } else if (!j.active) {
      inactive.push(j);
    } else if (j.rule.kind === "fullClosure") {
      fullClosures.push(j);
    } else {
      activeBans.push(j);
    }
  }
  return { fullClosures, activeBans, standing, inactive };
}

/** 홈 요약용: 오늘 조업 전면금지가 발동 중인 어업 목록 */
export function industriesClosedToday(
  industries: Industry[],
  groupRules: (group: Industry["group"]) => Rule[],
  query: JudgeQuery,
): { industry: Industry; closures: JudgedRule[] }[] {
  return industries
    .map((industry) => ({
      industry,
      closures: judgeIndustry(industry, groupRules(industry.group), query).fullClosures,
    }))
    .filter((x) => x.closures.length > 0);
}
