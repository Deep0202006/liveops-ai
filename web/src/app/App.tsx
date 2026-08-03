import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import LandingPage from "../routes/LandingPage";
import WorkspacePage from "../routes/WorkspacePage";
import { ErrorBoundary } from "../components/status/ErrorBoundary";

const ModelEvidencePage = lazy(() => import("../routes/ModelEvidencePage"));

export default function App() {
  const location = useLocation(); const product = location.pathname.startsWith("/app");
  return <AppShell product={product}><ErrorBoundary area={product ? "workspace" : "route"} resetKey={location.pathname}><Suspense fallback={<div className="route-loading"><span className="spinner" /> Loading evidence</div>}><Routes><Route path="/" element={<LandingPage />} /><Route path="/app" element={<WorkspacePage />} /><Route path="/app/model" element={<ModelEvidencePage />} /><Route path="*" element={<LandingPage />} /></Routes></Suspense></ErrorBoundary></AppShell>;
}
