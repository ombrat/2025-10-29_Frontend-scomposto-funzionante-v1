import React from 'react';
import PortfolioChart from './PortfolioChart';

/**
 * Very small wrapper to show two charts side-by-side (primary / secondary)
 * Expect primaryResult and secondaryResult as in your backtest responses.
 */
export default function CombinedPortfolioChart({ primaryResult, secondaryResult, titlePrimary, titleSecondary }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <PortfolioChart data={primaryResult} title={titlePrimary || 'Simulazione'} />
      <PortfolioChart data={secondaryResult} title={titleSecondary || 'Statico Utente'} />
    </div>
  );
}