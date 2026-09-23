import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IndexPage from './components/IndexPage';
import QuizPage from './components/QuizPage';
import AiOpportunityCheck from './components/AiOpportunityCheck';
import AiAuditPage from './components/AiAuditPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/ai-opportunity-check" element={<AiOpportunityCheck />} />
        <Route path="/ai-audit" element={<AiAuditPage />} />
        <Route path="/:slug" element={<QuizPage />} />
        <Route path="/:slug/result/:resultCode" element={<QuizPage shareView />} />
      </Routes>
    </BrowserRouter>
  );
}
