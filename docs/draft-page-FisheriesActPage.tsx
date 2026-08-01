const LAW_URL =
  "https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%88%98%EC%82%B0%EC%97%85%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9";

/** 수산업법 시행령 제21조~제23조 어업 정의 중 목적어종이 한정된 항목 */
const TARGET_LIMITS: { industry: string; group: string; target: string; note?: string }[] = [
  { industry: "기선권현망어업", group: "근해어업", target: "멸치" },
  {
    industry: "연안선인망어업",
    group: "연안어업",
    target: "멸치",
    note: "강원특별자치도만 해당",
  },
  {
    industry: "쌍끌이대형저인망어업",
    group: "근해어업",
    target: "수산동물 (멸치는 제외)",
  },
  {
    industry: "서남해구쌍끌이중형저인망어업",
    group: "근해어업",
    target: "수산동물 (멸치는 제외)",
  },
  { industry: "근해자리돔들망어업", group: "근해어업", target: "자리돔" },
  { industry: "근해장어통발어업", group: "근해어업", target: "장어류" },
  { industry: "근해문어단지어업", group: "근해어업", target: "문어류" },
  {
    industry: "문어단지어업 (연안복합)",
    group: "연안어업",
    target: "문어류",
    note: "강원특별자치도는 제외",
  },
  { industry: "손꽁치어업 (연안복합)", group: "연안어업", target: "꽁치 (손으로 포획)" },
  {
    industry: "패류껍질어업 (연안복합)",
    group: "연안어업",
    target: "수산동물 (패류 껍질 모양 어구 사용)",
  },
  {
    industry: "패류미끼망어업 (연안복합)",
    group: "연안어업",
    target: "패류",
    note: "인천·경기·충남·전북 및 전남광주통합특별시 일부 해안만 해당",
  },
  {
    industry: "연안조망어업",
    group: "연안어업",
    target: "새우류 (젓새우는 제외)",
  },
  { industry: "새우조망어업", group: "구획어업", target: "새우류" },
  { industry: "실뱀장어안강망어업", group: "구획어업", target: "실뱀장어" },
  { industry: "근해형망어업", group: "근해어업", target: "패류" },
  { industry: "패류형망어업", group: "구획어업", target: "패류" },
  { industry: "잠수기어업", group: "근해어업", target: "패류 등 정착성수산동물" },
];

/** 수산업법에 의한 어종 관련 금지사항 안내 (데이터 판정 대상 아님 — 참고 페이지) */
export default function FisheriesActPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-2">
        <h1 className="text-lg font-bold text-slate-900">수산업법에 따른 포획 제한</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          금어기·금지체장·금지 대상(암컷 등)은 「수산자원관리법」 체계의 규정으로, 이 서비스의
          어종별 조회·판정 대상입니다. 이와 별개로 「수산업법」은 어업의 종류를 정의하면서 일부
          어업이 <span className="font-semibold">포획할 수 있는 수산동물 자체를 한정</span>
          합니다. 해당 어종은 아래 어업 외에는 목적어종으로 포획할 수 없습니다.
        </p>
        <p className="text-[12px] text-slate-400">
          근거: 수산업법 시행령 제21조(근해어업)·제22조(연안어업)·제23조(구획어업) —{" "}
          <a
            href={LAW_URL}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            원문 보기 ↗
          </a>
        </p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-700 mb-3">
          목적어종이 한정된 어업 (시행령 제21조~제23조)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] text-slate-400 border-b border-slate-200">
                <th className="py-1.5 pr-3 font-medium">어업</th>
                <th className="py-1.5 pr-3 font-medium">구분</th>
                <th className="py-1.5 font-medium">포획 대상</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TARGET_LIMITS.map((row) => (
                <tr key={row.industry}>
                  <td className="py-2 pr-3 text-slate-800">{row.industry}</td>
                  <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{row.group}</td>
                  <td className="py-2 text-slate-800">
                    {row.target}
                    {row.note && (
                      <span className="text-slate-400 text-[12px]"> — {row.note}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-2">
        <h2 className="text-sm font-bold text-slate-700">함께 알아둘 것</h2>
        <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
          <li>
            목적어종이 정해진 허가를 받은 어업인이 다른 수산동물을 잡는 것(혼획)은 수산업법
            제42조와 시행령 별표 3이 정한 어업·어종·허용 범위에서만 가능합니다.
          </li>
          <li>
            어업의 종류별 어구사용 금지구역·금지기간(시행령 별표 7), 근해어업 조업구역(별표 5) 등
            업종별 조업 규제는 이 서비스의 범위 밖입니다 — 원문 법령을 확인하세요.
          </li>
          <li>
            멸치는 「수산자원관리법」상 금어기·금지체장이 없는 대신, 위 표와 같이 포획할 수 있는
            어업 자체가 한정되는 방식으로 관리됩니다.
          </li>
        </ul>
      </section>
    </div>
  );
}
