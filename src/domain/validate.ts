import type { IndustriesFile, Rule, Source, Zone } from "./schema";

/**
 * 참조 정합성·의미 검증. Zod 파싱 이후에 실행한다.
 * 위반 메시지 배열을 반환 — 비어 있으면 통과.
 */
export function validateReferences(
  file: IndustriesFile,
  zones: Zone[],
  sources: Source[],
): string[] {
  const errors: string[] = [];
  const zoneIds = new Set(zones.map((z) => z.id));
  const sourceIds = new Set(sources.map((s) => s.id));
  const seenRuleIds = new Set<string>();
  const seenIndustryIds = new Set<string>();

  const allRules: { owner: string; rule: Rule }[] = [];
  for (const industry of file.industries) {
    if (seenIndustryIds.has(industry.id)) errors.push(`중복 어업 id: ${industry.id}`);
    seenIndustryIds.add(industry.id);
    for (const rule of industry.rules) allRules.push({ owner: industry.id, rule });
  }
  for (const [group, rules] of Object.entries(file.groupRules)) {
    for (const rule of rules) allRules.push({ owner: `group:${group}`, rule });
  }

  for (const { owner, rule } of allRules) {
    if (seenRuleIds.has(rule.id)) errors.push(`중복 규칙 id: ${rule.id}`);
    seenRuleIds.add(rule.id);
    if (!sourceIds.has(rule.sourceId)) {
      errors.push(`${owner}/${rule.id}: 존재하지 않는 sourceId "${rule.sourceId}"`);
    }
    for (const zid of rule.zoneIds ?? []) {
      if (!zoneIds.has(zid)) errors.push(`${owner}/${rule.id}: 존재하지 않는 zoneId "${zid}"`);
    }
    if (
      rule.kind === "meshLimit" &&
      rule.meshMinMm === undefined &&
      !rule.label.includes("mm") &&
      !rule.label.includes("밀리미터")
    ) {
      errors.push(`${owner}/${rule.id}: meshLimit인데 meshMinMm도 label 규격 표기도 없음`);
    }
    if (rule.kind === "speciesCaptureBan" && !rule.species) {
      errors.push(`${owner}/${rule.id}: speciesCaptureBan인데 species 없음`);
    }
  }
  return errors;
}
