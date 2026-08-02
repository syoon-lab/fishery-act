import { z } from "zod";

/**
 * fishery-act 데이터 스키마의 단일 원천.
 * fishery-regulation v2의 원칙을 계승한다:
 * 규정의 의미(기간·해역·어구·어종)는 구조화 필드에, 법령 원문 표현은 rawText에 보존.
 *
 * 1급 개념은 어종이 아니라 **어업(업종)** 이며, 규칙은 어업에 속한다.
 * 어업 그룹 공통 규칙(별표 7의 "모든 근해어업" 등)은 groupRules로 별도 보관한다.
 */

// ── 기간 ─────────────────────────────────────────────────────────────────────

export const MonthDaySchema = z.object({
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
});
export type MonthDay = z.infer<typeof MonthDaySchema>;

/** 매년 반복 기간. start > end(월일 비교)면 연도 경계를 넘는 기간 */
const AnnualPeriodSchema = z.object({
  kind: z.literal("annual"),
  start: MonthDaySchema,
  end: MonthDaySchema,
});

const AllYearPeriodSchema = z.object({ kind: z.literal("allYear") });

export const PeriodSpecSchema = z.discriminatedUnion("kind", [
  AnnualPeriodSchema,
  AllYearPeriodSchema,
]);
export type PeriodSpec = z.infer<typeof PeriodSpecSchema>;

/** 야간 금지 등 시간대 (기선권현망 21:30~04:30) */
export const TimeOfDaySchema = z.object({
  from: z.string().regex(/^\d{2}:\d{2}$/),
  to: z.string().regex(/^\d{2}:\d{2}$/),
});
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

// ── 지역 변형 ("다만, 인천·경기…는 7월" 패턴) ───────────────────────────────

export const RegionVariantSchema = z.object({
  /** 적용 시·도 코드 목록 ("sido:incheon" 등). regions.json 참조 */
  sidos: z.array(z.string().min(1)).min(1),
  /** 해당 지역에서 기본 기간을 대체하는 기간(들) */
  periods: z.array(PeriodSpecSchema).min(1),
  note: z.string().optional(),
});
export type RegionVariant = z.infer<typeof RegionVariantSchema>;

// ── 규칙 ─────────────────────────────────────────────────────────────────────

/**
 * - fullClosure: 조업 자체 금지 (기간·해역 한정 포함)
 * - gearUseBan: 특정 어구·용법 사용금지 (세목망, 형망, 게 목적 통발, 야간 어구 등)
 * - speciesCaptureBan: 특정 어종 포획금지 (멸치·삼치·살오징어·대게)
 * - lightBan: 불빛이용금지
 * - gearFormBan: 어구 형태 금지 (뻗침대 자망, 2중 자망 내망 등)
 * - meshLimit: 그물코 규격 — 명시 규격 "이하" 사용금지 (별표 8)
 * - methodBan: 사용방법 금지 (저층 예망 금지 등, 별표 2)
 * - zoneLimit: 조업구역 제한 (별표 5) — 상시 표시용
 */
export const RuleKindSchema = z.enum([
  "fullClosure",
  "gearUseBan",
  "speciesCaptureBan",
  "lightBan",
  "gearFormBan",
  "meshLimit",
  "methodBan",
  "zoneLimit",
]);
export type RuleKind = z.infer<typeof RuleKindSchema>;

export const RuleSchema = z.object({
  id: z.string().min(1),
  kind: RuleKindSchema,
  /** 표시 제목: "세목망으로 된 어망 사용금지" */
  label: z.string().min(1),
  /** 대상 어종 (speciesCaptureBan, meshLimit 어종행 등) */
  species: z.string().optional(),
  /** 대상 어구·용법 ("세목망", "형망", "뻗침대를 붙인 자망", "통발(게 포획 목적)") */
  gear: z.string().optional(),
  /** meshLimit: 이 규격(mm) 이하 그물코 사용금지 */
  meshMinMm: z.number().positive().optional(),
  /** 기본 적용 기간(들). 비우면 "기간 규정 없음(상시 아님)"이 아니라 반드시 명시할 것 */
  periods: z.array(PeriodSpecSchema).min(1),
  timeOfDay: TimeOfDaySchema.optional(),
  /** 지역별 대체 기간 — 매치되는 시·도에서는 periods 대신 이것을 적용 */
  regionVariants: z.array(RegionVariantSchema).optional(),
  /** 적용 해역 (zones.json 참조). 없으면 조업구역 전체 */
  zoneIds: z.array(z.string().min(1)).optional(),
  /**
   * 규칙 자체가 특정 시·도(허가 관청·해역)에만 존재하는 경우 ("충청남도 연안선망으로 한정" 등).
   * 설정 시 다른 시·도 질의에서는 이 규칙을 아예 적용하지 않는다.
   */
  sidos: z.array(z.string().min(1)).optional(),
  /** 그룹 공통 규칙에서 제외되는 어업 (별표 8: 패류형망 제외 등) */
  excludeIndustries: z.array(z.string().min(1)).optional(),
  /** 조건부 예외 원문 — 판정을 뒤집지 않고 병기 표시 */
  exceptions: z.array(z.string().min(1)).optional(),
  /** 위반 시 제재 요약 (없으면 kind 기본값으로 표시) */
  penalty: z.string().optional(),
  /** 어업정지 처분을 과징금으로 갈음할 수 없는 위반 (시행령 제69조제2항) */
  noSubstituteFine: z.boolean().optional(),
  sourceId: z.string().min(1),
  rawText: z.string().min(1),
  note: z.string().optional(),
});
export type Rule = z.infer<typeof RuleSchema>;

