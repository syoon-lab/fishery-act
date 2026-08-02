import { describe, expect, it } from "vitest";
import { groupRulesMap, industries, sources, zones } from "../src/domain/repository";
import { validateReferences } from "../src/domain/validate";

describe("데이터 게이트", () => {
  it("참조 정합성 위반 없음", () => {
    expect(validateReferences({ industries, groupRules: groupRulesMap }, zones, sources)).toEqual([]);
  });

  it("어업 수: 근해 21종", () => {
    expect(industries.filter((i) => i.group === "offshore")).toHaveLength(21);
  });

  it("구획어업 12종", () => {
    expect(industries.filter((i) => i.group === "demarcated")).toHaveLength(12);
  });

  it("혼획 허용은 별표 3의 4개 어업뿐", () => {
    const allowed = industries.filter((i) => i.bycatch?.allowed).map((i) => i.id).sort();
    expect(allowed).toEqual(["geunhae-hyeongmang", "paeryu-hyeongmang", "saewoo-jomang", "yeonan-jomang"]);
  });

  it("목적어종 한정 멸치 어업: 기선권현망·연안선인망(+멸치 제외 2종)", () => {
    const myeolchi = industries.filter((i) => i.targetLimit?.species === "멸치").map((i) => i.id).sort();
    expect(myeolchi).toEqual(["giseon-gwonhyeonmang", "yeonan-seoninmang"]);
  });
});
