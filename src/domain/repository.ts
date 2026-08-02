import industriesRaw from "../../data/industries.json";
import zonesRaw from "../../data/zones.json";
import regionsRaw from "../../data/regions.json";
import sourcesRaw from "../../data/sources.json";
import metaRaw from "../../data/meta.json";
import {
  IndustriesFileSchema,
  MetaSchema,
  RegionsFileSchema,
  SourcesFileSchema,
  ZonesFileSchema,
  type Industry,
  type IndustryGroup,
  type Rule,
} from "./schema";

/** 앱 전역 데이터 저장소 — 모듈 로드 시 1회 파싱·검증 */
const industriesFile = IndustriesFileSchema.parse(industriesRaw);
export const industries = industriesFile.industries;
export const groupRulesMap = industriesFile.groupRules;
export const zones = ZonesFileSchema.parse(zonesRaw);
export const regions = RegionsFileSchema.parse(regionsRaw);
export const sources = SourcesFileSchema.parse(sourcesRaw);
export const meta = MetaSchema.parse(metaRaw);

const industryById = new Map(industries.map((i) => [i.id, i]));
const zoneById = new Map(zones.map((z) => [z.id, z]));
const sourceById = new Map(sources.map((s) => [s.id, s]));
const regionByCode = new Map(regions.map((r) => [r.code, r]));

export function getIndustry(id: string): Industry | undefined {
  return industryById.get(id);
}
export function getZone(id: string) {
  return zoneById.get(id);
}
export function getSource(id: string) {
  return sourceById.get(id);
}
export function getRegion(code: string) {
  return regionByCode.get(code);
}

/** 그룹 공통 규칙 (면허·신고어업은 없음) */
export function groupRulesFor(group: IndustryGroup): Rule[] {
  if (group === "offshore") return groupRulesMap.offshore;
  if (group === "coastal") return groupRulesMap.coastal;
  if (group === "demarcated") return groupRulesMap.demarcated;
  return [];
}

export const GROUP_ORDER: IndustryGroup[] = [
  "offshore",
  "coastal",
  "demarcated",
  "licensed",
  "reported",
];

/** 구분별 어업 목록 — 각 구분 안은 어업명 가나다순 */
export function industriesByGroup(): Map<IndustryGroup, Industry[]> {
  const map = new Map<IndustryGroup, Industry[]>();
  for (const g of GROUP_ORDER) map.set(g, []);
  for (const i of industries) map.get(i.group)!.push(i);
  for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  return map;
}
