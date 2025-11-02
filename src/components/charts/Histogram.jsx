import React from 'react';

export default function Histogram({ data = [], maxBars = 12 }) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  // normalize: accept array of numbers or array of { return_percentage }
  const values = data.map(d => {
    if (typeof d === 'number') return d;
    if (typeof d.return_percentage === 'number') return d.return_percentage;
    if (typeof d.return_percent === 'number') return d.return_percent;
    if (typeof d.return === 'number') return d.return;
    if (typeof d.value === 'number') return d.value;
    return 0;
  }).filter(v => isFinite(v));

  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const bins = Math.min(maxBars, Math.ceil(Math.sqrt(values.length)));
  const range = max - min || 1;
  const binWidth = range / bins;
  const counts = new Array(bins).fill(0);
  values.forEach(v => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / binWidth));
    counts[idx] += 1;
  });
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="panel" style={{ marginTop: 18, padding: 14 }}>
      <h4 style={{ color: '#fff' }}>Distribuzione Rendimenti Annuali</h4>
      <div style={{ display: 'flex', gap: 8, alignItems: 'end', height: 160, marginTop: 12 }}>
        {counts.map((c, i) => {
          const left = min + i * binWidth;
          const right = left + binWidth;
          const height = Math.max(6, (c / maxCount) * 140);
          const color = (left + right) / 2 >= 0 ? '#66bb6a' : '#ef5350';
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: `${height}px`, background: color, borderRadius: 4, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 700, paddingBottom: 4 }}>{c}</span>
              </div>
              <div style={{ fontSize: 11, color: '#ccc', marginTop: 6 }}>{(left + binWidth / 2).toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>Istogramma semplice basato sui rendimenti annuali forniti.</div>
    </div>
  );
}