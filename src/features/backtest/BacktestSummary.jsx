import React from 'react';
import PortfolioChart from '../../components/charts/PortfolioChart';
import DrawdownChart from '../../components/charts/DrawdownChart';
import Histogram from '../../components/charts/Histogram';

export default function BacktestSummary({ results }) {
  if (!results) {
    return (
      <div className="panel" style={{ padding: 16 }}>
        <p style={{ color: '#ccc' }}>Nessun risultato disponibile.</p>
      </div>
    );
  }

  const summary = results.summary || {};
  const chartData = results.chart_data || [];
  const annual = results.all_annual_returns || results.annual_returns || [];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <PortfolioChart data={results} title="Andamento Portafoglio" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        <div>
          <DrawdownChart chartData={chartData} />
        </div>
        <div style={{ padding: 12 }} className="panel">
          <h4 style={{ color: '#fff' }}>Metriche</h4>
          <div style={{ marginTop: 8, color: '#ddd' }}>
            <div>CAGR: {(summary.cagr_approx ?? summary.cagr ?? 0).toFixed(2)}%</div>
            <div>Volatilità: {(summary.annual_volatility ?? 0).toFixed(2)}%</div>
            <div>Sharpe: {(summary.sharpe_ratio ?? 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <Histogram data={annual} />
    </div>
  );
}