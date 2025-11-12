import React, { Suspense, lazy } from 'react';
import Spinner from '../components/ui/Spinner.jsx';

// Importa il vecchio AppMain che contiene tutta la logica del backtest
const loadAppMain = import('../AppMain.jsx')
  .then(m => m)
  .catch(err => {
    console.error('[BACKTEST] Errore import AppMain, uso fallback AppFull:', err);
    // esponi errore per ispezione
    window.__APP_LOAD_ERROR = err && (err.message || String(err));
    // fallback al legacy
    return import('../features/legacy/AppFull.jsx');
  });

const AppMain = lazy(() => loadAppMain);

/**
 * Pagina dedicata al Backtest - wrapper dell'AppMain esistente
 */
export default function BacktestPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      padding: '40px 20px'
    }}>
      {/* Titolo principale sul background */}
      <h1 className="panel-title" style={{
        margin: '0 0 10px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        textAlign: 'center'
      }}>
        📊 Simulatore di Backtest Finanziario
      </h1>
      <p style={{
        fontSize: '16px',
        color: '#999',
        margin: '0 0 40px 0',
        textAlign: 'center',
        lineHeight: 1.4
      }}>
        Configura il tuo portafoglio, imposta i parametri e analizza i risultati.
      </p>

      {/* Contenuto principale - AppMain esistente */}
      <Suspense fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <Spinner />
          <div style={{ color: '#999', fontSize: '16px' }}>
            Caricamento simulatore di backtest...
          </div>
        </div>
      }>
        <AppMain />
      </Suspense>
    </div>
  );
}