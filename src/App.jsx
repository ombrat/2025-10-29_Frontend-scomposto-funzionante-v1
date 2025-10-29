import React, { Suspense, lazy } from 'react';

// Lazy-load the legacy full app (you already have this file as AppFull.jsx)
const AppFull = lazy(() => import('./features/legacy/AppFull.jsx'));

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e6e6e6' }}>
      <Suspense fallback={<div style={{ padding: 20, textAlign: 'center' }}>Caricamento applicazione...</div>}>
        <AppFull />
      </Suspense>
    </div>
  );
}