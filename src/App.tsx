import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import IndustryDetailPage from "./pages/IndustryDetailPage";
import ZonePage from "./pages/ZonePage";
import SourcesPage from "./pages/SourcesPage";
import AboutPage from "./pages/AboutPage";
import NotFoundPage from "./pages/NotFoundPage";

/** 경로 이동 시 맨 위부터 표시 (필터 등 쿼리스트링 변경에는 반응하지 않음) */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="industries" element={<Navigate to="/" replace />} />
        <Route path="industries/:id" element={<IndustryDetailPage />} />
        <Route path="zones" element={<ZonePage />} />
        <Route path="zones/:id" element={<ZonePage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </>
  );
}
