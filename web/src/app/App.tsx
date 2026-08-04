import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ErrorBoundary } from "../components/status/ErrorBoundary";
import CommandCenterPage from "../routes/CommandCenterPage";

const ModelEvidencePage = lazy(() => import("../routes/ModelEvidencePage"));
const DataLabPage = lazy(() => import("../routes/WorkspacePage"));
const ComparePage = lazy(() => import("../routes/ComparePage"));

export default function App() {
  const location = useLocation();
  return <AppShell><ErrorBoundary area="route" resetKey={location.pathname}><Suspense fallback={<div className="cc-loading">Loading operational view…</div>}><Routes>
    <Route path="/" element={<CommandCenterPage />} />
    <Route path="/asset/:assetId" element={<CommandCenterPage />} />
    <Route path="/maintenance" element={<CommandCenterPage maintenanceOnly />} />
    <Route path="/compare" element={<ComparePage />} />
    <Route path="/model" element={<ModelEvidencePage />} />
    <Route path="/lab" element={<DataLabPage />} />
    <Route path="/app" element={<DataLabPage />} />
    <Route path="/app/model" element={<ModelEvidencePage />} />
    <Route path="*" element={<CommandCenterPage />} />
  </Routes></Suspense></ErrorBoundary></AppShell>;
}