// ── 어업 ─────────────────────────────────────────────────────────────────────

export const IndustryGroupSchema = z.enum([
  "offshore", // 근해어업 (시행령 제21조)
  "coastal", // 연안어업 (제22조)
  "demarcated", // 구획어업 (제23조)
  "licensed", // 면허어업 (법 제7조)
  "reported", // 신고어업 (시행령 제26조)
]);
export type IndustryGroup = z.infer<typeof IndustryGroupSchema>;

/** 목적어종 한정 (시행령 제21~23조 어업 정의) */
export const TargetLimitSchema = z.object({
  species: z.string().min(1), // "멸치", "새우류", "패류 등 정착성수산동물"
  excludeNote: z.string().optional(), // "젓새우는 제외"
  regionNote: z.string().optional(), // "강원특별자치도만 해당"
  rawText: z.string().min(1),
});
export type TargetLimit = z.infer<typeof TargetLimitSchema>;

/** 혼획 (법 제42조·별표 3). 목적어종 한정 어업 중 별표 3 미등재는 혼획 전면 금지 */
export const BycatchSchema = z.object({
  allowed: z.boolean(),
  allowedPercent: z.number().positive().optional(),
  rawText: z.string().min(1),
});
export type Bycatch = z.infer<typeof BycatchSchema>;

/** 별표 5 허가정수 */
export const PermitQuotaSchema = z.object({
  count: z.number().int().positive(),
  zoneNote: z.string().min(1),
});
export type PermitQuota = z.infer<typeof PermitQuotaSchema>;

export const IndustrySchema = z.object({
  /** slug — fishery-regulation industries.json 코드와 어휘 통일 */
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  group: IndustryGroupSchema,
  aliases: z.array(z.string()).optional(),
  definition: z.object({
    rawText: z.string().min(1),
    articleRef: z.string().min(1), // "시행령 제21조제1항제20호"
  }),
  targetLimit: TargetLimitSchema.optional(),
  bycatch: BycatchSchema.optional(),
  operationZoneNote: z.string().optional(), // 별표 5 조업구역 요약
  permitQuota: z.array(PermitQuotaSchema).optional(),
  rules: z.array(RuleSchema),
  note: z.string().optional(),
});
export type Industry = z.infer<typeof IndustrySchema>;

/** 그룹 공통 규칙 (별표 7 "모든 근해어업" 등) */
export const GroupRulesSchema = z.object({
  offshore: z.array(RuleSchema),
  coastal: z.array(RuleSchema),
  demarcated: z.array(RuleSchema),
});
export type GroupRules = z.infer<typeof GroupRulesSchema>;

// ── 해역·지역 ────────────────────────────────────────────────────────────────

/** 별표 7 좌표를 차례대로 연결한 선 — [위도, 경도] 목록. 원문에서 기계 추출 */
export const ZonePolygonSchema = z.object({
  label: z.string().optional(),
  points: z.array(z.tuple([z.number(), z.number()])).min(2),
  note: z.string().optional(),
});
export type ZonePolygon = z.infer<typeof ZonePolygonSchema>;

export const ZoneSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** 일반인용 표시 명칭: "진해만 일대" (주 번호는 ref에) */
  name: z.string().min(1),
  /** 법령상 참조 번호: "별표 7 주6)" — 상세 화면에서만 표시 */
  ref: z.string().optional(),
  shortDesc: z.string().min(1),
  /** 좌표 원문 등 상세 */
  rawText: z.string().optional(),
  mapRef: z.string().optional(), // "별표 7 부도 1 제1호"
  /** 좌표 정의 해역의 경계선들 (없으면 연안 거리·행정구역 기준 해역) */
  polygons: z.array(ZonePolygonSchema).optional(),
});
export type Zone = z.infer<typeof ZoneSchema>;

export const RegionSchema = z.object({
  code: z.string().regex(/^sido:[a-z0-9-]+$/),
  name: z.string().min(1),
  shortName: z.string().min(1),
});
export type Region = z.infer<typeof RegionSchema>;

// ── 출처·메타 ────────────────────────────────────────────────────────────────

export const SourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  kind: z.enum(["law", "decree", "annex"]),
  effectiveOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  url: z.string().url().optional(),
  note: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const MetaSchema = z.object({
  schemaVersion: z.number().int(),
  dataAsOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.array(z.string()).optional(),
});
export type Meta = z.infer<typeof MetaSchema>;

// ── 파일 단위 스키마 ─────────────────────────────────────────────────────────

export const IndustriesFileSchema = z.object({
  industries: z.array(IndustrySchema),
  groupRules: GroupRulesSchema,
});
export type IndustriesFile = z.infer<typeof IndustriesFileSchema>;

export const ZonesFileSchema = z.array(ZoneSchema);
export const RegionsFileSchema = z.array(RegionSchema);
export const SourcesFileSchema = z.array(SourceSchema);
