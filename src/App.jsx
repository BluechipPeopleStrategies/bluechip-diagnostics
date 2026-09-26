import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import IndexPage from './components/IndexPage';
import QuizPage from './components/QuizPage';
import AiOpportunityCheck from './components/AiOpportunityCheck';
import AiHandoffPlanPage from './components/AiHandoffPlanPage';
import LunchRegister from './pages/Lunch/LunchRegister';
import LunchLive from './pages/Lunch/LunchLive';

// Vercel 301s /ai-audit -> /ai-handoff-plan and /ai-check -> /ai-opportunity-check at the edge
// (see vercel.json). This client-side fallback covers the SPA-only dev/preview servers that
// never see vercel.json, so an old link still lands correctly and keeps its query string.
function LegacyRedirect({ to }) {
  const location = useLocation();
  return <Navigate to={{ pathname: to, search: location.search }} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/ai-opportunity-check" element={<AiOpportunityCheck />} />
        <Route path="/ai-check" element={<LegacyRedirect to="/ai-opportunity-check" />} />
        <Route path="/ai-handoff-plan" element={<AiHandoffPlanPage />} />
        <Route path="/ai-audit" element={<LegacyRedirect to="/ai-handoff-plan" />} />
        <Route path="/lunch" element={<LunchRegister />} />
        <Route path="/lunch/live" element={<LunchLive />} />
        <Route path="/:slug" element={<QuizPage />} />
        <Route path="/:slug/result/:resultCode" element={<QuizPage shareView />} />
      </Routes>
    </BrowserRouter>
  );
}
