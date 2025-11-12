import React from 'react';
import PortfolioChart from '../../components/charts/PortfolioChart';
import { formatMoney } from '../../utils/formatters';

/**
 * Small preview card used to show a portfolio quick summary:
 * props: { result } where result is a backtest response
 */
export default function PortfolioPreview({ result, title = 'Preview Portafoglio' }) {
  if (!result) {
    return (
      <div className="panel" style={{ padding: 12 }}>
        <p style={{ color: '#999' }}>Nessun risultato disponibile.</p>
      </div>
    );
  }

  const summary = result.summary || {};
  return (
    <div className="panel" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 className="panel-title" style={{ margin: 0 }}>{title}</h4>
        <div style={{ color: '#aaa', fontSize: 12 }}>{summary.period ?? ''}</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <PortfolioChart data={result} title={''} />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#ccc', fontSize: 12 }}>Final Value</div>
          <div style={{ fontWeight: 800 }}>{formatMoney(Number(summary.final_value ?? summary.final_value_eur ?? 0))}</div>
        </div>
        <div>
          <div style={{ color: '#ccc', fontSize: 12 }}>CAGR</div>
          <div style={{ fontWeight: 800 }}>{(Number(summary.cagr_approx ?? 0)).toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
}