import React from 'react';

/**
 * Lightweight wrapper for efficient frontier results.
 * If you prefer to use the inline version already in AppFull.jsx, you can ignore this file.
 */
export default function EfficientFrontier({ frontierData }) {
  if (!frontierData) {
    return (
      <div className="panel" style={{ padding: 12 }}>
        <p style={{ color: '#ccc' }}>Frontiera efficiente non calcolata.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="panel-title">Frontiera Efficiente</h3>
      <div className="panel" style={{ padding: 12 }}>
        <p style={{ color: '#ccc' }}>Punti: {Array.isArray(frontierData.simulated_portfolios) ? frontierData.simulated_portfolios.length : 0}</p>
      </div>
    </div>
  );
}