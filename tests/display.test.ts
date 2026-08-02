import { describe, expect, it } from "vitest";
import { formatPeriod, penaltyFor } from "../src/domain/display";
import { getIndustry } from "../src/domain/repository";

function rule(industryId: string, ruleId: string) {
  const r = getIndustry(industryId)?.rules.find((x) => x.id === ruleId);
  if (!r) throw new Error(`rule not found: ${ruleId}`);
  return r;
}

describe("법령 문언 표시", () => {
  it("종료일 {2,29}는 '2월 말일'로 표시 (별표 7 문언)", () => {
    expect(
      formatPeriod({ kind: "annual", start: { month: 12, day: 1 }, end: { month: 2, day: 29 } }),
    ).toBe("12. 1.~다음 해 2월 말일");
  });
});

describe("제재 표시 — 시행령 제69조제2항 목록과 일치", () => {
  it("별표 7 위반(세목망 사용금지)은 과징금 갈음 불가", () => {
    expect(penaltyFor(rule("geunhae-anggangmang", "geunhae-anggangmang/semokmang"))).toContain(
      "과징금으로 갈음할 수 없음",
    );
  });

  it("별표 8 위반(그물코 규격)은 과징금 갈음 불가 아님", () => {
    expect(penaltyFor(rule("geunhae-anggangmang", "geunhae-anggangmang/mesh"))).not.toContain(
      "과징금으로 갈음할 수 없음",
    );
  });

  it("별표 2 위반(사용방법)은 과징금 갈음 불가 아님", () => {
    expect(penaltyFor(rule("giseon-gwonhyeonmang", "giseon-gwonhyeonmang/method"))).not.toContain(
      "과징금으로 갈음할 수 없음",
    );
  });

  it("조업구역 위반은 법 제107조 + 과징금 갈음 불가", () => {
    const p = penaltyFor(rule("donghaegu-teurol", "donghaegu-teurol/zone"));
    expect(p).toContain("제107조");
    expect(p).toContain("과징금으로 갈음할 수 없음");
  });
});
