import React, { useState, useMemo, useEffect } from 'react';
import AssetRow from '../../components/forms/AssetRow';
import TickerSearch from '../../components/forms/TickerSearch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { postBacktest } from '../../api/api';
import '../../styles/components.css';

/**
 * BacktestForm - layout aggiornato per riprodurre impaginazione legacy (come da screenshot)
 */
export default function BacktestForm({ onResult, onFormChange }) {
  const [assets, setAssets] = useState([
    { ticker: 'SPY', name: 'S&P 500 ETF', weight: 0.7, entry_fee_percent: 0, annual_fee_percent: 0 },
    { ticker: 'BND', name: 'Total Bond Market', weight: 0.3, entry_fee_percent: 0, annual_fee_percent: 0 }
  ]);
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [annualContribution, setAnnualContribution] = useState(1200);
  const [frequency, setFrequency] = useState('Mensile');
  const [startDate, setStartDate] = useState('2015-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Notifica AppMain dei parametri del form per la simulazione
  useEffect(() => {
    if (onFormChange) {
      const formParams = {
        assets,
        initial_investment: initialInvestment,
        annual_contribution: annualContribution,
        contribution_frequency: frequency === 'Mensile' ? 'monthly' : frequency === 'Trimestrale' ? 'quarterly' : 'none',
        start_date: startDate,
        end_date: endDate
      };
      onFormChange(formParams);
    }
  }, [assets, initialInvestment, annualContribution, frequency, startDate, endDate, onFormChange]);

  function handleAddTicker(ticker, name) {
    if (assets.some(a => a.ticker === ticker)) return;
    setAssets(prev => [...prev, { 
      ticker, 
      name, 
      weight: 0, 
      entry_fee_percent: 0, 
      annual_fee_percent: 0 
    }]);
  }

  function updateAsset(i, field, v) {
    setAssets(prev => {
      const copy = [...prev];
      if (field === 'weight') {
        const parsed = parseFloat(String(v).replace(',', '.'));
        copy[i][field] = isNaN(parsed) ? 0 : (parsed > 1 ? parsed / 100 : parsed);
      } else {
        copy[i][field] = Number(String(v).replace(',', '.')) || 0;
      }
      return copy;
    });
  }

  function removeAsset(i) {
    setAssets(prev => prev.filter((_, idx) => idx !== i));
  }



  function normalizeWeights() {
    const total = assets.reduce((s, a) => s + (Number(a.weight) || 0), 0);
    if (total <= 0) return;
    const normalized = assets.map(a => ({ ...a, weight: Number(((a.weight / total) || 0).toFixed(6)) }));
    setAssets(normalized);
  }

  async function handleRunBacktest(e) {
    e && e.preventDefault && e.preventDefault();
    setError(null);

    // basic validation: total weights ~ 1
    const total = assets.reduce((s, a) => s + (Number(a.weight) || 0), 0);
    if (assets.length > 0 && (total < 0.995 || total > 1.005)) {
      setError('La somma dei pesi deve essere circa 100% prima di eseguire il backtest.');
      return;
    }

    // date validation
    if (new Date(startDate) > new Date(endDate)) {
      setError('La data di inizio deve essere precedente o uguale alla data di fine.');
      return;
    }

    // Map Italian frequency to English backend format
    const frequencyMap = {
      'Mensile': 'monthly',
      'Annuale': 'yearly',
      'Mensile (x12)': 'monthly'
    };

    // Calculate weighted average fees using only individual asset fees
    const weightedFeeTotals = assets.reduce((acc, a) => {
      const weight = Number(a.weight) || 0;
      acc.entry += (Number(a.entry_fee_percent) || 0) * weight;
      acc.annual += (Number(a.annual_fee_percent) || 0) * weight;
      return acc;
    }, { entry: 0, annual: 0 });

    const payload = {
      assets: assets.map(a => ({ 
        ticker: a.ticker, 
        weight: a.weight, 
        entry_fee_percent: Number(a.entry_fee_percent) || 0, 
        annual_fee_percent: Number(a.annual_fee_percent) || 0 
      })),
      initial_investment: Number(initialInvestment),
      annual_contribution: Number(annualContribution),
      contribution_frequency: frequencyMap[frequency] || 'monthly',
      start_date: startDate,
      end_date: endDate,
      // Use only weighted fees from individual assets
      entry_fee_percent: weightedFeeTotals.entry,
      annual_fee_percent: weightedFeeTotals.annual
    };

    // Verifica commissioni nel payload
    console.log('💳 Commissioni inviate:', {
      assets: payload.assets.map(a => ({
        ticker: a.ticker,
        entry_fee: a.entry_fee_percent,
        annual_fee: a.annual_fee_percent
      }))
    });

    // diagnostic: save last request to window for debugging
    try { window.__lastBacktestRequest = payload; } catch (e) {}

    setLoading(true);
    try {
      const result = await postBacktest(payload);
      try { window.__lastApiResponse = result; } catch (e) {}
      if (onResult) onResult(result);
    } catch (err) {
      const msg = err?.message || (err?.response?.data?.error) || 'Errore nella chiamata backtest';
      setError(msg);
      console.error('backtest error', err);
    } finally {
      setLoading(false);
    }
  }

  // percentuale allocata per barra di stato
  const totalPercent = useMemo(() => Math.round(assets.reduce((s, a) => s + (Number(a.weight) || 0), 0) * 100), [assets]);
  const weightBarClass = (totalPercent < 99 || totalPercent > 101) ? 'weight-bar weight-bar-warning' : 'weight-bar';

  return (
    <div 
      className="panel" 
      aria-busy={loading ? 'true' : 'false'} 
      style={{ 
        padding: 20,
        background: 'linear-gradient(135deg, rgba(102, 187, 106, 0.05) 0%, rgba(102, 187, 106, 0.1) 100%)',
        border: '2px solid rgba(102, 187, 106, 0.3)',
        borderRadius: 12,
        animation: 'fadeIn 0.6s ease-out',
        position: 'relative'
      }}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          top: 15,
          right: 20,
          backgroundColor: '#ff9800',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          ⏳ Elaborando...
        </div>
      )}
      
      <h2 style={{ 
        color: '#66bb6a', 
        margin: '0 0 20px 0', 
        textAlign: 'left',
        fontSize: 18,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        ⚙️ Parametri Finanziari e Temporali
      </h2>

      {/* Top two-column block */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#bdbdbd', fontSize: 13 }}>Investimento Iniziale (EUR)</label>
            <Input type="number" value={initialInvestment} onChange={(e) => setInitialInvestment(e.target.value)} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#bdbdbd', fontSize: 13 }}>Frequenza Contribuzione</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, background: '#0b0b0b', color: '#e6e6e6', border: '1px solid rgba(255,255,255,0.03)' }}>
              <option>Mensile</option>
              <option>Annuale</option>
              <option>Mensile (x12)</option>
            </select>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#bdbdbd', fontSize: 13 }}>Contributo Annuo (EUR)</label>
            <Input type="number" value={annualContribution} onChange={(e) => setAnnualContribution(e.target.value)} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#bdbdbd', fontSize: 13 }}>Data Inizio</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Data Fine full width on next row (like screenshot) */}
      <div style={{ marginTop: 10 }}>
        <label style={{ color: '#bdbdbd', fontSize: 13 }}>Data Fine</label>
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      {/* Selezione Assets e Pesi */}
      <div style={{ 
        marginTop: 25,
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.15)',
        borderRadius: 10,
        border: '1px solid rgba(102, 187, 106, 0.2)',
        animation: 'slideInUp 0.5s ease-out 0.2s both'
      }}>
        <h3 style={{ 
          color: '#66bb6a', 
          margin: '0 0 15px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          💼 Selezione Assets e Pesi
        </h3>

        <div style={{ marginBottom: 8, color: '#bdbdbd' }}>Obiettivo Analisi:</div>
        <div style={{ marginBottom: 12 }}>
          <select style={{ width: '100%', padding: 8, borderRadius: 6, background: '#0b0b0b', color: '#e6e6e6', border: '1px solid rgba(255,255,255,0.03)' }}>
            <option>1. Pesi Statici Utente</option>
          </select>
        </div>

        {/* Weight bar + normalize */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#9e9e9e', fontSize: 13, marginBottom: 6 }}>Assets nel Portafoglio (100% Allocato)</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className={weightBarClass} style={{ flex: 1 }}>
                <div className="fill" style={{ width: `${Math.min(100, Math.max(0, totalPercent))}%` }} />
              </div>
              <div style={{ minWidth: 48, textAlign: 'right', color: '#9e9e9e' }}>{totalPercent}%</div>
            </div>
            <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 6 }}>Barra di stato pesi (la somma dovrebbe essere 100%). Puoi impostare commissioni per singolo asset. Se non presenti, verranno usati i valori globali di seguito.</div>
          </div>

          <div style={{ width: 140, textAlign: 'right' }}>
            <Button onClick={normalizeWeights} variant="secondary" disabled={loading}>Normalizza pesi</Button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: 10 }}>
          <TickerSearch onSelect={handleAddTicker} placeholder="Cerca Ticker (es. SPY, BND)" />
        </div>

        {/* Table header + assets */}
        <div style={{ marginTop: 12 }}>
          <div style={{ background: 'linear-gradient(180deg,#171717,#141414)', padding: 10, borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#cfcfcf', fontSize: 13 }}>
                  <th style={{ padding: '8px 10px', width: 80 }}>Ticker</th>
                  <th style={{ padding: '8px 10px' }}>Nome</th>
                  <th style={{ padding: '8px 10px', width: 120 }}>Peso (%)</th>
                  <th style={{ padding: '8px 10px', width: 120 }}>Entry Fee (%)</th>
                  <th style={{ padding: '8px 10px', width: 120 }}>Annual Fee (%)</th>
                  <th style={{ padding: '8px 10px', width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a, i) => (
                  // AssetRow component should render a row interface; if it doesn't, we fallback to inline row here
                  <tr key={`${a.ticker}-${i}`} style={{ borderTop: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '10px' }}>{a.ticker}</td>
                    <td style={{ padding: '10px' }}>{a.name}</td>
                    <td style={{ padding: '10px' }}>
                      <Input type="number" value={(Number(a.weight) * 100).toFixed(2)} onChange={(e) => updateAsset(i, 'weight', e.target.value)} />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <Input type="number" step="0.01" value={a.entry_fee_percent} onChange={(e) => updateAsset(i, 'entry_fee_percent', e.target.value)} />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <Input type="number" step="0.01" value={a.annual_fee_percent} onChange={(e) => updateAsset(i, 'annual_fee_percent', e.target.value)} />
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <Button onClick={() => removeAsset(i)} variant="danger" small>Rimuovi</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#3b1f1f', color: '#ffd6d6' }}>
          {error}
        </div>
      )}

      {/* Action button bottom */}
      <div style={{ 
        marginTop: 25, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 10,
        animation: 'slideInUp 0.5s ease-out 0.4s both'
      }}>
        <Button 
          onClick={handleRunBacktest} 
          variant="primary" 
          disabled={loading}
          style={{
            backgroundColor: loading ? '#999' : '#66bb6a',
            color: '#fff',
            padding: '12px 32px',
            fontSize: 16,
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '220px',
            justifyContent: 'center',
            boxShadow: loading ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 6px 20px rgba(102, 187, 106, 0.3)',
            transform: loading ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {loading ? '⏳ Eseguendo analisi...' : '🚀 Esegui Backtest Statico'}
        </Button>
      </div>
    </div>
  );
}