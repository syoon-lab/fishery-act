# fishery-act — 수산업법 조업 규제 조회

> https://fishery-act.vercel.app

「수산업법」·「수산업법 시행령」의 어업(업종)별 포획·조업 규제를 정리·조회하는 웹앱.
어종 중심 서비스인 [fishery-regulation](https://fishery-regulation.vercel.app)(수산자원관리법 체계:
금어기·금지체장·금지 대상)과 축이 달라 별도로 분리했다 (2026-08-01 결정).
아키텍처는 fishery-regulation v2를 계승: 구조화 JSON + Zod + 순수 판정 엔진 + React/Vite/Tailwind.

## 개발

```bash
npm install
npm run dev          # http://localhost:3200
npm test             # Vitest (판정·데이터 게이트)
npm run lint         # tsc + 데이터 검증
npm run build        # lint + test 통과 시에만 빌드
```

배포는 `main` 푸시 시 Vercel이 자동 수행한다. 빌드 게이트(타입·데이터·테스트)가
Vercel 빌드에서 그대로 실행되므로, 게이트를 통과하지 못한 커밋은 배포되지 않는다.

## 앱 구조

```
data/            # ★ 단일 진실 원천: industries(어업 51종+규칙 92건)·zones(해역 26)·regions·sources·meta
src/domain/      # React 미의존 순수 계층: schema(Zod)·judge(판정)·display·date·repository·validate
src/pages/       # / (판정) /industries[/:id] /zones[/:id] /sources /about
src/components/  # Layout·FilterBar·RuleCard·YearTimeline
scripts/         # validate-data (빌드 게이트)
tests/           # 판정·데이터 게이트 (Vitest)
```

- 판정 축: **어업 + 날짜 + 시·도** ("내 어업으로 지금·여기서 뭘 조심해야 하나")
- "다만, 서해안은 7월" 패턴은 `regionVariants`, 야간 금지는 `timeOfDay`,
  조건부 예외는 `exceptions`(판정을 뒤집지 않고 병기)로 모델링 — `docs/app-design.md` 참조.

## 정리 대상

| 주제 | 근거 | 상태 |
|---|---|---|
| 어업 정의의 목적어종 한정 (기선권현망=멸치 등) | 시행령 제21조~제23조 | 정리됨 (`docs/prohibitions-summary.md` §1·4) |
| 혼획이 허용되는 어업·수산동물·허용 범위 | 법 제42조, 시행령 제24조·별표 3 | 정리됨 (§1 혼획) |
| 어업의 종류별 어구사용 금지구역·금지기간 | 시행령 제38조제2항·별표 7 (20쪽) | 정리됨 (§2~4, 해역 좌표는 원문 참조) |
| 근해어업의 조업구역·허가정수 | 시행령 제31조·별표 5 | 정리됨 (§3) |
| 어구의 규모·그물코 규격 제한 | 시행령 제38조·별표 2·8·9 | 그물코·사용방법 정리됨, 별표 2 세부 규격은 원문만 확보 |

## 참고자료 구조

```
references/text/           # 법령 원문 추출 텍스트 (추출일 표기)
references/text/annexes/   # 시행령 별표 1~12 추출 텍스트
references/수산업법*/       # 원본 hwpx·hwp (법률 2개 버전, 시행령, 별표)
docs/                      # 정리 문서·설계안
```

- `docs/prohibitions-summary.md`: **특정어종·특정시기·특정장소·특정어업별 포획·조업 금지 규정
  종합 정리** (법·시행령·별표 전체 기준, 2026-08-01 작성) — 데이터의 근거 문서.
- `docs/app-design.md`: 앱 설계안 (화면·데이터 모델·단계 계획).
- 데이터 수정 시 `docs/prohibitions-summary.md`와 원문 추출본 대조 → `npm run lint && npm test` 통과 확인.

- `docs/draft-page-FisheriesActPage.tsx`: fishery-regulation에 잠시 만들었다 분리한
  목적어종 한정 안내 페이지 초안 (React, 표 데이터 포함) — 재사용 가능.

## 참고

- 원문: [수산업법 시행령 (law.go.kr)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%88%98%EC%82%B0%EC%97%85%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9) — 현행 시행 2026. 7. 1. (대통령령 제36423호)
- law.go.kr 별표는 이미지 변환 뷰어라 텍스트 추출이 어려움 — 뷰어 DOM에 글자 단위 텍스트가 있어
  브라우저에서 페이지별로 긁는 방식이 유효했음 (별표 7에서 확인).
- 산출 형태(문서·웹 서비스 여부)는 미정.
