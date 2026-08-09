import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { StoreProvider } from './state/store';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';

// Offline shell. Caches the app's own files so it opens with no network;
// registration is for caching only — there is no push subscription here and
// never will be.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const url = new URL('sw.js', document.baseURI).href;
    navigator.serviceWorker.register(url, { scope: './' }).catch(() => {
      // No offline cache is a fine outcome; the app still works online.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);
