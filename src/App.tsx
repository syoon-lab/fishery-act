import { Navigate, Route, Routes } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import IndustryDetailPage from "./pages/IndustryDetailPage";
import ZonePage from "./pages/ZonePage";
import SourcesPage from "./pages/SourcesPage";
import AboutPage from "./pages/AboutPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
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
  );
}
