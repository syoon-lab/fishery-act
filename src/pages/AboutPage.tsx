import { Link } from "react-router";

export default function AboutPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-lg font-bold text-slate-900">이 서비스에 대해</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          「수산업법」과 같은 법 시행령은 어업(업종)을 정의하면서 <b>포획할 수 있는 수산동물을
          한정</b>하고(목적어종), 어업별로 <b>조업구역·조업금지 기간·어구사용 금지구역과
          금지기간·그물코 규격</b>을 정합니다. 이 서비스는 그 규정들을 어업·날짜·지역 기준으로
          조회할 수 있게 정리한 참고용 도구입니다.
        </p>
        <p>
          어종 중심 규제(금어기·금지체장·금지 대상)는 「수산자원관리법」 체계로, 별도 서비스{" "}
          <a href="https://fishery-regulation.vercel.app" target="_blank" rel="noreferrer" className="text-accent hover:underline">
            수산자원 금어기·금지체장 조회
          </a>
          에서 다룹니다.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            판정은 시·도 단위까지만 지원합니다. 좌표로 정의된 금지해역(주1~주17 등)은{" "}
            <Link to="/zones" className="text-accent hover:underline">해역 설명</Link>과 원문 별표
            7을 확인하세요.
          </li>
          <li>
            면허어업 보호구역(법 제28조), 공익상 제한 처분(법 제33조), 위생관리·어업협정에 따른
            고시 등 처분·고시 기반 제한은 포함하지 않습니다.
          </li>
          <li>
            누구든지 법정 어업 외의 방법으로 수산동식물을 포획·채취하면 처벌됩니다(법 제63조,
            3년 이하 징역 또는 3천만원 이하 벌금).
          </li>
        </ul>
        <p className="text-xs text-slate-400">
          본 서비스는 비공식 정보 참고용이며 법적 효력이 없습니다. 실제 조업 전 반드시 국가법령정보센터
          원문과 관할 기관(해양수산부·시·도) 고시를 확인하세요.
        </p>
      </div>
    </div>
  );
}
