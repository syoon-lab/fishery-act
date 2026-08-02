/**
 * 빌드 게이트: data/*.json을 Zod 스키마 + 참조 정합성 검증기로 검증.
 * errors > 0 이면 exit 1 → npm run build 실패 → 배포 차단.
 */
import { build } from "esbuild";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const tempDir = await mkdtemp(path.join(tmpdir(), "fishery-act-validate-"));
const outfile = path.join(tempDir, "validate.mjs");

try {
  await build({
    stdin: {
      contents: `
        export { IndustriesFileSchema, ZonesFileSchema, RegionsFileSchema, SourcesFileSchema, MetaSchema } from "${path.join(projectRoot, "src/domain/schema.ts")}";
        export { validateReferences } from "${path.join(projectRoot, "src/domain/validate.ts")}";
      `,
      resolveDir: projectRoot,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent",
  });

  const mod = await import(pathToFileURL(outfile).href);
  const readJson = async (name) =>
    JSON.parse(await readFile(path.join(projectRoot, "data", name), "utf8"));

  const errors = [];
  let industriesFile, zonesData, sourcesData;
  const tryParse = (label, schema, raw) => {
    const result = schema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${label}: ${issue.path.join(".")} — ${issue.message}`);
      }
      return undefined;
    }
    return result.data;
  };

  industriesFile = tryParse("industries.json", mod.IndustriesFileSchema, await readJson("industries.json"));
  zonesData = tryParse("zones.json", mod.ZonesFileSchema, await readJson("zones.json"));
  tryParse("regions.json", mod.RegionsFileSchema, await readJson("regions.json"));
  sourcesData = tryParse("sources.json", mod.SourcesFileSchema, await readJson("sources.json"));
  tryParse("meta.json", mod.MetaSchema, await readJson("meta.json"));

  if (industriesFile && zonesData && sourcesData) {
    errors.push(...mod.validateReferences(industriesFile, zonesData, sourcesData));
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(`❌ ${error}`);
    console.error(`\ndata validation FAILED: errors=${errors.length}`);
    process.exit(1);
  }
  const ruleCount =
    industriesFile.industries.reduce((a, i) => a + i.rules.length, 0) +
    Object.values(industriesFile.groupRules).reduce((a, r) => a + r.length, 0);
  console.log(
    `data validation passed: industries=${industriesFile.industries.length}, rules=${ruleCount}, zones=${zonesData.length}`,
  );
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
