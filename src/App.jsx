import React, { Suspense, lazy } from 'react';

const loadAppMain = import('./AppMain.jsx')
  .then(m => m)
  .catch(err => {
    console.error('[APP] Errore import AppMain, uso fallback AppFull:', err);
    // esponi errore per ispezione
    window.__APP_LOAD_ERROR = err && (err.message || String(err));
    // fallback al legacy
    return import('./features/legacy/AppFull.jsx');
  });

const AppMain = lazy(() => loadAppMain);

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e6e6e6' }}>
      <Suspense fallback={<div style={{ padding: 20, textAlign: 'center' }}>Caricamento applicazione...</div>}>
        <AppMain />
      </Suspense>
    </div>
  );
}