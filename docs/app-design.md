# fishery-act 앱 설계안 — 수산업법 포획·조업 규제 조회 서비스

작성 2026-08-01. `docs/prohibitions-summary.md`의 정리 내용을 웹앱으로 만드는 구성안.
fishery-regulation v2 아키텍처(구조화 JSON + Zod + 순수 판정 엔진 + React/Vite/Tailwind)를 그대로 계승한다.

## 1. 핵심 판단: 축이 다르다 → 어업(업종) 중심 앱

| | fishery-regulation | fishery-act (이 앱) |
|---|---|---|
| 1급 개념 | **어종** (53종) | **어업** (근해 21 + 연안 8 + 구획 12 + 면허·신고) |
| 사용자 질문 | "이 물고기 지금 잡아도 되나?" | "**내 어업으로** 지금·여기서 조업해도 되나? 뭘 잡을 수 있나?" |
| 규정 형태 | 금어기·금지체장 (어종별) | 목적어종 한정·혼획·조업구역·금지기간·어구 제한 (어업별) |
| 판정 입력 | 어종 + 날짜 + 지역 + 업종 | 어업 + 날짜 + 지역 (+ 대상 어종) |

어종 축 서비스에 억지로 끼우지 않고 별도 앱으로 가되(2026-08-01 분리 결정 유지),
멸치·삼치처럼 겹치는 어종은 두 앱을 상호 링크한다.

## 2. 화면 구성 (라우트)

```
/                      홈 = 판정: 업종 선택 + 날짜 + 시·도 → 지금 발동 중인 금지 목록
/industries            어업 목록 (근해/연안/구획 그룹, 검색)
/industries/:id        ★ 어업 상세 — 앱의 중심 화면
/species/:id           규제 어종 뷰 (멸치·삼치·살오징어·대게·게류·새우류 …)
/calendar              연간 달력 — 이번 달 시작/종료되는 금지
/zones/:id             금지해역 상세 (주1~주17, 제주 7,400m 등)
/sources               근거 법령·별표 목록 (원문 추출본 링크)
/about                 면책·데이터 기준일
```

### 홈 (판정 화면)
fishery-regulation 홈의 "오늘 금어기" 패턴을 업종 축으로 뒤집는다.

```
[내 어업: 연안자망 ▾] [날짜: 오늘] [지역: 전남 ▾]
──────────────────────────────────────────
지금 적용되는 금지  3건
 ● 조업 전면금지 아님
 ● 세목망 어망 사용금지 (5.16~6.15 · 뻗침대+세목망은 8월)     [별표7]
 ● 멸치 포획금지 — 주8) 해역 (4.1~6.30)                      [별표7]
 ● 뻗침대 자망: 전남 해역은 허용 (그 외 전국 금지)             [별표7]
연중 상시 제한
 ● 그물코: 삼치 100mm·조기류 50mm·대게 240mm 이하 사용금지    [별표8]
```

- 업종 미선택 시: "오늘 조업금지 기간 중인 어업" 요약 리스트 (연안조망 10~4월 등)
- URL 동기화 필터(`?industry=&date=&region=`) — v2의 useFilters 패턴 재사용

### 어업 상세 `/industries/:id` — 중심 화면
정리 문서 §4의 어업별 일람을 카드 6개로 분해:

1. **정의·목적어종** — 시행령 제21~23조 원문 + 목적어종 한정 배지 ("멸치만", "새우류(젓새우 제외)")
2. **혼획** — 허용 대상·범위(별표 3), 혼획저감장치·지정 매매장소 의무. 허용 4개 어업 외는 "혼획 금지" 배지
3. **연간 타임라인** — YearTimeline 컴포넌트 재사용. 레인을 나눠서:
   조업금지 / 어구사용금지(형망·세목망·통발 등) / 어종 포획금지(멸치·삼치…) / 야간(기선권현망 21:30~04:30)
4. **조업구역·금지해역** — 별표 5 조업구역 + 별표 7 해역(주N 코드 → /zones/:id 링크), 허가정수
5. **어구 제한** — 그물코(별표 8), 뻗침대·세목망, 사용방법(별표 2: 저층 예망 금지 등)
6. **위반 시** — 벌칙 조항 + "과징금 갈음 불가" 여부(시행령 제69조②)

### 규제 어종 뷰 `/species/:id`
어종별 "누가·언제·어디서 못 잡나" 매트릭스. 예: 멸치 →

| 어업 | 가능 여부 |
|---|---|
| 기선권현망 | ○ 목적어종 (단 4~6월 주7 해역 금지, 야간 금지) |
| 연안선인망(강원) | ○ 목적어종 (10~12월만 조업) |
| 대형·소형선망 | ✕ 포획금지 (연중 주4·5·6 / 봄 주7) |
| 그 외 모든 어업 | ✕ 3~6월 주6 해역 멸치 목적 어망 금지 … |

fishery-regulation의 멸치 어종 페이지에서 이 화면으로 딥링크(역방향도).

### 금지해역 `/zones/:id`
- Phase 1: 이름·설명·적용 규정 목록·좌표 원문 텍스트
- Phase 2: 좌표 → GeoJSON 변환해 지도 표시 (별표 7 주1~주17은 전부 좌표열이라 기계 변환 가능,
  부도는 이미지라 참고용). 라이브러리는 maplibre-gl 또는 leaflet 경량 사용

## 3. 데이터 모델 (`data/*.json` + Zod)

fishery-regulation의 species.json 패턴을 industry 중심으로 재구성. 규칙은 어업에 속한다.

