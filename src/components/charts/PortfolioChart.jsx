import React, { useRef } from 'react';
import { downloadSvgAsPng } from '../../utils/csvExport';
import '../../styles/components.css';

/**
 * Lightweight responsive portfolio chart placeholder.
 * Props:
 *  - data: { chart_data: [{ Date, Value, TotalInvested }], ... }
 *  - title
 */
export default function PortfolioChart({ data, title = 'Andamento Storico' }) {
  const svgRef = useRef(null);
  const chartData = (data && data.chart_data) || [];
  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div className="panel" style={{ padding: 12 }}>
        <h3 style={{ color: '#fff' }}>{title}</h3>
        <p style={{ color: '#aaa' }}>Nessun dato storico disponibile.</p>
      </div>
    );
  }

  const values = chartData.map(d => Number(d.Value ?? 0));
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const w = 900, h = 320;
  const left = 50, top = 30, right = 30, bottom = 50;
  const innerW = w - left - right;
  const innerH = h - top - bottom;

  const getX = (i) => left + (i / Math.max(1, chartData.length - 1)) * innerW;
  const getY = (v) => top + (1 - (v - minV) / (maxV - minV || 1)) * innerH;

  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(v)}`).join(' ');

  return (
    <div className="panel" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#fff', margin: 0 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => downloadSvgAsPng(svgRef.current, 'portfolio.png')} style={{ background: '#333', color: '#fff', padding: '6px 10px', borderRadius: 8, border: 'none' }}>Scarica PNG</button>
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: `${h}px`, marginTop: 12 }}>
        <rect x="0" y="0" width={w} height={h} fill="#101010" rx="8" />
        <path d={path} fill="none" stroke="#1e88e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* simple x-axis labels */}
        {chartData.slice(0, chartData.length).filter((_, i) => i % Math.ceil(Math.max(1, chartData.length / 6)) === 0).map((d, i) => {
          const idx = i * Math.ceil(Math.max(1, chartData.length / 6));
          const x = getX(idx);
          return <text key={i} x={x} y={h - 18} fontSize="11" fill="#999" textAnchor="middle">{new Date(chartData[idx].Date).toLocaleDateString()}</text>;
        })}
      </svg>
    </div>
  );
}