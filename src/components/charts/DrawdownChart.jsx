import React from 'react';

/**
 * Minimal drawdown chart placeholder. Accepts chartData = [{ Date, Value }]
 */
export default function DrawdownChart({ chartData = [] }) {
  if (!chartData || chartData.length < 2) {
    return (
      <div style={{ padding: 12, color: '#ccc' }}>
        Dati insufficienti per il grafico drawdown.
      </div>
    );
  }

  // compute drawdown series
  let peak = -Infinity;
  const dd = chartData.map(d => {
    const v = Number(d.Value ?? 0);
    if (v > peak) peak = v;
    const draw = (v / peak - 1) * 100;
    return { Date: d.Date, Drawdown: draw };
  });

  const values = dd.map(d => d.Drawdown);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);

  const w = 800, h = 240;
  const left = 50, top = 30, right = 30, bottom = 50;
  const innerW = w - left - right;
  const innerH = h - top - bottom;

  const getX = (i) => left + (i / Math.max(1, dd.length - 1)) * innerW;
  const getY = (v) => top + (1 - (v - minV) / (maxV - minV || 1)) * innerH;

  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(v)}`).join(' ');

  return (
    <div style={{ padding: 8 }}>
      <h4 style={{ color: '#fff', margin: '8px 0' }}>Drawdown</h4>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: `${h}px` }}>
        <rect x="0" y="0" width={w} height={h} fill="#121212" rx="6" />
        <path d={path} fill="none" stroke="#ef5350" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}