```
data/
  industries.json   # ★ 어업 41종 + 면허·신고어업. 정의 rawText, group, targetLimit, rules[]
  zones.json        # 주1~주17, 제주 7400m, 조업구역 등 해역 정의 (+coordinates, Phase2 geojson)
  species-index.json# 규제 어종 → 관련 어업·규칙 역인덱스 (빌드 시 생성 가능)
  penalties.json    # 벌칙 조항 매핑 (제106~109조, 과징금 갈음 불가 목록)
  sources.json      # 법·시행령·별표별 출처 (fishery-regulation과 동일 스키마)
  meta.json         # dataAsOf, schemaVersion
```

핵심 스키마 초안:

```ts
Industry = {
  id: "yeonan-jamang",           // slug (fishery-regulation industries.json 코드와 통일!)
  name: "연안자망어업",
  group: "coastal",              // offshore | coastal | demarcated | licensed | reported
  definition: { rawText, articleRef },      // 시행령 제21~23조
  targetLimit?: { species: "멸치", exclude?: "젓새우", regionOnly?, rawText },
  bycatch?: { allowedPercent: 30, rawText } // 별표 3. 없으면 혼획 전면 금지(목적어종 한정 시)
  permitQuota?: [{ count, zoneId }],        // 별표 5
  operationZoneIds?: [...],
  rules: Rule[],
}

Rule = {
  id, kind,        // fullClosure | gearUseBan | speciesCaptureBan | lightBan
                   // | meshLimit | gearFormBan | methodBan | zoneLimit
  period?: { kind: "annual"|"allYear", start?, end?,
             timeOfDay?: { from: "21:30", to: "04:30" } },      // 기선권현망 야간
  regionVariants?: [{ regions: ["서해안5"], period }],           // "다만, 인천·경기…는 7월" 패턴
  zoneIds?: ["ju6"],             // zones.json 참조. 없으면 전 구역
  species?: "멸치",              // speciesCaptureBan·meshLimit의 대상 어종
  gear?: { name: "세목망"|"형망"|"뻗침대 자망"|…, meshMinMm? },
  exceptions?: [{ rawText }],    // 관리선 예외, 무등화 전갱이·고등어 예외 등
  penaltyRef?, sourceId, rawText, note?
}

Zone = { id: "ju6", name: "진해만 일대(주6)", description,
         coordinates?: [[lat,lng],…], mapImageRef?, rawText }
```

fishery-regulation 스키마와의 차이(=이 도메인 고유 난점)를 필드로 흡수:
- **regionVariants**: 같은 규칙이 지역에 따라 기간이 다른 "다만" 패턴 (서해안 세목망 7월 등)
- **timeOfDay**: 야간 금지
- **exceptions**: "불빛 없이 전갱이 목적이면 허용" 같은 조건부 예외 — 판정을 뒤집지 않고 병기 표시
  (v2의 exemption/suspensions 정책 계승)
- **zones**: 좌표 정의 해역이 1급 개념 (fishery-regulation의 namedArea보다 무거움)

## 4. 판정 엔진 (`src/domain/judge.ts`)

순수 함수, v2 정책 계승:

```ts
judgeIndustry({ industryId, date, sido? })
  → { fullClosures: Rule[],      // 조업 자체 불가?
      activeBans: Rule[],        // 오늘 발동 중인 어구·어종 금지
      standingLimits: Rule[],    // 연중 상시 (그물코 등)
      zoneWarnings: [...] }      // 해역 한정이라 "지역 확인 필요" 표시

judgeSpecies({ speciesName, date, sido? })
  → 어업별 가능/금지 매트릭스   // /species/:id 화면용
```

해역 좌표 판정(내 위치가 주6 안인가)은 하지 않는다 — 시·도 단위 + "해역 확인 필요" 안내가 현실적.
Phase 2에서 지도에 겹쳐 보여주는 것까지가 목표(포인트-인-폴리곤 판정은 참고용으로만).

## 5. 재사용 / 새로 만들 것

| 재사용 (fishery-regulation에서) | 새로 만들기 |
|---|---|
| Vite+React+Tailwind+Zod 구성, 빌드 게이트(lint+validate+test) | industries/zones 스키마·데이터 (별표 5·7·8 구조화가 최대 작업) |
| YearTimeline, RuleBadge, FilterBar, Layout 등 컴포넌트 패턴 | 어업 상세 카드, 어종 매트릭스, 존 뷰어 |
| useFilters(URL 동기화), repository/display/date 유틸 | judge 어업 축 재작성 |
| sources.json 스키마, CHANGELOG·diff-data 워크플로 | zones 좌표 → GeoJSON 스크립트 (Phase 2) |
| industries.json의 업종 slug 코드 (두 앱 공통 어휘로) | penalties 매핑 |
| docs/draft-page-FisheriesActPage.tsx → About/근거 페이지에 흡수 | |

## 6. 단계별 계획

- **Phase 1 (MVP)**: 데이터화(별표 5·7·8 + 정리 문서 → JSON) → 어업 목록/상세 + 홈 판정 + 출처.
  존은 텍스트 설명만. 검증 스크립트로 "정리 문서 표 ↔ JSON" 대조.
- **Phase 2**: 어종 매트릭스(/species), 달력, 존 좌표 GeoJSON + 지도.
- **Phase 3**: fishery-regulation과 상호 링크 (멸치 등 겹치는 어종), 업종 코드 어휘 통일 정리.

## 7. 검토한 대안: fishery-regulation에 통합

- 장점: 인프라·배포 1벌, 사용자 입장에서 한 곳.
- 단점: 1급 개념이 달라 스키마가 이중화되고(species.rules vs industry.rules),
  기존 판정 엔진·테스트 45건에 회귀 위험. README에 기록된 분리 결정(2026-08-01)과 상충.
- 결론: **별도 앱 + 상호 링크** 권장. 단, 업종 코드(slug)와 sources 스키마는 공유 어휘로 맞춰
  나중에 통합할 여지를 남긴다.
