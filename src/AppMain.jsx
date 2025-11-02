// diagnostica: segnala che AppMain è stato caricato
console.log('%c[APP] AppMain carreggiato', 'color:#66bb6a;font-weight:700');
window.__APP_LOADED = 'AppMain';

import React, { useState, useCallback, useEffect } from 'react';

// stili globali
import './styles/index.css';
import './styles/components.css';

// Importa il generatore Monte Carlo per dati reali
import { replaceWithRealSimulations } from './utils/monteCarloGenerator';

// asset
import ReactLogo from './assets/react.svg';

// provider / layout
import AppProvider from './app/AppProvider.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

// UI primitives
import Button from './components/ui/Button.jsx';
import Input from './components/ui/Input.jsx';
import Spinner from './components/ui/Spinner.jsx';
import Tooltip from './components/ui/Tooltip.jsx';

// features / pages
import BacktestForm from './features/backtest/BacktestForm.jsx';
import BacktestSummary from './features/backtest/BacktestSummary.jsx';
import EfficientFrontierInline from './features/frontier/EfficientFrontierInline.jsx';
import PortfolioPreview from './features/portfolio/PortfolioPreview.jsx';



// charts / visualizations
import CombinedPortfolioChart from './components/charts/CombinedPortfolioChart.jsx';
import PortfolioPieChart from './components/charts/PortfolioPieChart.jsx';

// api / utils
import { postBacktest, postEfficientFrontier } from './api/api.js';
import { exportCsvFromChartData, downloadSvgAsPng } from './utils/csvExport.js';
import { formatMoney } from './utils/formatters.js';
import buildAssetsPayloadFromPortfolioWeights from './utils/buildAssetsPayload.js';

