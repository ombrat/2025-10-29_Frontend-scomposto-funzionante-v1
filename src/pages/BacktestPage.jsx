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
      minHeight: 'calc(100vh - 120px)', // Sottrae header e footer
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header della pagina */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <h1 className="panel-title" style={{
            margin: '0 0 10px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📊 Simulatore di Backtest Finanziario
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#999',
            margin: 0,
            lineHeight: 1.4
          }}>
            Testa le tue strategie di investimento con dati storici reali. 
            Configura il tuo portafoglio, imposta i parametri e analizza i risultati.
          </p>
        </div>
      </div>

      {/* Contenuto principale - AppMain esistente */}
      <div style={{ flex: 1 }}>
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
    </div>
  );
}