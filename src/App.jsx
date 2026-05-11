import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IndexPage from './components/IndexPage';
import QuizPage from './components/QuizPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/:slug" element={<QuizPage />} />
        <Route path="/:slug/result/:resultCode" element={<QuizPage shareView />} />
      </Routes>
    </BrowserRouter>
  );
}
