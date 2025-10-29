import React from 'react';

/**
 * Small, static histogram placeholder for annual returns.
 * Props: data = [{ year, return_percentage }]
 */
export default function Histogram({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div style={{ padding: 12, color: '#999' }}>Nessun dato annuale disponibile.</div>;
  }

  const values = data.map(d => Number(d.return_percentage ?? d.return ?? 0));
  const maxAbs = Math.max(...values.map(v => Math.abs(v)), 10);
  return (
    <div style={{ padding: 12 }}>
      <h4 style={{ color: '#fff', margin: 0 }}>Istogramma Annuale</h4>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {data.map((d, i) => {
          const h = Math.min(160, Math.abs(Number(d.return_percentage ?? 0)) * (120 / maxAbs) + 6);
          const color = (Number(d.return_percentage ?? 0) >= 0) ? '#66bb6a' : '#ef5350';
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: `${h}px`, background: color, borderRadius: 6 }} />
              <div style={{ color: '#ccc', marginTop: 6, fontSize: 12 }}>{d.year ?? '-'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}