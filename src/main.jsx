import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/visual.css';
import App from './App.jsx';
import { startHeightObserver } from './lib/iframe.js';
import { captureAttribution } from './lib/attribution.js';

// Where this visitor came from, recorded once on load (sent with a lead, never shown).
captureAttribution();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

startHeightObserver();
