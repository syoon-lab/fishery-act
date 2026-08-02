import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="py-16 text-center space-y-3">
      <p className="text-2xl font-bold text-slate-800">페이지를 찾을 수 없습니다</p>
      <Link to="/" className="text-accent hover:underline text-sm">
        판정 화면으로 돌아가기
      </Link>
    </div>
  );
}