export default function AppMain() {
  useEffect(() => {
    try { window.__APP_LOADED = 'AppMain'; } catch (e) {}
  }, []);

  const [backtestResults, setBacktestResults] = useState(null);
  const [frontierData, setFrontierData] = useState(null);
  const [simulatedBacktestResults, setSimulatedBacktestResults] = useState(null);
  const [showFrontier, setShowFrontier] = useState(false);
  const [lastPayload, setLastPayload] = useState(null);
  const [formParams, setFormParams] = useState(null); // Parametri del form per la simulazione
  const [loadingExport, setLoadingExport] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [calculatingFrontier, setCalculatingFrontier] = useState(false);

  // Gestore centrale dei risultati inviati da BacktestForm o altri componenti
  const handleResult = useCallback((payload) => {
    if (!payload) return;
    setLastPayload(payload);

    if (payload && payload._efficient_frontier) {
      // Sostituisci le simulazioni sintetiche con quelle basate su dati reali
      let frontierDataToSet = payload._efficient_frontier;
      
      // Se abbiamo i dati dei singoli asset, genera Monte Carlo reale
      if (backtestResults && backtestResults.individual_assets) {
        console.log('🎯 Sostituzione simulazioni Monte Carlo con dati reali...');
        try {
          frontierDataToSet = replaceWithRealSimulations(
            payload._efficient_frontier, 
            backtestResults.individual_assets
          );
          console.log('✅ Monte Carlo reale generato con successo');
        } catch (error) {
          console.warn('⚠️ Errore nella generazione Monte Carlo reale:', error);
          console.log('📋 Usando simulazioni originali del backend');
        }
      } else {
        console.log('📋 Dati asset non disponibili, usando simulazioni backend');
      }
      
      setFrontierData(frontierDataToSet);
      return;
    }

    setBacktestResults(payload);

    if (payload && (payload.name || payload.point_id)) {
      setSimulatedBacktestResults(payload);
    } else {
      setSimulatedBacktestResults(null);
    }
  }, [backtestResults]); // Aggiungi backtestResults come dipendenza

  const handleExportState = async () => {
    setLoadingExport(true);
    try {
      const state = { backtestResults, frontierData, simulatedBacktestResults, lastPayload };
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `simulatore-state-${Date.now()}.json`;
      a.click();
    } catch (e) { console.error('Export error', e); } finally { setLoadingExport(false); }
  };

  const handleExportCsvChart = () => {
    const chartData = backtestResults?.chart_data || [];
    exportCsvFromChartData(chartData, 'backtest-chart.csv');
  };

  const handleExportPng = () => {
    const svg = document.querySelector('svg');
    if (svg) downloadSvgAsPng(svg, 'chart.png');
    else alert('Nessun SVG trovato per l\'esportazione');
  };

  const onSimulateFromFrontier = async (portfolioWeights, portfolioName = 'Simulazione', pointId = null) => {
    if (!formParams) {
      alert('Parametri del form non disponibili per la simulazione.');
      return;
    }

    try {
      setSimulating(true);
      
      // Costruisci feeMap usando solo le commissioni specifiche degli asset
      const feeMap = {};
      for (const a of formParams.assets) {
        feeMap[a.ticker] = {
          entry_fee_percent: Number(a.entry_fee_percent || 0),
          annual_fee_percent: Number(a.annual_fee_percent || 0)
        };
      }
      
      const { assets, total } = buildAssetsPayloadFromPortfolioWeights(portfolioWeights, feeMap);
      
      if (!assets || assets.length === 0 || total <= 0) {
        alert('Composizione non valida per la simulazione.');
        setSimulating(false);
        return;
      }
      
      const normalizedAssets = assets.map(a => ({ 
        ticker: a.ticker, 
        weight: a.weight / total, 
        entry_fee_percent: a.entry_fee_percent || 0, 
        annual_fee_percent: a.annual_fee_percent || 0 
      }));

      // Calcola le commissioni pesate usando solo le commissioni degli asset
      const weightedFeeTotals = normalizedAssets.reduce((acc, a) => {
        acc.entry += (Number(a.entry_fee_percent) || 0) * (a.weight || 0);
        acc.annual += (Number(a.annual_fee_percent) || 0) * (a.weight || 0);
        return acc;
      }, { entry: 0, annual: 0 });

      // Payload identico al backtest statico
      const payload = {
        ...formParams,
        assets: normalizedAssets,
        initial_investment: parseFloat(formParams.initial_investment),
        annual_contribution: parseFloat(formParams.annual_contribution),
        entry_fee_percent: weightedFeeTotals.entry,
        annual_fee_percent: weightedFeeTotals.annual,
        optimization_target: ''
      };
      
      setLastPayload(payload);
      const data = await postBacktest(payload);
      
      const simulated = { ...data, name: portfolioName, point_id: pointId };
      setSimulatedBacktestResults(simulated);
    } catch (e) {
      console.error('Errore simulazione', e);
      alert('Errore durante la simulazione: ' + (e?.message || e));
    } finally { setSimulating(false); }
  };

  // Funzione per calcolare la frontiera efficiente
  const calculateEfficientFrontier = useCallback(async () => {
    if (!formParams || !backtestResults) {
      alert('Esegui prima un backtest per calcolare la frontiera efficiente.');
      return;
    }

    try {
      setCalculatingFrontier(true);
      
      // Costruisci feeMap usando solo le commissioni specifiche degli asset
      const feeMap = {};
      for (const a of formParams.assets) {
        feeMap[a.ticker] = {
          entry_fee_percent: Number(a.entry_fee_percent || 0),
          annual_fee_percent: Number(a.annual_fee_percent || 0)
        };
      }
      
      const { assets, total } = buildAssetsPayloadFromPortfolioWeights(
        formParams.assets.reduce((acc, asset) => {
          acc[asset.ticker] = asset.weight || 1;
          return acc;
        }, {}),
        feeMap
      );
      
      if (!assets || assets.length === 0 || total <= 0) {
        alert('Composizione non valida per il calcolo della frontiera efficiente.');
        setCalculatingFrontier(false);
        return;
      }
      
      const normalizedAssets = assets.map(a => ({ 
        ticker: a.ticker, 
        weight: a.weight / total, 
        entry_fee_percent: a.entry_fee_percent || 0, 
        annual_fee_percent: a.annual_fee_percent || 0 
      }));

      // Calcola le commissioni pesate
      const weightedFeeTotals = normalizedAssets.reduce((acc, a) => {
        acc.entry += (Number(a.entry_fee_percent) || 0) * (a.weight || 0);
        acc.annual += (Number(a.annual_fee_percent) || 0) * (a.weight || 0);
        return acc;
      }, { entry: 0, annual: 0 });

      // Payload per la frontiera efficiente
      const frontierPayload = {
        ...formParams,
        assets: normalizedAssets,
        initial_investment: parseFloat(formParams.initial_investment),
        annual_contribution: parseFloat(formParams.annual_contribution),
        entry_fee_percent: weightedFeeTotals.entry,
        annual_fee_percent: weightedFeeTotals.annual
      };
      
      const data = await postEfficientFrontier(frontierPayload);
      setFrontierData(data);
      setShowFrontier(true); // Mostra automaticamente la frontiera dopo il calcolo
      
    } catch (e) {
      console.error('Errore calcolo frontiera efficiente', e);
      alert('Errore durante il calcolo della frontiera efficiente: ' + (e?.message || e));
    } finally { 
      setCalculatingFrontier(false); 
    }
  }, [formParams, backtestResults]);

  // simplified toolbar to match legacy (title/logo only)
  const renderToolbar = () => (
    <div className="toolbar-slim" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src={ReactLogo} alt="logo" style={{ width: 36, height: 36 }} />
        <div>
          <strong style={{ color: '#66bb6a', display: 'block', fontSize: 18 }}>Simulatore di Backtest Finanziario</strong>
          <small style={{ color: '#aeb3b3' }}>Interfaccia modulare</small>
        </div>
      </div>

      {/* right side left intentionally empty to match legacy minimalist header */}
      <div style={{ minWidth: 24 }} />
    </div>
  );

  const renderCenter = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {renderToolbar()}

      {/* Backtest form top (full-width center) */}
      <div className="full-width-form center-content">
        <BacktestForm onResult={handleResult} onFormChange={setFormParams} />
      </div>

      <section aria-labelledby="summary-heading">
        <h3 id="summary-heading" style={{ color: '#fff', margin: '6px 0' }}>Risultati Backtest</h3>
        
        {/* Grafico a torta della composizione del portafoglio */}
        {backtestResults && formParams && formParams.assets && (
          <div style={{ marginBottom: 30 }}>
            <PortfolioPieChart 
              assets={formParams.assets}
              title="Composizione Portafoglio Testato"
            />
          </div>
        )}
        
        <BacktestSummary result={backtestResults} />
      </section>

      {/* Sezione per eseguire la frontiera efficiente */}
      {backtestResults && (
        <section aria-labelledby="frontier-action-heading" style={{ 
          marginTop: 20, 
          animation: 'fadeIn 0.6s ease-out' 
        }}>
          <div className="panel" style={{ 
            padding: 20, 
            textAlign: 'center', 
            backgroundColor: frontierData ? 'rgba(102, 187, 106, 0.15)' : 'rgba(102, 187, 106, 0.1)', 
            border: `2px solid ${frontierData ? '#66bb6a' : 'rgba(102, 187, 106, 0.6)'}`,
            borderRadius: 12,
            transition: 'all 0.4s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {frontierData && (
              <div style={{
                position: 'absolute',
                top: 15,
                right: 20,
                backgroundColor: '#66bb6a',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                ✓ Calcolata
              </div>
            )}
            <h3 id="frontier-action-heading" style={{ 
              color: '#66bb6a', 
              margin: '0 0 15px 0', 
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              📊 Analizza la Frontiera Efficiente
            </h3>
            <p style={{ color: '#ccc', margin: '0 0 20px 0', fontSize: 14, lineHeight: 1.4, maxWidth: '600px', margin: '0 auto 20px auto' }}>
              {frontierData 
                ? '✨ Frontiera efficiente calcolata con successo! Esplora i portafogli ottimali e le simulazioni interattive.' 
                : 'Esplora la relazione rischio-rendimento del tuo portafoglio e scopri composizioni ottimali attraverso l\'analisi della frontiera efficiente.'
              }
            </p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Button 
                onClick={frontierData ? () => setShowFrontier(!showFrontier) : calculateEfficientFrontier}
                disabled={calculatingFrontier}
                style={{ 
                  backgroundColor: calculatingFrontier ? '#999' : (showFrontier ? '#ff9800' : '#66bb6a'),
                  color: '#fff',
                  padding: '14px 32px',
                  fontSize: 16,
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 8,
                  cursor: calculatingFrontier ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: calculatingFrontier ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  margin: '0 auto',
                  minWidth: '240px',
                  boxShadow: calculatingFrontier 
                    ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                    : (showFrontier ? '0 6px 20px rgba(255, 152, 0, 0.3)' : '0 6px 20px rgba(102, 187, 106, 0.3)'),
                  transform: calculatingFrontier ? 'scale(0.98)' : 'scale(1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!calculatingFrontier) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = showFrontier ? '0 8px 25px rgba(255, 152, 0, 0.4)' : '0 8px 25px rgba(102, 187, 106, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!calculatingFrontier) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = showFrontier ? '0 6px 20px rgba(255, 152, 0, 0.3)' : '0 6px 20px rgba(102, 187, 106, 0.3)';
                  }
                }}
              >
                {calculatingFrontier && <Spinner size="small" />}
                {calculatingFrontier ? (
                  <>
                    🔄 Calcolando frontiera...
                  </>
                ) : (
                  frontierData ? (
                    showFrontier ? '👁️ Nascondi Analisi' : '📊 Mostra Analisi'
                  ) : (
                    '🚀 Calcola Frontiera Efficiente'
                  )
                )}
              </Button>
              
              {calculatingFrontier && (
                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 11,
                  color: '#999',
                  whiteSpace: 'nowrap'
                }}>
                  Analizzando ~5000 portafogli...
                </div>
              )}
            </div>

            {/* Sezione Frontiera Efficiente integrata */}
            {showFrontier && (
              <div style={{ 
                marginTop: 30, 
                paddingTop: 30, 
                borderTop: '2px solid rgba(102, 187, 106, 0.3)',
                animation: 'slideInUp 0.5s ease-out',
                background: 'linear-gradient(135deg, rgba(102, 187, 106, 0.05) 0%, rgba(102, 187, 106, 0.1) 100%)',
                borderRadius: '0 0 8px 8px',
                margin: '30px -20px -20px -20px',
                padding: '30px 20px 20px 20px'
              }}>
                <h3 style={{ 
                  color: '#66bb6a', 
                  margin: '0 0 20px 0', 
                  fontSize: 18, 
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  ⚡ Frontiera Efficiente - Analisi Interattiva
                </h3>
                

                
                <EfficientFrontierInline
                  frontierData={frontierData}
                  onSimulate={(weights, name, pointId) => onSimulateFromFrontier(weights, name, pointId)}
                  simulatedBacktestResults={simulatedBacktestResults}
                  renderSummaryContent={(result, title, isSimulation = false, options = {}) => {
                    if (!result) return null;
                    const hideChart = !!options.hideChart;
                    return (
                      <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${isSimulation ? '#ffb300' : '#66bb6a'}` }}>
                        <h2 style={{ color: '#fff', marginBottom: 18, fontSize: 20 }}>{title}</h2>
                        <BacktestSummary result={result} hideChart={hideChart} />
                      </div>
                    );
                  }}
                  backtestResults={backtestResults}
                />
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );

  // left and right intentionally set to null so the center expands to full width via MainLayout
  return (
    <AppProvider>
      <div style={{ minHeight: '100vh', padding: 10 }}>
        <MainLayout left={null} center={renderCenter()} right={null} />
        <div style={{ position: 'fixed', left: 12, bottom: 12, color: '#777', fontSize: 12 }}>
          Built modular — AppMain (modular) vs AppFull (legacy)
        </div>
      </div>
    </AppProvider>
  );
}