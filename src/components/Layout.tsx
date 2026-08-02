import { Link, NavLink, Outlet } from "react-router";
import { meta } from "@/domain/repository";

const NAV_ITEMS = [
  { to: "/", label: "조회" },
  { to: "/sources", label: "출처" },
  { to: "/about", label: "소개" },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-bold tracking-tight">
              수산업법 조업 규제 조회
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md transition-colors ${
                    isActive ? "bg-white/20 font-semibold" : "hover:bg-white/10 text-white/80"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-500 space-y-1">
          <p>
            본 서비스는 수산업법·시행령의 어업별 규제를 정리한 비공식 참고용 웹앱입니다. 실제 조업
            시에는 반드시 원문 법령과 관할 기관 고시를 확인하시기 바랍니다.
          </p>
          <p>
            데이터 기준일: {meta.dataAsOf} · 금어기·금지체장(수산자원관리법)은{" "}
            <a
              href="https://fishery-regulation.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              수산자원 금어기·금지체장 조회
            </a>
            에서 확인하세요.
          </p>
        </div>
      </footer>
    </div>
  );
}
