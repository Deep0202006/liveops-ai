import { lazy, Suspense, type ReactNode } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ErrorBoundary } from "../components/status/ErrorBoundary";
import LandingPage from "../routes/LandingPage";

const CommandCenterPage = lazy(() => import("../routes/CommandCenterPage"));
const ModelEvidencePage = lazy(() => import("../routes/ModelEvidencePage"));
const DataLabPage = lazy(() => import("../routes/WorkspacePage"));
const ComparePage = lazy(() => import("../routes/ComparePage"));

function OperationalRoute({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

function NotFoundPage() {
  return <main className="route-not-found">
    <p>404</p>
    <h1>Operational route not found</h1>
    <p>The requested view is not part of this reliability command center.</p>
    <Link className="button primary" to="/command">Open Command Center</Link>
  </main>;
}

export default function App() {
  const location = useLocation();

  return <ErrorBoundary area="route" resetKey={location.pathname}>
    <Suspense fallback={<div className="cc-loading" role="status">Loading operational view…</div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/command" element={<OperationalRoute><CommandCenterPage /></OperationalRoute>} />
        <Route path="/asset/:assetId" element={<OperationalRoute><CommandCenterPage /></OperationalRoute>} />
        <Route path="/maintenance" element={<OperationalRoute><CommandCenterPage maintenanceOnly /></OperationalRoute>} />
        <Route path="/compare" element={<OperationalRoute><ComparePage /></OperationalRoute>} />
        <Route path="/model" element={<OperationalRoute><ModelEvidencePage /></OperationalRoute>} />
        <Route path="/lab" element={<OperationalRoute><DataLabPage /></OperationalRoute>} />
        <Route path="/app" element={<OperationalRoute><DataLabPage /></OperationalRoute>} />
        <Route path="/app/model" element={<OperationalRoute><ModelEvidencePage /></OperationalRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>;
}
