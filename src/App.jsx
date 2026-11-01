import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
const IndexPage = lazy(() => import('./components/IndexPage'));
const QuizPage = lazy(() => import('./components/QuizPage'));
const AiPulseDiscovery = lazy(() => import('./components/AiPulseDiscovery'));
const AiHandoffPlanPage = lazy(() => import('./components/AiHandoffPlanPage'));

// Vercel 301s /ai-audit -> /ai-handoff-plan, /ai-check -> /ai-opportunity-check and
// /ai-handoff-plan/municipal -> /ai-handoff-plan/public-sector at the edge
// (see vercel.json). This client-side fallback covers the SPA-only dev/preview servers that
// never see vercel.json, so an old link still lands correctly and keeps its query string.
function LegacyRedirect({ to }) {
  const location = useLocation();
  return <Navigate to={{ pathname: to, search: location.search }} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<main role="status" aria-live="polite" style={{ padding: '2rem', color: '#F5EFE6' }}>Loading BlueChip…</main>}>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/ai-opportunity-check" element={<AiPulseDiscovery />} />
          <Route path="/ai-check" element={<LegacyRedirect to="/ai-opportunity-check" />} />
          <Route path="/ai-handoff-plan" element={<AiHandoffPlanPage />} />
          <Route path="/ai-handoff-plan/public-sector" element={<AiHandoffPlanPage edition="public-sector" />} />
          <Route path="/ai-handoff-plan/municipal" element={<LegacyRedirect to="/ai-handoff-plan/public-sector" />} />
          <Route path="/ai-audit" element={<LegacyRedirect to="/ai-handoff-plan" />} />
          <Route path="/:slug" element={<QuizPage />} />
          <Route path="/:slug/result/:resultCode" element={<QuizPage shareView />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
