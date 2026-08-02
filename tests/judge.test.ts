import { describe, expect, it } from "vitest";
import { judgeIndustry } from "../src/domain/judge";
import { getIndustry, groupRulesFor } from "../src/domain/repository";

function judge(industryId: string, iso: string, sido?: string) {
  const industry = getIndustry(industryId);
  if (!industry) throw new Error(`unknown industry: ${industryId}`);
  const [year, month, day] = iso.split("-").map(Number);
  return judgeIndustry(industry, groupRulesFor(industry.group), {
    date: { year, month, day },
    sido,
  });
}

describe("조업 전면금지 판정", () => {
  it("연안조망: 10. 1.~4. 30. 조업금지 (연도 경계)", () => {
    expect(judge("yeonan-jomang", "2026-11-15").fullClosures).toHaveLength(1);
    expect(judge("yeonan-jomang", "2026-03-01").fullClosures).toHaveLength(1);
    expect(judge("yeonan-jomang", "2026-07-15").fullClosures).toHaveLength(0);
  });

  it("연안선인망: 1. 1.~9. 30. 조업금지 → 10~12월만 조업", () => {
    expect(judge("yeonan-seoninmang", "2026-05-01").fullClosures).toHaveLength(1);
    expect(judge("yeonan-seoninmang", "2026-10-15").fullClosures).toHaveLength(0);
  });

  it("동해구외끌이: 5월 연안 조업금지 발동, 주1) 연중 금지는 상시(해역 한정)로 분류", () => {
    const may = judge("donghaegu-oekkeuri", "2026-05-15");
    expect(may.fullClosures).toHaveLength(1);
    const ju1 = may.standing.find((x) => x.rule.id === "donghaegu-oekkeuri/closure-ju1");
    expect(ju1?.zoneLimited).toBe(true);
    const june = judge("donghaegu-oekkeuri", "2026-06-15");
    expect(june.fullClosures).toHaveLength(0);
  });
});

describe("지역 변형(다만 조항) 판정", () => {
  it("연안개량안강망: 기본 5. 16.~6. 15., 서해안은 7월", () => {
    // 6월 초: 기본 지역에서는 금지, 인천에서는 아님
    expect(judge("yeonan-gaeryang-anggangmang", "2026-06-01", "sido:gyeongnam").fullClosures).toHaveLength(1);
    expect(judge("yeonan-gaeryang-anggangmang", "2026-06-01", "sido:incheon").fullClosures).toHaveLength(0);
    // 7월 중순: 반대
    expect(judge("yeonan-gaeryang-anggangmang", "2026-07-15", "sido:incheon").fullClosures).toHaveLength(1);
    expect(judge("yeonan-gaeryang-anggangmang", "2026-07-15", "sido:gyeongnam").fullClosures).toHaveLength(0);
  });

  it("시·도 미지정이면 합집합 판정 + regionDependent 표시", () => {
    const j = judge("yeonan-gaeryang-anggangmang", "2026-07-15");
    expect(j.fullClosures).toHaveLength(1);
    expect(j.fullClosures[0].regionDependent).toBe(true);
  });

  it("근해안강망 세목망: 서해안은 2월+7월 두 기간", () => {
    expect(judge("geunhae-anggangmang", "2026-02-10", "sido:chungnam").activeBans).toHaveLength(1);
    expect(judge("geunhae-anggangmang", "2026-02-10", "sido:gyeongnam").activeBans).toHaveLength(0);
  });
});

describe("어종·어구 금지 판정", () => {
  it("대형선망: 겨울 삼치 금지 발동, 여름은 미발동", () => {
    const winter = judge("daehyeong-seonmang", "2026-01-15");
    expect(winter.activeBans.some((j) => j.rule.species === "삼치")).toBe(true);
    const summer = judge("daehyeong-seonmang", "2026-08-15");
    expect(summer.activeBans.some((j) => j.rule.species === "삼치")).toBe(false);
  });

  it("근해자망: 살오징어 연중 금지는 상시로 분류", () => {
    const j = judge("geunhae-jamang", "2026-08-15");
    expect(j.standing.some((x) => x.rule.species === "살오징어")).toBe(true);
  });

  it("모든 근해어업 공통: 3~6월 진해만 멸치 어망 금지 (그룹 규칙)", () => {
    const j = judge("geunhae-yeonseung", "2026-04-15");
    expect(j.activeBans.some((x) => x.fromGroup && x.rule.species === "멸치")).toBe(true);
    const nov = judge("geunhae-yeonseung", "2026-11-15");
    expect(nov.activeBans.some((x) => x.rule.species === "멸치")).toBe(false);
  });

  it("기선권현망: 야간 어구 사용금지는 timeOfDay 있는 연중 규칙으로 발동", () => {
    const j = judge("giseon-gwonhyeonmang", "2026-08-15");
    expect(j.activeBans.some((x) => x.rule.timeOfDay !== undefined)).toBe(true);
  });
});

describe("정밀 대조 수정 사항", () => {
  it("충남 한정 규칙(태안 멸치어망)은 다른 시·도 질의에서 미적용", () => {
    const all = (r: ReturnType<typeof judge>) =>
      [...r.fullClosures, ...r.activeBans, ...r.standing, ...r.inactive];
    expect(
      all(judge("yeonan-seonmang", "2026-08-02", "sido:chungnam")).some(
        (x) => x.rule.id === "yeonan-seonmang/taean-myeolchi",
      ),
    ).toBe(true);
    expect(
      all(judge("yeonan-seonmang", "2026-08-02", "sido:jeonnam")).some(
        (x) => x.rule.id === "yeonan-seonmang/taean-myeolchi",
      ),
    ).toBe(false);
  });

  it("뻗침대+세목망(기간 한정 gearFormBan)은 상시가 아니라 기간으로 분류", () => {
    // 10월 인천: 기간(1. 1.~8. 31.) 밖 → inactive
    const oct = judge("geunhae-jamang", "2026-10-15", "sido:incheon");
    expect(oct.inactive.some((x) => x.rule.id === "geunhae-jamang/ppeotchim-semokmang")).toBe(true);
    expect(oct.standing.some((x) => x.rule.id === "geunhae-jamang/ppeotchim-semokmang")).toBe(false);
    // 경남에서는 규칙 자체가 미적용 (뻗침대 자망 전면금지 해역)
    const gyeongnam = judge("geunhae-jamang", "2026-05-15", "sido:gyeongnam");
    const allG = [...gyeongnam.fullClosures, ...gyeongnam.activeBans, ...gyeongnam.standing, ...gyeongnam.inactive];
    expect(allG.some((x) => x.rule.id === "geunhae-jamang/ppeotchim-semokmang")).toBe(false);
  });

  it("구획 15밀리미터 그물코 공통 규칙은 패류형망에 미적용 (별표 8)", () => {
    const j = judge("paeryu-hyeongmang", "2026-08-02");
    const all = [...j.fullClosures, ...j.activeBans, ...j.standing, ...j.inactive];
    expect(all.some((x) => x.rule.id === "common-demarcated/mesh-15")).toBe(false);
    const jang = judge("guhoek-jiinmang", "2026-08-02");
    const allJ = [...jang.fullClosures, ...jang.activeBans, ...jang.standing, ...jang.inactive];
    expect(allJ.some((x) => x.rule.id === "common-demarcated/mesh-15")).toBe(true);
  });
});
