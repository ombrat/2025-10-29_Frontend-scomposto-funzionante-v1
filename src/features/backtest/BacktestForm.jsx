import React, { useState } from 'react';
import AssetRow from '../../components/forms/AssetRow';
import TickerSearch from '../../components/forms/TickerSearch';
import Button from '../../components/ui/Button';
import { postBacktest, postEfficientFrontier } from '../../api/api';
import '../../styles/components.css';

/**
 * Basic Backtest form (connects to API client).
 */
export default function BacktestForm({ onResult }) {
  const [assets, setAssets] = useState([
    { ticker: 'SPY', name: 'S&P 500 ETF', weight: 0.7, entry_fee_percent: 0.0, annual_fee_percent: 0.0 },
    { ticker: 'BND', name: 'Total Bond Market', weight: 0.3, entry_fee_percent: 0.0, annual_fee_percent: 0.0 }
  ]);
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [annualContribution, setAnnualContribution] = useState(1200);
  const [startDate, setStartDate] = useState('2015-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleAddTicker(ticker, name) {
    if (assets.some(a => a.ticker === ticker)) return;
    setAssets(prev => [...prev, { ticker, name, weight: 0, entry_fee_percent: 0, annual_fee_percent: 0 }]);
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

  async function handleRunBacktest(e) {
    e && e.preventDefault && e.preventDefault();
    setError(null);
    const total = assets.reduce((s, a) => s + (Number(a.weight) || 0), 0);
    if (assets.length > 0 && (total < 0.995 || total > 1.005)) {
      setError('La somma dei pesi deve essere circa 100% prima di eseguire il backtest.');
      return;
    }
    const payload = {
      assets: assets.map(a => ({ ticker: a.ticker, weight: a.weight, entry_fee_percent: a.entry_fee_percent, annual_fee_percent: a.annual_fee_percent })),
      initial_investment: Number(initialInvestment),
      annual_contribution: Number(annualContribution),
      start_date: startDate, end_date: endDate
    };
    setLoading(true);
    try {
      const result = await postBacktest(payload);
      if (onResult) onResult(result);
    } catch (err) {
      setError(err?.message || 'Errore nella chiamata backtest');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFrontier() {
    setError(null);
    if (assets.length < 2) { setError('Servono almeno 2 asset per calcolare la frontiera.'); return; }
    const payload = {
      assets: assets.map(a => ({ ticker: a.ticker, weight: a.weight, entry_fee_percent: a.entry_fee_percent, annual_fee_percent: a.annual_fee_percent })),
      start_date: startDate,
      end_date: endDate
    };
    setLoading(true);
    try {
      const data = await postEfficientFrontier(payload);
      // caller can show it
      if (onResult) onResult({ _efficient_frontier: data });
    } catch (err) {
      setError(err?.message || 'Errore nella chiamata frontier');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" style={{ padding: 16 }}>
      <h3 style={{ color: '#66bb6a' }}>Parametri e Assets</h3>

      <div style={{ marginTop: 8 }}>
        <label style={{ color: '#ccc' }}>Investimento Iniziale</label>
        <input type="number" value={initialInvestment} onChange={(e) => setInitialInvestment(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, marginTop: 6, background: '#1b1b1b', color: '#fff', border: '1px solid #333' }} />
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ color: '#ccc' }}>Contributo Annuo</label>
        <input type="number" value={annualContribution} onChange={(e) => setAnnualContribution(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, marginTop: 6, background: '#1b1b1b', color: '#fff', border: '1px solid #333' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ color: '#ccc' }}>Data Inizio</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, marginTop: 6, background: '#1b1b1b', color: '#fff', border: '1px solid #333' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ color: '#ccc' }}>Data Fine</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, marginTop: 6, background: '#1b1b1b', color: '#fff', border: '1px solid #333' }} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ color: '#ccc' }}>Aggiungi Ticker</label>
        <TickerSearch onSelect={handleAddTicker} />
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#999' }}>Assets</div>
          <div style={{ color: '#aaa', fontSize: 13 }}>{Math.round(assets.reduce((s, a) => s + (Number(a.weight) || 0), 0) * 100)}% allocato</div>
        </div>

        <div style={{ marginTop: 8 }}>
          {assets.map((a, i) => (
            <AssetRow key={`${a.ticker}-${i}`} asset={a} index={i} onChange={updateAsset} onRemove={removeAsset} />
          ))}
        </div>
      </div>

      {error && <div style={{ marginTop: 10, padding: 10, background: '#361212', color: '#ffdede', borderRadius: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button onClick={handleRunBacktest} style={{ background: '#1e88e5' }}>{loading ? 'Eseguendo...' : 'Esegui Backtest'}</Button>
        <Button onClick={handleFrontier} style={{ background: '#66bb6a' }}>Calcola Frontiera</Button>
      </div>
    </div>
  );
}