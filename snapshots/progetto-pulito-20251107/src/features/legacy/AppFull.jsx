// diagnostica: segnala che AppFull (legacy) è stato caricato
console.log('%c[APP] AppFull (legacy) carreggiato', 'color:#ff9800;font-weight:700');
window.__APP_LOADED = 'AppFull';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';

// URL di base che punta al tuo server Python su Google Cloud Run
const BASE_URL = 'https://backtest-server-final-453907803757.europe-west3.run.app/api';

// Create an axios instance with a default timeout
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s
});

// --- Hook: ResizeObserver helper per misurare container dimensioni (responsive charts) ---
const useResizeObserver = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    ro.observe(el);
    // initial measurement
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, [ref]);
  return size;
};

// --- Funzione Helper per formattazione Data (gg/mm/yyyy) ---
const formatDate = (dateString, opts = {}) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (opts.shortYear) return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
    if (opts.short) return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

// --- Helper: formatta valori monetari in Euro ---
const moneyFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
const formatMoney = (value) => {
  if (typeof value !== 'number' || !isFinite(value)) return moneyFormatter.format(0);
  return moneyFormatter.format(value);
};

// --- Utilities: export SVG -> PNG e CSV ---
const downloadSvgAsPng = (svgElement, filename = 'chart.png') => {
  if (!svgElement) return;
  try {
    const xml = new XMLSerializer().serializeToString(svgElement);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const b64Start = 'data:image/svg+xml;base64,';
    const image64 = b64Start + svg64;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      // fill background to match dark theme
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const png = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = png;
      a.download = filename;
      a.click();
    };
    img.onerror = (e) => {
      console.error('Errore nel convertire SVG in immagine:', e);
    };
    img.src = image64;
  } catch (e) {
    console.error('downloadSvgAsPng error', e);
  }
};

const exportCsvFromChartData = (chartData = [], filename = 'chart.csv') => {
  if (!Array.isArray(chartData) || chartData.length === 0) {
    const blob = new Blob([''], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    return;
  }
  const keys = Array.from(new Set(chartData.flatMap(d => Object.keys(d))));
  const rows = [keys.join(',')];
  for (const item of chartData) {
    const row = keys.map(k => {
      const v = item[k] ?? '';
      const s = (typeof v === 'string') ? v.replace(/"/g, '""') : String(v);
      return (s.indexOf(',') >= 0 || s.indexOf('\n') >= 0) ? `"${s}"` : s;
    }).join(',');
    rows.push(row);
  }
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// --- STILI CSS BASE (OGGETTI INLINE) ---
const styles = {
  appContainer: {
    maxWidth: 'min(1300px, 96%)',
    width: '100%',
    margin: '20px auto',
    padding: '28px 22px',
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    backgroundColor: 'transparent',
    color: '#e0e0e0',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '18px',
    fontSize: '16px',
  },
  title: {
    color: '#66bb6a',
    borderBottom: '1px solid #333',
    paddingBottom: '12px',
    marginBottom: '12px',
    fontSize: '28px',
    fontWeight: 700,
    textAlign: 'center',
    width: '100%',
  },
  panel: {
    backgroundColor: '#151515',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
  },
  input: {
    padding: '12px 14px',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '8px',
    marginBottom: '12px',
    backgroundColor: '#1f1f1f',
    border: '1px solid #333',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '15px',
    lineHeight: '1.4',
  },
  compactInput: {
    padding: '10px 12px',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '6px',
    marginBottom: '10px',
    backgroundColor: '#1f1f1f',
    border: '1px solid #333',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.2',
  },
  buttonBase: {
    padding: '12px 20px',
    fontSize: '15px',
    flex: 1,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    fontWeight: 600,
  },
  metricCard: {
    backgroundColor: '#202020',
    padding: '15px',
    borderRadius: '8px',
    flex: 1,
    minWidth: '170px',
    borderLeft: '4px solid #1e88e5',
  },
  drawdownCard: {
    backgroundColor: '#151515',
    padding: '22px',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
    border: '1px solid #222',
    marginTop: '20px',
  },
  tableHeader: {
    backgroundColor: '#1f1f1f',
    borderBottom: '2px solid #66bb6a',
    fontSize: '14px',
  }
};

// ---------- Helpers (same as your original) ----------
const formatNumber = (value, key) => {
  if (typeof value !== 'number') return value;
  if (key.includes('percent') || key.includes('volatility') || key.includes('drawdown') || key.includes('cagr') || key.includes('return') || key.includes('year')) {
    const color = value >= 0 ? '#66bb6a' : '#ef5350';
    return <span style={{ color }}>{`${value.toFixed(2)}%`}</span>;
  }
  if (key.includes('value') || key.includes('invested') || key.includes('amount') || key.includes('final')) {
    return formatMoney(value);
  }
  if (key.includes('sharpe') || key.includes('ratio')) {
    return value.toFixed(2);
  }
  return value.toLocaleString();
};

const MAX_DISPLAY_POINTS = 300;
const sampleEvenIndices = (arr, maxPoints = MAX_DISPLAY_POINTS) => {
  if (!Array.isArray(arr)) return arr || [];
  const n = arr.length;
  if (n <= maxPoints) return arr;
  const step = (n - 1) / (maxPoints - 1);
  const indices = [];
  const used = new Set();
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    const clamped = Math.max(0, Math.min(n - 1, idx));
    if (!used.has(clamped)) {
      indices.push(clamped);
      used.add(clamped);
    } else {
      let found = -1;
      for (let d = 1; d < n; d++) {
        const fwd = clamped + d;
        const bwd = clamped - d;
        if (fwd < n && !used.has(fwd)) { found = fwd; break; }
        if (bwd >= 0 && !used.has(bwd)) { found = bwd; break; }
      }
      if (found !== -1) { indices.push(found); used.add(found); }
    }
  }
  if (indices.length < maxPoints) {
    for (let i = 0; i < n && indices.length < maxPoints; i++) {
      if (!used.has(i)) { indices.push(i); used.add(i); }
    }
  }
  indices.sort((a, b) => a - b);
  return indices.slice(0, maxPoints).map(i => arr[i]);
};

const niceTicks = (min, max, desiredCount = 6) => {
  if (!isFinite(min) || !isFinite(max)) return [];
  if (min === max) {
    const base = Math.abs(min) || 1;
    return [min - base, min, min + base];
  }
  const range = max - min;
  const rawStep = range / (desiredCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceMultiplier = 1;
  if (residual >= 5) niceMultiplier = 10;
  else if (residual >= 2) niceMultiplier = 5;
  else if (residual >= 1) niceMultiplier = 2;
  else niceMultiplier = 1;
  const step = magnitude * niceMultiplier;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + 0.5 * step; v += step) {
    const rounded = Math.round((v + Number.EPSILON) * 100) / 100;
    if (rounded >= niceMin - 1e-9 && rounded <= niceMax + 1e-9) ticks.push(rounded);
    if (ticks.length > desiredCount * 3) break;
  }
  if (ticks.length < 3) {
    const fallback = [];
    const altStep = range / (desiredCount - 1);
    for (let i = 0; i < desiredCount; i++) {
      fallback.push(Math.round((min + i * altStep) * 100) / 100);
    }
    return fallback;
  }
  return ticks;
};

const estimateTextWidth = (text, fontSize = 13) => {
  const avgChar = fontSize * 0.55;
  return Math.ceil(String(text || '').length * avgChar);
};

const Spinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" style={{ display: 'inline-block' }}>
    <circle cx="25" cy="25" r="20" stroke="#fff" strokeWidth="4" strokeOpacity="0.15" fill="none" />
    <path fill="#fff" d="M25 5 A20 20 0 0 1 45 25" >
      <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
    </path>
  </svg>
);

const SkeletonBox = ({ height = 16, width = '100%', borderRadius = 6 }) => (
  <div style={{
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
    marginBottom: 8
  }} />
);

// ---------- UI Components (with UX improvements) ----------

// InfoBox helper
const InfoBox = ({ title, value, sub }) => (
  <div style={{
    background: 'linear-gradient(180deg,#171717,#141414)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: '12px 14px',
    minWidth: 180,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-start',
    boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
  }}>
    <div style={{ fontSize: 12, color: '#cfcfcf', lineHeight: 1 }}>{title}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#999' }}>{sub}</div>}
  </div>
);

// PortfolioChart with export buttons, throttle and toggle for invested series
const PortfolioChart = ({ data, title, onHover = null, hoverIndex = null, highlightColor = '#1e88e5' }) => {
  const chartDataRaw = data?.chart_data;
  if (!chartDataRaw || chartDataRaw.length === 0) return null;

  const wrapperRef = useRef(null);
  const { width: wrapperWidth } = useResizeObserver(wrapperRef);

  const computedWidth = Math.round(wrapperWidth || 900);
  const WIDTH = Math.max(600, Math.min(1200, computedWidth));
  const HEIGHT = Math.round(WIDTH * 0.44);

  const RIGHT_MARGIN = 48;
  const TOP_MARGIN = 48;
  const BOTTOM_MARGIN = 70;

  const firstInvestedIndexInRaw = chartDataRaw.findIndex(d => {
    const investedVal = Number(d.TotalInvested ?? d.Total_invested ?? d.totalInvested ?? 0);
    const valueVal = Number(d.Value ?? 0);
    return investedVal > 0 || valueVal > 0;
  });
  const startIdx = firstInvestedIndexInRaw >= 0 ? firstInvestedIndexInRaw : 0;
  const trimmedRaw = chartDataRaw.slice(startIdx);
  const chartData = sampleEvenIndices(trimmedRaw, MAX_DISPLAY_POINTS);

  const values = chartData.map(d => Number(d.Value ?? 0));
  const invested = chartData.map(d => Number(d.TotalInvested ?? d.Total_invested ?? d.totalInvested ?? 0));
  const dates = chartData.map(d => new Date(d.Date));

  const minYRaw = Math.min(...values, ...invested);
  const maxYRaw = Math.max(...values, ...invested);
  const minY = isFinite(minYRaw) ? minYRaw : 0;
  const maxY = isFinite(maxYRaw) ? maxYRaw : minY + 1;

  const desiredYTicks = 6;
  const yTickValues = niceTicks(minY, maxY, desiredYTicks);
  let yTicks = yTickValues;
  if (yTicks.length < 5) {
    yTicks = [];
    for (let i = 0; i < desiredYTicks; i++) {
      yTicks.push(Math.round((minY + (i / (desiredYTicks - 1)) * (maxY - minY)) * 100) / 100);
    }
  }

  const yLabelStrings = yTicks.map(v => formatMoney(v));
  const maxYLabelWidth = Math.max(...yLabelStrings.map(s => estimateTextWidth(s, 12)));
  const leftGutter = Math.max(56, maxYLabelWidth + 20);

  const innerWidth = WIDTH - leftGutter - RIGHT_MARGIN;
  const innerHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

  const getX = (index) => leftGutter + index * (innerWidth) / Math.max(1, (values.length - 1));
  const getY = (value) => {
    const normalized = (value - minY) / (maxY - minY || 1);
    return TOP_MARGIN + (1 - normalized) * innerHeight;
  };

  const [localHoverIndex, setLocalHoverIndex] = useState(null);
  const [hoverData, setHoverData] = useState(null); // <--- NEW: detailed hover payload for tooltip
  const svgRef = useRef(null);

  // throttle mousemove with rAF
  const pendingRef = useRef(false);
  const lastMouseRef = useRef(null);

  const processMouseEvent = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const chartLeft = leftGutter;
    const stepWidth = innerWidth / Math.max(1, (values.length - 1));
    let idxFloat = (mouseX - chartLeft) / stepWidth;
    let idx = Math.round(idxFloat);
    idx = Math.max(0, Math.min(values.length - 1, idx));
    const payload = { index: idx, date: dates[idx], x: getX(idx), y: getY(values[idx]), value: values[idx], invested: invested[idx] };
    // call external onHover if provided
    if (typeof onHover === 'function') onHover(payload);
    else setLocalHoverIndex(idx);
    // always set internal hover data (used to render tooltip)
    setHoverData(payload);
  };

  const scheduleProcess = () => {
    if (!pendingRef.current) {
      pendingRef.current = true;
      requestAnimationFrame(() => {
        const e = lastMouseRef.current;
        if (e) processMouseEvent(e);
        pendingRef.current = false;
      });
    }
  };

  const handleMouseMove = (e) => {
    lastMouseRef.current = e;
    scheduleProcess();
  };

  const handleMouseLeave = () => {
    if (typeof onHover === 'function') onHover(null);
    setLocalHoverIndex(null);
    setHoverData(null); // reset tooltip
    lastMouseRef.current = null;
    pendingRef.current = false;
  };

  const activeIndex = (typeof hoverIndex === 'number') ? hoverIndex : localHoverIndex;

  const portfolioPath = values.map((value, index) => {
    const x = getX(index);
    const y = getY(value);
    return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  const investedPath = invested.map((value, index) => {
    const x = getX(index);
    const y = getY(value);
    return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  // UX state: show/hide invested series
  const [showInvested, setShowInvested] = useState(true);

  // Tooltip renderer
  const renderTooltip = () => {
    if (!hoverData || !wrapperRef.current) return null;
    const rect = wrapperRef.current.getBoundingClientRect();
    // compute pixel coordinates relative to wrapper
    const leftPxRaw = (hoverData.x / WIDTH) * rect.width;
    const topPxRaw = (hoverData.y / HEIGHT) * rect.height;
    const dateLabel = formatDate(hoverData.date, { shortYear: true });
    const valueLabel = formatMoney(hoverData.value);
    const investedLabel = formatMoney(hoverData.invested ?? 0);
    const fontSize = 12;
    const estDate = estimateTextWidth(dateLabel, fontSize);
    const estVal = estimateTextWidth(valueLabel, fontSize);
    const estInv = estimateTextWidth(investedLabel, fontSize);
    const contentMax = Math.max(estDate, estVal, estInv);
    const horizontalPadding = 20;
    const BOX_WIDTH = Math.min(Math.max(140, contentMax + horizontalPadding), Math.min(380, rect.width * 0.7));
    const lineHeight = 18;
    const BOX_HEIGHT = 12 + 3 * lineHeight;
    const offsetFromPoint = 8;
    let left = leftPxRaw - BOX_WIDTH / 2;
    left = Math.max(8, Math.min(rect.width - BOX_WIDTH - 8, left));
    let top = topPxRaw - BOX_HEIGHT - offsetFromPoint;
    if (top < TOP_MARGIN * 0.4) {
      top = topPxRaw + offsetFromPoint;
      if (top + BOX_HEIGHT > rect.height - 8) top = Math.max(8, rect.height - BOX_HEIGHT - 8);
    }
    const tooltipStyle = {
      position: 'absolute',
      left: left,
      top: top,
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
      background: 'linear-gradient(180deg,#151515,#1e1e1e)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
      padding: '8px 10px',
      borderRadius: 8,
      color: '#e6e6e6',
      zIndex: 9999,
      pointerEvents: 'none',
      fontSize: 12,
      lineHeight: '18px'
    };
    return (
      <div style={tooltipStyle} role="tooltip" aria-hidden>
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{dateLabel}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
          <div style={{ color: '#1e88e5', fontWeight: 700 }}>Valore</div>
          <div style={{ color: '#ddd', fontWeight: 700 }}>{valueLabel}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ color: '#ffb300', fontWeight: 700 }}>Investito</div>
          <div style={{ color: '#ddd', fontWeight: 700 }}>{investedLabel}</div>
        </div>
      </div>
    );
  };

  return (
    <div ref={wrapperRef} className="panel" style={{ ...styles.panel, marginTop: 18, padding: 14, border: '1px solid #222', position: 'relative' }}>
      <h3 style={{ color: '#fff', marginBottom: 12, fontSize: 18, textAlign: 'center' }}>{title || 'Andamento Storico Portafoglio'}</h3>
      <div style={{ width: '100%', display: 'block', position: 'relative' }}>
        <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: `${HEIGHT}px`, display: 'block', margin: '0 auto' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          {yTicks.map((v, i) => (<line key={i} x1={leftGutter} x2={WIDTH - RIGHT_MARGIN} y1={getY(v)} y2={getY(v)} stroke="#2d2d2d" strokeDasharray="3 3" />))}
          <path d={portfolioPath} fill="none" stroke={highlightColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {showInvested && <path d={investedPath} fill="none" stroke="#ffb300" strokeDasharray="5 5" strokeWidth="2.5" />}
          {yTicks.map((labelValue, i) => (<text key={i} x={leftGutter - 12} y={getY(labelValue) + 5} textAnchor="end" fontSize="12" fill="#999">{formatMoney(labelValue)}</text>))}
          {Array.from(new Set([0, Math.floor((values.length - 1) * 0.25), Math.floor((values.length - 1) * 0.5), Math.floor((values.length - 1) * 0.75), values.length - 1])).map((idx) => (
            <text key={idx} x={getX(idx)} y={HEIGHT - BOTTOM_MARGIN + 22} textAnchor="middle" fontSize="12" fill="#999">{formatDate(dates[idx])}</text>
          ))}
          <line x1={leftGutter} x2={leftGutter} y1={TOP_MARGIN - 6} y2={HEIGHT - BOTTOM_MARGIN} stroke="#444" />
          {typeof activeIndex === 'number' && activeIndex >= 0 && activeIndex < values.length && (
            <>
              <line x1={getX(activeIndex)} x2={getX(activeIndex)} y1={TOP_MARGIN} y2={HEIGHT - BOTTOM_MARGIN} stroke={highlightColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.9" />
              <circle cx={getX(activeIndex)} cy={getY(values[activeIndex])} r="5" fill={highlightColor} stroke="#fff" strokeWidth="1.4" />
            </>
          )}
        </svg>

        {/* Legend */}
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>
          <span style={{ color: '#1e88e5', marginRight: 10 }}>Valore Portafoglio</span>
          <span style={{ color: '#ffb300' }}>Totale Investito</span>
        </div>

        {/* controls */}
        <div className="chart-controls" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ ...styles.buttonBase, padding: '8px 12px', fontSize: 13 }} onClick={() => downloadSvgAsPng(svgRef.current, 'portfolio.png')} aria-label="Scarica PNG">Scarica PNG</button>
          <button className="btn" style={{ ...styles.buttonBase, padding: '8px 12px', fontSize: 13, background: '#333', color: '#fff' }} onClick={() => exportCsvFromChartData(chartData, 'portfolio.csv')}>Esporta CSV</button>
          <label style={{ color: '#ccc', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={showInvested} onChange={(e) => setShowInvested(e.target.checked)} /> Mostra Totale Investito
          </label>
        </div>

        {/* Tooltip (absolute over wrapper) */}
        {renderTooltip()}
      </div>
    </div>
  );
};

// CombinedPortfolioChart with toggles (legend) and export/throttle improvements
const CombinedPortfolioChart = ({ primaryResult, secondaryResult, titlePrimary, titleSecondary, onHover = null, primaryColor = '#1e88e5', secondaryColor = '#ffb300' }) => {
  if (!primaryResult || !primaryResult.chart_data || primaryResult.chart_data.length === 0) return null;

  const wrapperRef = useRef(null);
  const { width: wrapperWidth } = useResizeObserver(wrapperRef);
  const computedWidth = Math.round(wrapperWidth || 900);
  const WIDTH = Math.max(720, Math.min(1200, computedWidth));
  const HEIGHT = Math.round(WIDTH * 0.44);
  const RIGHT_MARGIN = 48;
  const TOP_MARGIN = 48;
  const BOTTOM_MARGIN = 70;

  const trimAndSample = (chartDataRaw) => {
    if (!chartDataRaw || chartDataRaw.length === 0) return [];
    const firstInvestedIndexInRaw = chartDataRaw.findIndex(d => {
      const investedVal = Number(d.TotalInvested ?? d.Total_invested ?? d.totalInvested ?? 0);
      const valueVal = Number(d.Value ?? 0);
      return investedVal > 0 || valueVal > 0;
    });
    const startIdx = firstInvestedIndexInRaw >= 0 ? firstInvestedIndexInRaw : 0;
    const trimmed = chartDataRaw.slice(startIdx);
    return sampleEvenIndices(trimmed, MAX_DISPLAY_POINTS);
  };

  const primaryChart = trimAndSample(primaryResult.chart_data);
  const secondaryChart = secondaryResult ? trimAndSample(secondaryResult.chart_data) : [];

  const primaryValues = primaryChart.map(d => Number(d.Value ?? 0));
  const primaryInvested = primaryChart.map(d => Number(d.TotalInvested ?? d.Total_invested ?? d.totalInvested ?? 0));
  const primaryDates = primaryChart.map(d => new Date(d.Date));

  const secondaryValues = secondaryChart.map(d => Number(d.Value ?? 0));
  const secondaryInvested = secondaryChart.map(d => Number(d.TotalInvested ?? d.Total_invested ?? d.totalInvested ?? 0));
  const secondaryDates = secondaryChart.map(d => new Date(d.Date));

  const allValues = [...primaryValues, ...secondaryValues, ...primaryInvested, ...secondaryInvested].filter(v => typeof v === 'number' && isFinite(v));
  const minYRaw = allValues.length ? Math.min(...allValues) : 0;
  const maxYRaw = allValues.length ? Math.max(...allValues) : minYRaw + 1;
  const minY = isFinite(minYRaw) ? minYRaw : 0;
  const maxY = isFinite(maxYRaw) ? maxYRaw : minY + 1;

  const desiredYTicks = 6;
  const yTickValues = niceTicks(minY, maxY, desiredYTicks);
  let yTicks = yTickValues;
  if (yTicks.length < 5) {
    yTicks = [];
    for (let i = 0; i < desiredYTicks; i++) yTicks.push(Math.round((minY + (i / (desiredYTicks - 1)) * (maxY - minY)) * 100) / 100);
  }

  const yLabelStrings = yTicks.map(v => formatMoney(v));
  const maxYLabelWidth = Math.max(...yLabelStrings.map(s => estimateTextWidth(s, 12)));
  const leftGutter = Math.max(56, maxYLabelWidth + 20);

  const innerWidth = WIDTH - leftGutter - RIGHT_MARGIN;
  const innerHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

  const getXPrimary = (index) => leftGutter + index * (innerWidth) / Math.max(1, (primaryValues.length - 1));
  const getXSecondary = (index) => leftGutter + index * (innerWidth) / Math.max(1, (secondaryValues.length - 1));
  const getY = (value) => {
    const normalized = (value - minY) / (maxY - minY || 1);
    return TOP_MARGIN + (1 - normalized) * innerHeight;
  };

  const primaryPath = primaryValues.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getXPrimary(i)},${getY(v)}`).join(' ');
  const primaryInvestedPath = primaryInvested.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getXPrimary(i)},${getY(v)}`).join(' ');
  const secondaryPath = secondaryValues.length ? secondaryValues.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getXSecondary(i)},${getY(v)}`).join(' ') : '';
  const secondaryInvestedPath = secondaryInvested.length ? secondaryInvested.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getXSecondary(i)},${getY(v)}`).join(' ') : '';

  const svgRef = useRef(null);
  const [localHover, setLocalHover] = useState(null);

  // throttling rAF for combined chart
  const pendingRef = useRef(false);
  const lastMouseRef = useRef(null);

  const processCombinedMouse = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const candidates = [];
    if (primaryValues.length > 0) {
      const stepP = innerWidth / Math.max(1, (primaryValues.length - 1));
      let idxP = Math.round((mouseX - leftGutter) / stepP);
      idxP = Math.max(0, Math.min(primaryValues.length - 1, idxP));
      const xP = getXPrimary(idxP);
      candidates.push({ type: 'primary', idx: idxP, x: xP, value: primaryValues[idxP], invested: primaryInvested[idxP], date: primaryDates[idxP] });
    }
    if (secondaryValues.length > 0) {
      const stepS = innerWidth / Math.max(1, (secondaryValues.length - 1));
      let idxS = Math.round((mouseX - leftGutter) / stepS);
      idxS = Math.max(0, Math.min(secondaryValues.length - 1, idxS));
      const xS = getXSecondary(idxS);
      candidates.push({ type: 'secondary', idx: idxS, x: xS, value: secondaryValues[idxS], invested: secondaryInvested[idxS], date: secondaryDates[idxS] });
    }
    let best = null;
    for (const c of candidates) {
      const dx = Math.abs(c.x - mouseX);
      if (!best || dx < best.dist) best = { ...c, dist: dx };
    }
    if (!best) { setLocalHover(null); if (onHover) onHover(null); return; }
    const idxPrimary = (primaryValues.length > 0) ? Math.round(((best.type === 'primary') ? best.idx : Math.round((best.x - leftGutter) / (innerWidth / Math.max(1, (primaryValues.length - 1)))))) : null;
    const idxSecondary = (secondaryValues.length > 0) ? Math.round(((best.type === 'secondary') ? best.idx : Math.round((best.x - leftGutter) / (innerWidth / Math.max(1, (secondaryValues.length - 1)))))) : null;
    const payload = {
      idxPrimary, idxSecondary,
      datePrimary: idxPrimary != null ? primaryDates[idxPrimary] : null,
      dateSecondary: idxSecondary != null ? secondaryDates[idxSecondary] : null,
      x: best.x,
      y: getY(best.value),
      primaryValue: idxPrimary != null ? primaryValues[idxPrimary] : null,
      secondaryValue: idxSecondary != null ? secondaryValues[idxSecondary] : null,
      primaryInvested: idxPrimary != null ? primaryInvested[idxPrimary] : null,
      secondaryInvested: idxSecondary != null ? secondaryInvested[idxSecondary] : null
    };
    setLocalHover(payload);
    if (typeof onHover === 'function') onHover(payload);
  };

  const scheduleCombinedProcess = () => {
    if (!pendingRef.current) {
      pendingRef.current = true;
      requestAnimationFrame(() => {
        const e = lastMouseRef.current;
        if (e) processCombinedMouse(e);
        pendingRef.current = false;
      });
    }
  };

  const handleMouseMove = (e) => {
    lastMouseRef.current = e;
    scheduleCombinedProcess();
  };

  const handleMouseLeave = () => {
    setLocalHover(null);
    lastMouseRef.current = null;
    pendingRef.current = false;
    if (typeof onHover === 'function') onHover(null);
  };

  // UX toggles for series visibility
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(true);

  const datesForLabels = primaryDates.length ? primaryDates : secondaryDates;
  const nx = datesForLabels.length || 1;
  const xFrac = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div ref={wrapperRef} className="panel" style={{ ...styles.panel, marginTop: 18, padding: 14, border: '1px solid #222', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ color: '#fff', marginBottom: 0 }}>{`${titlePrimary || 'Simulazione'} ? ${titleSecondary || 'Statico Utente'}`}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ color: '#ccc', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={showPrimary} onChange={(e) => setShowPrimary(e.target.checked)} /> {titlePrimary || 'Simulazione'}
          </label>
          <label style={{ color: '#ccc', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={showSecondary} onChange={(e) => setShowSecondary(e.target.checked)} /> {titleSecondary || 'Statico Utente'}
          </label>
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: `${HEIGHT}px`, display: 'block', margin: '0 auto' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {yTicks.map((v, i) => (<line key={i} x1={leftGutter} x2={WIDTH - RIGHT_MARGIN} y1={getY(v)} y2={getY(v)} stroke="#2d2d2d" strokeDasharray="3 3" />))}
        {showPrimary && <path d={primaryPath} fill="none" stroke={primaryColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
        {showPrimary && <path d={primaryInvestedPath} fill="none" stroke={primaryColor} strokeDasharray="5 5" strokeWidth="2.2" opacity="0.9" />}
        {showSecondary && secondaryPath && <path d={secondaryPath} fill="none" stroke={secondaryColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
        {showSecondary && secondaryInvestedPath && <path d={secondaryInvestedPath} fill="none" stroke={secondaryColor} strokeDasharray="5 5" strokeWidth="2.2" opacity="0.9" />}
        {yTicks.map((labelValue, i) => (<text key={i} x={leftGutter - 12} y={getY(labelValue) + 5} textAnchor="end" fontSize="12" fill="#999">{formatMoney(labelValue)}</text>))}
        {Array.from(new Set([0, Math.floor((nx - 1) * 0.25), Math.floor((nx - 1) * 0.5), Math.floor((nx - 1) * 0.75), nx - 1])).map((idx) => (
          <text key={idx} x={leftGutter + idx * (innerWidth) / Math.max(1, (nx - 1))} y={HEIGHT - BOTTOM_MARGIN + 22} textAnchor="middle" fontSize="12" fill="#999">{formatDate(datesForLabels[idx])}</text>
        ))}
        <line x1={leftGutter} x2={leftGutter} y1={TOP_MARGIN - 6} y2={HEIGHT - BOTTOM_MARGIN} stroke="#444" />
        {localHover && (
          <>
            <line x1={localHover.x} x2={localHover.x} y1={TOP_MARGIN} y2={HEIGHT - BOTTOM_MARGIN} stroke="#888" strokeWidth="1" strokeDasharray="4 4" opacity="0.85" />
            {localHover.idxPrimary != null && showPrimary && (<circle cx={getXPrimary(localHover.idxPrimary)} cy={getY(localHover.primaryValue)} r="5" fill={primaryColor} stroke="#fff" strokeWidth="1.2" />)}
            {localHover.idxSecondary != null && secondaryValues.length > 0 && showSecondary && (<circle cx={getXSecondary(localHover.idxSecondary)} cy={getY(localHover.secondaryValue)} r="5" fill={secondaryColor} stroke="#fff" strokeWidth="1.2" />)}
          </>
        )}
      </svg>

      <div className="chart-controls" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
        <button className="btn" style={{ ...styles.buttonBase, padding: '8px 12px', fontSize: 13 }} onClick={() => downloadSvgAsPng(svgRef.current, 'combined-portfolio.png')}>Scarica PNG</button>
        <button className="btn" style={{ ...styles.buttonBase, padding: '8px 12px', fontSize: 13, background: '#333', color: '#fff' }} onClick={() => {
          const maxLen = Math.max(primaryChart.length, secondaryChart.length);
          const rows = [];
          for (let i = 0; i < maxLen; i++) {
            const p = primaryChart[i] || {};
            const s = secondaryChart[i] || {};
            rows.push({
              DatePrimary: p.Date ?? '',
              ValuePrimary: p.Value ?? '',
              InvestedPrimary: p.TotalInvested ?? p.Total_invested ?? '',
              DateSecondary: s.Date ?? '',
              ValueSecondary: s.Value ?? '',
              InvestedSecondary: s.TotalInvested ?? s.Total_invested ?? ''
            });
          }
          exportCsvFromChartData(rows, 'combined-portfolio.csv');
        }}>Esporta CSV</button>
      </div>
    </div>
  );
};

// DrawdownChart (kept largely the same but responsive and with tooltip render)
const DrawdownChart = ({ chartData, summary }) => {
  const containerRef = useRef(null);
  const { width: wrapperWidth } = useResizeObserver(containerRef);
  const computedWidth = Math.round(wrapperWidth || 700);
  const WIDTH = Math.max(520, Math.min(1100, computedWidth));
  const HEIGHT = Math.round(WIDTH * 0.5);
  const RIGHT_MARGIN = 48;
  const TOP_MARGIN = 48;
  const BOTTOM_MARGIN = 70;

  if (!chartData || chartData.length < 2) return <p style={{ color: '#ef5350', fontSize: '14px', marginTop: '10px' }}>Dati insufficienti per calcolare la serie storica.</p>;

  let peakValue = -Infinity;
  const dailyDrawdownData = chartData.map((d) => {
    const v = Number(d.Value ?? d.value ?? 0);
    if (v > peakValue) peakValue = v;
    const drawdown = (v / peakValue - 1) * 100;
    return { Date: d.Date, Drawdown: drawdown, Value: v, PeakValue: peakValue };
  });

  const maxDrawdownSummary = Number(summary?.max_drawdown ?? 0);
  if (Math.abs(maxDrawdownSummary) < 0.1) return <p style={{ color: '#66bb6a', fontSize: '14px', marginTop: '10px' }}>Nessun drawdown significativo registrato nel periodo di backtest.</p>;

  const troughEntry = dailyDrawdownData.find(d => Math.abs(d.Drawdown - maxDrawdownSummary) < 0.001) || dailyDrawdownData.reduce((acc, cur) => cur.Drawdown < (acc?.Drawdown ?? 0) ? cur : acc, null);
  if (!troughEntry) return null;

  let peakIndex = 0;
  for (let i = dailyDrawdownData.indexOf(troughEntry); i >= 0; i--) {
    if (dailyDrawdownData[i].Value >= troughEntry.PeakValue * 0.99999) { peakIndex = i; break; }
  }

  let recoveryIndex = -1; let isRecovered = false;
  for (let i = dailyDrawdownData.indexOf(troughEntry); i < dailyDrawdownData.length; i++) {
    if (dailyDrawdownData[i].Drawdown >= -0.01) { recoveryIndex = i; isRecovered = true; break; }
  }

  const endIndex = recoveryIndex !== -1 ? recoveryIndex : dailyDrawdownData.length - 1;
  const relevantData = dailyDrawdownData.slice(peakIndex, endIndex + 1);
  if (relevantData.length < 2) return <p style={{ color: '#ef5350', fontSize: '14px', marginTop: '10px' }}>L'evento di drawdown ? troppo corto per essere visualizzato correttamente.</p>;

  const drawdownValues = relevantData.map(d => d.Drawdown);
  const minDrawdown = Math.min(...drawdownValues);
  const maxDrawdown = 0;

  const desiredTicks = 5;
  const yTickValuesRaw = niceTicks(minDrawdown, maxDrawdown, desiredTicks);
  const yTicks = Array.from(new Set([...yTickValuesRaw, 0])).sort((a, b) => a - b);

  const yLabelStrings = yTicks.map(v => `${v.toFixed(1)}%`);
  const maxYLabelWidth = Math.max(...yLabelStrings.map(s => estimateTextWidth(s, 12)));
  const leftGutter = Math.max(56, maxYLabelWidth + 20);

  const innerWidth = WIDTH - leftGutter - RIGHT_MARGIN;
  const innerHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

  const getX = (index) => leftGutter + index * (innerWidth) / Math.max(1, (relevantData.length - 1));
  const getY = (draw) => {
    const normalized = (draw - minDrawdown) / (maxDrawdown - minDrawdown || 1);
    return TOP_MARGIN + (1 - normalized) * innerHeight;
  };

  const drawdownPath = drawdownValues.map((dd, i) => {
    const x = getX(i);
    const y = getY(dd);
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  const troughPointIndex = drawdownValues.findIndex(v => v === minDrawdown);
  const troughX = getX(troughPointIndex);
  const troughY = getY(minDrawdown);

  const [hoverData, setHoverData] = useState(null);

  const handleMouseMoveD = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    if (mouseX < leftGutter || mouseX > WIDTH - RIGHT_MARGIN) { setHoverData(null); return; }
    const chartWidth = innerWidth;
    const step = chartWidth / (relevantData.length - 1);
    const idx = Math.round((mouseX - leftGutter) / step);
    if (idx >= 0 && idx < relevantData.length) {
      const d = relevantData[idx];
      setHoverData({
        Drawdown: d.Drawdown,
        Date: d.Date,
        x: getX(idx),
        y: getY(d.Drawdown),
        idx,
        rect
      });
    } else setHoverData(null);
  };
  const handleMouseLeaveD = () => setHoverData(null);

  const renderTooltip = () => {
    if (!hoverData || !containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const leftPxRaw = (hoverData.x / WIDTH) * rect.width;
    const topPxRaw = (hoverData.y / HEIGHT) * rect.height;
    const dateLabel = formatDate(hoverData.Date, { shortYear: true });
    const drawLabel = `${hoverData.Drawdown.toFixed(2)}%`;
    const fontSize = 12;
    const estDate = estimateTextWidth(dateLabel, fontSize);
    const estDraw = estimateTextWidth(drawLabel, fontSize);
    const contentMax = Math.max(estDate, estDraw);
    const horizontalPadding = 20;
    const BOX_WIDTH = Math.min(Math.max(120, contentMax + horizontalPadding), Math.min(360, rect.width * 0.6));
    const lineHeight = 18;
    const BOX_HEIGHT = 10 + 2 * lineHeight;
    const offsetFromPoint = 8;
    let left = leftPxRaw - BOX_WIDTH / 2;
    left = Math.max(8, Math.min(rect.width - BOX_WIDTH - 8, left));
    let top = topPxRaw - BOX_HEIGHT - offsetFromPoint;
    if (top < TOP_MARGIN * 0.4) {
      top = topPxRaw + offsetFromPoint;
      if (top + BOX_HEIGHT > rect.height - 8) top = Math.max(8, rect.height - BOX_HEIGHT - 8);
    }
    const tooltipStyle = {
      position: 'absolute',
      left: left,
      top: top,
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
      background: 'linear-gradient(180deg,#151515,#1e1e1e)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
      padding: '8px 10px',
      borderRadius: 8,
      color: '#e6e6e6',
      zIndex: 9999,
      pointerEvents: 'none',
      fontSize: 12,
      lineHeight: '16px'
    };
    return (
      <div style={tooltipStyle}>
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{dateLabel}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ color: '#ef5350', fontWeight: 700 }}>Drawdown</div>
          <div style={{ color: '#ddd', fontWeight: 700 }}>{drawLabel}</div>
        </div>
      </div>
    );
  };

  const nx = relevantData.length;
  const xFrac = [0, 0.25, 0.5, 0.75, 1];
  const xLabelIndices = xFrac.map(f => Math.round(f * (nx - 1))).map(i => Math.max(0, Math.min(nx - 1, i)));
  const candidateXLabels = Array.from(new Set(xLabelIndices)).map(i => ({ index: i, label: formatDate(relevantData[i].Date, { shortYear: true }), x: getX(i) }));

  const containerRect = containerRef.current ? containerRef.current.getBoundingClientRect() : null;
  const scaleX = containerRect ? (containerRect.width / WIDTH) : 1;
  const visibleXLabels = (() => {
    if (!containerRect) return candidateXLabels;
    const paddingPx = 8;
    const chosen = [];
    let lastPx = -Infinity;
    for (const lbl of candidateXLabels) {
      const px = lbl.x * scaleX;
      const w = estimateTextWidth(lbl.label, 12);
      if (chosen.length === 0 || px - lastPx > (w + paddingPx)) {
        chosen.push(lbl);
        lastPx = px;
      }
    }
    if (candidateXLabels.length > 1 && chosen.length > 0) {
      const first = candidateXLabels[0];
      const last = candidateXLabels[candidateXLabels.length - 1];
      if (!chosen.find(c => c.index === first.index)) chosen.unshift(first);
      if (!chosen.find(c => c.index === last.index)) chosen.push(last);
      const unique = Array.from(new Map(chosen.map(c => [c.index, c])).values()).sort((a, b) => a.index - b.index);
      return unique;
    }
    return chosen;
  })();

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: `${HEIGHT}px`, overflow: 'visible', display: 'block', margin: '0 auto' }} onMouseMove={handleMouseMoveD} onMouseLeave={handleMouseLeaveD}>
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} rx={10} fill="#1e1e1e" />
        {yTicks.map((v, i) => (<line key={i} x1={leftGutter} x2={WIDTH - RIGHT_MARGIN} y1={getY(v)} y2={getY(v)} stroke="#2d2d2d" strokeDasharray="3 3" />))}
        <line x1={leftGutter} x2={WIDTH - RIGHT_MARGIN} y1={getY(0)} y2={getY(0)} stroke="#66bb6a" strokeWidth="1" strokeDasharray="4 2" />
        <path d={drawdownPath} fill="none" stroke="#ef5350" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={troughX} cy={troughY} r="4" fill="#ef5350" stroke="#fff" strokeWidth="1.2" />
        {isRecovered && (<circle cx={getX(relevantData.length - 1)} cy={getY(relevantData[relevantData.length - 1].Drawdown)} r="4" fill="#1e88e5" stroke="#fff" strokeWidth="1.2" />)}
        {yTicks.map((labelValue, i) => {
          const fill = labelValue >= 0 ? '#66bb6a' : '#ef5350';
          return <text key={i} x={leftGutter - 12} y={getY(labelValue) + 5} textAnchor="end" fontSize="12" fill={fill}>{labelValue.toFixed(1)}%</text>;
        })}

        {visibleXLabels.map(({ index, label }, i) => (
          <text key={index} x={getX(index)} y={HEIGHT - 5} textAnchor={i === 0 ? 'start' : (i === visibleXLabels.length - 1 ? 'end' : 'middle')} fontSize="12" fill="#999">
            {label}
          </text>
        ))}

        <line x1={leftGutter} x2={leftGutter} y1={TOP_MARGIN - 6} y2={HEIGHT - BOTTOM_MARGIN} stroke="#444" />
        {hoverData && (
          <>

            <line x1={hoverData.x} x2={hoverData.x} y1={TOP_MARGIN} y2={HEIGHT - BOTTOM_MARGIN} stroke="#ffffff" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.6" />
            <circle cx={hoverData.x} cy={hoverData.y} r="5" fill="#1e88e5" stroke="#fff" strokeWidth="1.2" />
          </>
        )}
      </svg>
      {renderTooltip()}
    </div>
  );
};

// --- EfficientFrontierInline, ExtremePerformanceHistogram, TickerSearch, buildAssetsPayloadFromPortfolioWeights ---
// These components and helpers are preserved from your original file with minimal additions: className="panel" on wrappers where appropriate.
// For brevity I'll include them fully (kept logically identical to your provided full version, only adding className where applicable).

// EfficientFrontierInline (kept full)
const EfficientFrontierInline = ({ frontierData, onSimulate, simulatedBacktestResults, renderSummaryContent, backtestResults }) => {
  if (!frontierData) return null;

  const riskFree = frontierData.risk_free_rate_percent ?? 0;

  const WIDTH_DEFAULT = 1100;
  const HEIGHT_DEFAULT = 520;
  const MARGIN = 50;

  const toCompositionObjectFromArray = (arr) => {
    if (!Array.isArray(arr)) return null;
    const obj = {};
    for (const it of arr) {
      if (!it || !it.ticker) continue;
      const w = Number(it.weight || 0);
      obj[it.ticker] = w > 1 ? w : Number((w * 100).toFixed(6));
    }
    Object.keys(obj).forEach(k => obj[k] = Number(obj[k]));
    return obj;
  };

  const compositionSum = (comp) => {
    if (!comp || typeof comp !== 'object') return 0;
    return Object.values(comp).reduce((s, v) => s + (Number(v) || 0), 0);
  };

  const isFullyInvested = (comp) => {
    const sum = compositionSum(comp);
    return sum > 99.5 && sum < 100.5;
  };

  const {
    simsNormalized,
    minX, maxX, minY, maxY,
    getX, getY,
    highlightPoints,
    extraPoints,
    renderedPoints,
    extraCount
  } = useMemo(() => {
    const sims = frontierData.simulated_portfolios || [];
    const simsNorm = sims.map((s, idx) => {
      const vol = (typeof s.Volatility === 'number') ? s.Volatility : parseFloat(s.Volatility) || 0;
      const ret = (typeof s.Return === 'number') ? s.Return : parseFloat(s.Return) || 0;
      const sharpe = (typeof s.Sarpe === 'number') ? s.Sarpe : (vol !== 0 ? (ret - riskFree) / vol : 0);
      return { ...s, Volatility: vol, Return: ret, Sharpe: sharpe, _simIndex: idx };
    });

    const allVol = simsNorm.map(d => d.Volatility);
    const allRet = simsNorm.map(d => d.Return);
    const _minX = Math.min(...allVol, 0);
    const _maxX = Math.max(...allVol, 1);
    const _minY = Math.min(...allRet, 0);
    const _maxY = Math.max(...allRet, 1);

    const _getX = (vol) => MARGIN + ((vol - _minX) / (_maxX - _minX || 1)) * (WIDTH_DEFAULT - 2 * MARGIN);
    const _getY = (ret) => HEIGHT_DEFAULT - MARGIN - ((ret - _minY) / (_maxY - _minY || 1)) * (HEIGHT_DEFAULT - 2 * MARGIN);

    const readVol = (p) => p?.annual_volatility ?? p?.Volatility ?? p?.annual_volatility_percent ?? 0;
    const readRet = (p) => p?.cagr_approx ?? p?.Return ?? 0;

    const COLOR_MAX_SHARPE = '#1e88e5';
    const COLOR_MIN_VOL = '#66bb6a';
    const COLOR_MAX_RETURN = '#d32f2f';
    const COLOR_USER = '#ffb300';
    const COLOR_EXTRA = '#90caf9';

    const hp = [];
    const maxSharpe = frontierData.max_sharpe_portfolio || null;
    const minVol = frontierData.min_volatility_portfolio || null;
    const maxReturn = frontierData.max_return_portfolio || null;
    const userPoint = frontierData.user_portfolio_point || null;

    const maxSharpeComp = maxSharpe?.weights ? (typeof maxSharpe.weights === 'object' ? maxSharpe.weights : null) : null;
    const minVolComp = minVol?.weights ? (typeof minVol.weights === 'object' ? minVol.weights : null) : null;
    const maxReturnComp = maxReturn?.weights ? (typeof maxReturn.weights === 'object' ? maxReturn.weights : null) : null;

    if (maxSharpe) hp.push({ v: readVol(maxSharpe), r: readRet(maxSharpe), label: 'Max Sharpe', color: COLOR_MAX_SHARPE, meta: maxSharpe, composition: maxSharpeComp });
    if (minVol) hp.push({ v: readVol(minVol), r: readRet(minVol), label: 'Min Vol', color: COLOR_MIN_VOL, meta: minVol, composition: minVolComp });
    if (maxReturn) hp.push({ v: readVol(maxReturn), r: readRet(maxReturn), label: 'Max Return', color: COLOR_MAX_RETURN, meta: maxReturn, composition: maxReturnComp });

    let userComposition = null;
    if (frontierData.static_weights && Array.isArray(frontierData.static_weights)) {
      userComposition = toCompositionObjectFromArray(frontierData.static_weights);
    } else if (frontierData.static_weights_percent && Array.isArray(frontierData.static_weights_percent)) {
      const obj = {};
      frontierData.static_weights_percent.forEach(s => { if (s && s.ticker) obj[s.ticker] = Number(s.weight); });
      userComposition = obj;
    } else {
      userComposition = null;
    }

    if (userPoint) hp.push({ v: userPoint.Volatility ?? 0, r: userPoint.Return ?? 0, label: 'Tuo Statico', color: COLOR_USER, meta: userPoint, composition: userComposition });

    const desiredExtra = 70;
    let extras = [];

    function clamp(val, lo, hi) { return Math.max(lo, Math.min(hi, val)); }
    function gaussianRandom() {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    const simsWithComp = [];
    sims.forEach((s) => {
      const possible = s.weights || s.composition || s.allocation || s.static_weights || s.portfolio_weights || null;
      if (possible && typeof possible === 'object') {
        const comp = {};
        if (Array.isArray(possible)) {
          possible.forEach(it => {
            const t = it.ticker || it.symbol;
            const w = Number(it.weight ?? it.weight_percent ?? it.pct ?? it.percent ?? it.value);
            if (t && !isNaN(w)) comp[t] = w > 1 ? w : (w * 100);
          });
        } else {
          Object.entries(possible).forEach(([k, v]) => {
            const n = Number(v);
            if (!isNaN(n)) comp[k] = n > 1 ? n : (n * 100);
          });
        }
        const sum = Object.values(comp).reduce((a, b) => a + b, 0) || 0;
        if (sum > 0) {
          Object.keys(comp).forEach(k => comp[k] = Number(((comp[k] / sum) * 100).toFixed(6)));
          if (isFullyInvested(comp)) {
            simsWithComp.push({ Volatility: s.Volatility ?? s.annual_volatility ?? 0, Return: s.Return ?? s.cagr_approx ?? 0, Sharpe: s.Sharpe ?? null, composition: comp });
          }
        }
      }
    });

    if (simsWithComp.length >= desiredExtra) {
      extras = simsWithComp.slice(0, desiredExtra).map(s => ({ Volatility: s.Volatility, Return: s.Return, Sharpe: s.Sharpe, composition: s.composition || null }));
    } else {
      extras = simsWithComp.map(s => ({ Volatility: s.Volatility, Return: s.Return, Sharpe: s.Sharpe, composition: s.composition || null }));

      if (hp.length >= 2) {
        const volRange = Math.max(1e-6, _maxX - _minX);
        const retRange = Math.max(1e-6, _maxY - _minY);

        for (let i = 0; i < desiredExtra && extras.length < desiredExtra; i++) {
          let takeCountProb = Math.random();
          let takeCount;
          if (takeCountProb < 0.35) takeCount = 2;
          else if (takeCountProb < 0.8) takeCount = Math.min(3, hp.length);
          else takeCount = Math.min(4, hp.length);

          const indices = [];
          while (indices.length < takeCount) {
            const idx = Math.floor(Math.random() * hp.length);
            if (!indices.includes(idx)) indices.push(idx);
          }

          let weights = indices.map(() => Math.random());
          const sumW = weights.reduce((a, b) => a + b, 0) || 1;
          weights = weights.map(w => w / sumW);

          let vol = 0, ret = 0;
          indices.forEach((idx, k) => {
            vol += hp[idx].v * weights[k];
            ret += hp[idx].r * weights[k];
          });

          const jitterVolFactor = 0.03 + Math.random() * 0.05;
          const jitterRetFactor = 0.03 + Math.random() * 0.05;
          const volJitter = gaussianRandom() * volRange * jitterVolFactor;
          const retJitter = gaussianRandom() * retRange * jitterRetFactor;

          vol = clamp(vol + volJitter, _minX, _maxX);
          ret = clamp(ret + retJitter, _minY, _maxY);

          let composition = null;
          const allHaveComp = indices.every(idx => hp[idx].composition && typeof hp[idx].composition === 'object');
          if (allHaveComp) {
            const combined = {};
            indices.forEach((idx, k) => {
              const anchorComp = hp[idx].composition;
              const anchorWeightFactor = weights[k];
              Object.entries(anchorComp).forEach(([tkr, pct]) => {
                const frac = (Number(pct) / 100) * anchorWeightFactor;
                combined[tkr] = (combined[tkr] || 0) + frac;
              });
            });
            const sumFrac = Object.values(combined).reduce((a, b) => a + b, 0) || 1;
            composition = {};
            Object.entries(combined).forEach(([tkr, frac]) => {
              composition[tkr] = Number(((frac / sumFrac) * 100).toFixed(6));
            });
          }

          if (composition && isFullyInvested(composition)) {
            extras.push({ Volatility: vol, Return: ret, Sharpe: vol !== 0 ? (ret - riskFree) / vol : 0, composition });
          }
        }
      }
    }

    const epsilon = 1e-8;
    const filtered = extras.filter(p => !hp.some(h => Math.abs(h.v - p.Volatility) < epsilon && Math.abs(h.r - p.Return) < epsilon));
    extras = filtered.slice(0, desiredExtra);

    const rp = [];
    extras.forEach((p, i) => {
      if (!p.composition || !isFullyInvested(p.composition)) return;
      const x = _getX(p.Volatility);
      const y = _getY(p.Return);
      rp.push({ id: `extra-${i}`, type: 'extra', idx: i, Volatility: p.Volatility, Return: p.Return, Sharpe: p.Sharpe, x, y, color: COLOR_EXTRA, label: null, composition: p.composition || null });
    });
    hp.forEach((h, i) => {
      const x = _getX(h.v);
      const y = _getY(h.r);
      const composition = (h.composition && typeof h.composition === 'object') ? h.composition : null;
      if (composition && isFullyInvested(composition)) {
        rp.push({ id: `highlight-${i}`, type: 'highlight', idx: i, Volatility: h.v, Return: h.r, Sharpe: h.meta?.Sharpe ?? null, x, y, color: h.color, label: h.label, composition });
      }
    });

    return {
      simsNormalized: simsNorm,
      minX: _minX, maxX: _maxX, minY: _minY, maxY: _maxY,
      getX: _getX, getY: _getY,
      highlightPoints: hp,
      extraPoints: extras,
      renderedPoints: rp,
      extraCount: extras.length
    };
  }, [frontierData, riskFree]);

  const svgRefF = useRef(null);
  const containerRefF = useRef(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const handleMouseMoveF = (e) => {
    if (!svgRefF.current || !containerRefF.current) return;
    const rect = svgRefF.current.getBoundingClientRect();
    const scaleX = WIDTH_DEFAULT / rect.width;
    const scaleY = HEIGHT_DEFAULT / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    let nearest = null;
    let minDist = Infinity;
    for (const p of renderedPoints) {
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; nearest = p; }
    }

    const threshold = 12;
    if (nearest && minDist <= threshold) {
      setHoverPoint({ ...nearest, distance: minDist, clientX: e.clientX, clientY: e.clientY });
    } else {
      setHoverPoint(null);
    }
  };

  const handleMouseLeaveF = () => setHoverPoint(null);

  const handlePointClickF = (p) => {
    if (!p) return;
    if (selectedPoint && selectedPoint.id === p.id) setSelectedPoint(null);
    else setSelectedPoint(p);
  };

  const renderJsonTooltip = (p) => {
    if (!p || !containerRefF.current) return null;
    const containerRect = containerRefF.current.getBoundingClientRect();
    const compList = p.composition ? Object.entries(p.composition) : [];
    const baseText = p.label || (p.type === 'extra' ? 'Portafoglio (In-between)' : 'Portafoglio evidenziato');
    const baseWidth = estimateTextWidth(baseText, 13);
    const compWidth = compList.length > 0 ? Math.max(...compList.map(([tkr, pct]) => estimateTextWidth(`${tkr} ${Number(pct).toFixed(2)}%`, 12)), 0) : 0;
    const tooltipWidth = Math.min(380, Math.max(140, Math.max(baseWidth, compWidth) + 30));
    const approxHeight = 70 + compList.length * 18;
    const spaceAbove = p.clientY - containerRect.top;
    const spaceBelow = containerRect.bottom - p.clientY;
    const placeBelow = spaceAbove < approxHeight && spaceBelow > approxHeight;
    let left = p.clientX - containerRect.left + 12;
    let top = placeBelow ? (p.clientY - containerRect.top + 12) : (p.clientY - containerRect.top - approxHeight - 12);
    if (left + tooltipWidth > containerRect.width - 8) left = Math.max(8, containerRect.width - tooltipWidth - 8);
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    if (top + approxHeight > containerRect.height - 8) top = Math.max(8, containerRect.height - approxHeight - 8);
    const boxStyle = {
      position: 'absolute',
      left,
      top,
      width: tooltipWidth,
      background: 'linear-gradient(180deg,#151515,#1e1e1e)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
      padding: '10px',
      borderRadius: 8,
      color: '#e6e6e6',
      zIndex: 9999,
      pointerEvents: 'none',
      fontSize: 12,
      lineHeight: '16px'
    };
    const labelStyle = { fontWeight: 700, color: '#fff', marginBottom: 6, display: 'block' };
    return (
      <div style={boxStyle}>
        <div style={labelStyle}>{baseText}</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 6, color: '#cfcfcf' }}>
          <div><span style={{ color: '#9fdbb7', fontWeight: 700 }}>{p.Return.toFixed(2)}%</span> <span style={{ color: '#999' }}>Rend.</span></div>
          <div><span style={{ color: '#ffd37a', fontWeight: 700 }}>{p.Volatility.toFixed(2)}%</span> <span style={{ color: '#999' }}>Vol.</span></div>
          {typeof p.Sharpe === 'number' && !isNaN(p.Sharpe) && <div><span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 4, background: '#90caf9', color: '#0b0b0b', fontWeight: 700, fontSize: 11 }}>{p.Sharpe.toFixed(2)}</span> <span style={{ color: '#999' }}>Sharpe</span></div>}
        </div>
        {compList.length > 0 ? (
          <div style={{ maxHeight: 160, overflowY: 'auto', paddingRight: 6 }}>
            <div style={{ color: '#ddd', fontWeight: 700, marginBottom: 6 }}>Composizione</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {compList.map(([tkr, pct]) => (
                <li key={tkr} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed rgba(255,255,255,0.02)' }}>
                  <span style={{ color: '#fff' }}>{tkr}</span>
                  <span style={{ color: '#ccc', fontWeight: 700 }}>{Number(pct).toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (<div style={{ color: '#999' }}>Composizione non disponibile</div>)}
      </div>
    );
  };

  const renderSelectedCard = (p) => {
    if (!p) return null;
    const compList = p.composition ? Object.entries(p.composition) : [];
    const simulateDisabled = !p.composition || compList.length === 0 || typeof onSimulate !== 'function';
    return (
      <div style={{ ...styles.panel, marginTop: 18, borderLeft: '4px solid #ffd54f' }} className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ color: '#ffd54f', margin: 0 }}>{p.label || 'Portafoglio Selezionato'}</h4>
          <div>
            <button
              onClick={() => {
                if (simulateDisabled) return;
                const portfolioWeights = {};
                compList.forEach(([tkr, pct]) => { portfolioWeights[tkr] = Number(pct); });
                onSimulate && onSimulate(portfolioWeights, `Selezionato: ${p.label || p.id}`, p.id);
              }}
              disabled={simulateDisabled}
              style={{ ...styles.buttonBase, backgroundColor: simulateDisabled ? '#555' : '#1e88e5', color: '#fff', padding: '8px 12px', fontSize: 13 }}
            >
              {simulateDisabled ? 'Simula non disponibile' : 'Simula Backtest'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: '#cfcfcf' }}>
            <div><strong style={{ color: '#9fdbb7' }}>{p.Return.toFixed(2)}%</strong> <span style={{ color: '#999' }}>Rendimento</span></div>
            <div><strong style={{ color: '#ffd37a' }}>{p.Volatility.toFixed(2)}%</strong> <span style={{ color: '#999' }}>Vol.</span></div>
            {typeof p.Sharpe === 'number' && !isNaN(p.Sharpe) && <div><strong style={{ color: '#90caf9' }}>{p.Sharpe.toFixed(2)}</strong> <span style={{ color: '#999' }}>Sharpe</span></div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#ddd', fontWeight: 700, marginBottom: 6 }}>Composizione</div>
            {compList.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {compList.map(([tkr, pct]) => (
                  <li key={tkr} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#fff' }}>{tkr}</span>
                    <span style={{ color: '#ccc', fontWeight: 700 }}>{Number(pct).toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            ) : (<div style={{ color: '#999' }}>Composizione non disponibile per questo punto.</div>)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ ...styles.panel, marginTop: 30, padding: 20, position: 'relative' }} className="panel">
      <h3 style={{ color: '#fff', textAlign: 'center', borderBottom: '1px dashed #333', paddingBottom: 12 }}>Frontiera Efficiente ? Scatter interattivo</h3>

      <div ref={containerRefF} style={{ width: '100%' }}>
        <svg ref={svgRefF} viewBox={`0 0 ${WIDTH_DEFAULT} ${HEIGHT_DEFAULT}`} style={{ width: '100%', height: `${Math.round(WIDTH_DEFAULT * 0.47)}px`, display: 'block', margin: '0 auto', cursor: hoverPoint ? 'pointer' : 'default' }} onMouseMove={handleMouseMoveF} onMouseLeave={handleMouseLeaveF}>
          <line x1={MARGIN} x2={MARGIN} y1={MARGIN} y2={HEIGHT_DEFAULT - MARGIN} stroke="#444" />
          <line x1={MARGIN} x2={WIDTH_DEFAULT - MARGIN} y1={HEIGHT_DEFAULT - MARGIN} y2={HEIGHT_DEFAULT - MARGIN} stroke="#444" />
          <text x={WIDTH_DEFAULT / 2} y={HEIGHT_DEFAULT} textAnchor="middle" fontSize="12" fill="#999">Volatilit? (%)</text>
          <text x={12} y={HEIGHT_DEFAULT / 2} transform={`rotate(-90 12 ${HEIGHT_DEFAULT / 2})`} textAnchor="middle" fontSize="12" fill="#999">Rendimento (%)</text>

          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const x = MARGIN + t * (WIDTH_DEFAULT - 2 * MARGIN);
            const y = MARGIN + t * (HEIGHT_DEFAULT - 2 * MARGIN);
            const volVal = (minX + t * (maxX - minX)).toFixed(2);
            const retVal = (minY + (1 - t) * (maxY - minY)).toFixed(2);
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={MARGIN} y2={HEIGHT_DEFAULT - MARGIN} stroke="#2a2a2a" strokeDasharray="3 3" />
                <line x1={MARGIN} x2={WIDTH_DEFAULT - MARGIN} y1={y} y2={y} stroke="#2a2a2a" strokeDasharray="3 3" />
                {i === 0 || i === 4 ? null : <text x={x} y={HEIGHT_DEFAULT - MARGIN + 16} textAnchor="middle" fontSize="12" fill="#777">{volVal}</text>}
                {i === 0 || i === 4 ? null : <text x={MARGIN - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#777">{retVal}</text>}
              </g>
            );
          })}

          {renderedPoints.filter(p => p.type === 'extra').map((p) => {
            const isHovered = hoverPoint && hoverPoint.id === p.id;
            const isSelected = selectedPoint && selectedPoint.id === p.id;
            const r = isSelected ? 7 : (isHovered ? 6 : 4);
            const opacity = isSelected ? 1 : (isHovered ? 1 : (hoverPoint ? 0.35 : 0.95));
            return (
              <circle key={p.id} cx={p.x} cy={p.y} r={r} fill={p.color} opacity={opacity} stroke={isSelected ? '#ffd54f' : '#222'} strokeWidth={isSelected ? 1.5 : 0.6} style={{ cursor: 'pointer' }} onClick={() => handlePointClickF(p)} />
            );
          })}

          {renderedPoints.filter(p => p.type === 'highlight').map((p) => {
            const isHovered = hoverPoint && hoverPoint.id === p.id;
            const isSelected = selectedPoint && selectedPoint.id === p.id;
            const r = isSelected ? 12 : (isHovered ? 10 : 7);
            const strokeWidth = isSelected ? 2 : (isHovered ? 1.5 : 1);
            const textX = p.x + 12;
            const textY = p.y - 10;
            const opacity = isSelected ? 1 : (hoverPoint ? 0.95 : 1);
            return (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r={r} fill={p.color} stroke={isSelected ? '#ffd54f' : '#fff'} strokeWidth={strokeWidth} opacity={opacity} style={{ cursor: 'pointer' }} onClick={() => handlePointClickF(p)} />
                <text x={textX} y={textY} fontSize="11" fill={p.color}>{p.label}</text>
              </g>
            );
          })}

          {hoverPoint && (
            <g>
              <line x1={hoverPoint.x} x2={hoverPoint.x} y1={MARGIN} y2={HEIGHT_DEFAULT - MARGIN} stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
              <line x1={MARGIN} x2={WIDTH_DEFAULT - MARGIN} y1={hoverPoint.y} y2={hoverPoint.y} stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
            </g>
          )}
        </svg>

        {hoverPoint && renderJsonTooltip(hoverPoint)}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
          <div style={{ color: '#ccc', fontSize: '12px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#90caf9' }} />{extraCount} in-between</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#1e88e5' }} />Max Sharpe</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#66bb6a' }} />Min Vol</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#d32f2f' }} />Max Return</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ffb300' }} />Totale Investito</span>
          </div>
          <div style={{ color: '#999', fontSize: '12px' }}>Muovi il cursore sul grafico per evidenziare i punti, clicca per selezionarli.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 18 }}>
          {frontierData.max_sharpe_portfolio && (
            <div style={{ ...styles.panel, borderLeft: `4px solid #1e88e5` }} className="panel">
              <h4 style={{ color: '#1e88e5' }}>Massimo Sharpe</h4>
              <div>Rendimento: {(frontierData.max_sharpe_portfolio.cagr_approx ?? frontierData.max_sharpe_portfolio.Return ?? 0).toFixed(2)}%</div>
              <div>Volatilit?: {(frontierData.max_sharpe_portfolio.annual_volatility ?? frontierData.max_sharpe_portfolio.Volatility ?? 0).toFixed(2)}%</div>
              <div>Sharpe: {(frontierData.max_sharpe_portfolio.sharpe_ratio ?? frontierData.max_sharpe_portfolio.Sharpe ?? 0).toFixed(2)}</div>
            </div>
          )}
          {frontierData.max_return_portfolio && (
            <div style={{ ...styles.panel, borderLeft: `4px solid #d32f2f` }} className="panel">
              <h4 style={{ color: '#d32f2f' }}>Massimo Rendimento</h4>
              <div>Rendimento: {(frontierData.max_return_portfolio.cagr_approx ?? frontierData.max_return_portfolio.Return ?? 0).toFixed(2)}%</div>
              <div>Volatilit?: {(frontierData.max_return_portfolio.annual_volatility ?? frontierData.max_return_portfolio.Volatility ?? 0)}</div>
              <div>Sharpe: {(frontierData.max_return_portfolio.sharpe_ratio ?? frontierData.max_return_portfolio.Sharpe ?? 0).toFixed(2)}</div>
            </div>
          )}
          {frontierData.min_volatility_portfolio && (
            <div style={{ ...styles.panel, borderLeft: `4px solid #66bb6a` }} className="panel">
              <h4 style={{ color: '#66bb6a' }}>Minima Volatilit?</h4>
              <div>Rendimento: {(frontierData.min_volatility_portfolio.cagr_approx ?? frontierData.min_volatility_portfolio.Return ?? 0).toFixed(2)}%</div>
              <div>Volatilit?: {(frontierData.min_volatility_portfolio.annual_volatility ?? frontierData.min_volatility_portfolio.Volatility ?? 0).toFixed(2)}%</div>
              <div>Sharpe: {(frontierData.min_volatility_portfolio.sharpe_ratio ?? frontierData.min_volatility_portfolio.Sharpe ?? 0).toFixed(2)}</div>
            </div>
          )}
          {frontierData.user_portfolio_point && (
            <div style={{ ...styles.panel, borderLeft: `4px solid #ffb300` }} className="panel">
              <h4 style={{ color: '#ffb300' }}>Il tuo Statico</h4>
              <div>Rendimento: {(frontierData.user_portfolio_point.Return ?? frontierData.user_portfolio_point.cagr_approx ?? 0).toFixed(2)}%</div>
              <div>Volatilit?: {(frontierData.user_portfolio_point.Volatility ?? frontierData.user_portfolio_point.annual_volatility ?? 0).toFixed(2)}</div>
              <div>Sharpe: {(frontierData.user_portfolio_point.Sharpe ?? frontierData.user_portfolio_point.sharpe_ratio ?? 0).toFixed(2)}</div>
            </div>
          )}
        </div>

        {selectedPoint && renderSelectedCard(selectedPoint)}

        {selectedPoint && simulatedBacktestResults && simulatedBacktestResults.point_id && selectedPoint.id && simulatedBacktestResults.point_id === selectedPoint.id && (
          <div style={{ marginTop: 16 }}>
            { backtestResults ? (
              <>
                <CombinedPortfolioChart
                  primaryResult={simulatedBacktestResults}
                  secondaryResult={backtestResults}
                  titlePrimary={`Simulazione: ${simulatedBacktestResults.name || selectedPoint.id}`}
                  titleSecondary={'Risultati Backtest Statico Utente'}
                  onHover={() => {}}
                  primaryColor="#1e88e5"
                  secondaryColor="#ffb300"
                />
                <div style={{ display: 'flex', gap: 18, marginTop: 20 }}>
                  <div style={{ width: '50%', minWidth: 320 }}>
                    { typeof renderSummaryContent === 'function' ? renderSummaryContent(simulatedBacktestResults, `Simulazione: ${simulatedBacktestResults.name || selectedPoint.id}`, true, { hideChart: true }) : null }
                  </div>
                  <div style={{ width: '50%', minWidth: 320 }}>
                    { typeof renderSummaryContent === 'function' ? renderSummaryContent(backtestResults, 'Risultati Backtest Statico Utente', false, { hideChart: true }) : null }
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ width: '50%', minWidth: 320 }}>
                  { typeof renderSummaryContent === 'function' ? renderSummaryContent(simulatedBacktestResults, `Simulazione: ${simulatedBacktestResults.name || selectedPoint.id}`, true, { hideChart: true }) : null }
                </div>
                <div style={{ width: '50%', minWidth: 320 }}>
                  <div style={{ ...styles.panel, border: '1px dashed #444' }} className="panel">
                    <h4 style={{ color: '#ffb300' }}>Risultati Statico Mancanti</h4>
                    <p style={{ color: '#ccc' }}>Non sono presenti risultati del backtest statico. Esegui prima "Passo 1: Esegui Backtest Statico" per visualizzare il confronto lato destro.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- ExtremePerformanceHistogram (kept same) ---
const ExtremePerformanceHistogram = ({ summary, allAnnualReturns }) => {
  const annualReturns = allAnnualReturns;
  if (!annualReturns || !Array.isArray(annualReturns) || annualReturns.length === 0) {
    return (
      <div style={{ ...styles.panel, marginTop: 30, padding: 20 }} className="panel">
        <p style={{ color: '#ffb300', textAlign: 'center' }}>Nessun dato annuale disponibile per l'istogramma.</p>
      </div>
    );
  }

  const safeValue = (d) => {
    if (d == null) return 0;
    if (typeof d.return_percentage === 'number') return d.return_percentage;
    if (typeof d.return_percent === 'number') return d.return_percent;
    if (typeof d.return_percentage === 'string') {
      const p = parseFloat(d.return_percentage.replace(',', '.').replace('%', ''));
      if (!isNaN(p)) return p;
    }
    if (typeof d.return_percent === 'string') {
      const p = parseFloat(d.return_percent.replace(',', '.').replace('%', ''));
      if (!isNaN(p)) return p;
    }
    if (typeof d.return === 'number') return d.return;
    if (typeof d.value === 'number') return d.value;
    return 0;
  };

  const sortedReturns = [...annualReturns].sort((a, b) => safeValue(b) - safeValue(a));
  const top3_raw = sortedReturns.slice(0, 3);
  const top3_ordered = [top3_raw[2], top3_raw[1], top3_raw[0]].filter(Boolean);
  const bottom3_raw = sortedReturns.slice(-3);
  const bottom3_ordered = bottom3_raw.slice().reverse().filter(Boolean);
  const absValues = sortedReturns.map(d => Math.abs(safeValue(d)));
  const numericAbs = absValues.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
  const maxAbs = numericAbs.length > 0 ? Math.max(...numericAbs) : 10;
  const minMax = Math.max(maxAbs, 10);
  const scale = 100 / minMax;
  const getColor = (value) => (value >= 0 ? '#66bb6a' : '#ef5350');

  const renderBar = (data, idx) => {
    const val = safeValue(data);
    const heightPx = Math.max(10, Math.abs(val) * scale);
    const key = (data && data.year) ? `${data.year}-${val}` : `bar-${idx}`;
    return (
      <div key={key} style={{ flex: 1, textAlign: 'center', margin: '0 5px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '150px' }}>
        <div style={{ height: `${heightPx}px`, width: '100%', backgroundColor: getColor(val), borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transition: 'height 0.5s ease' }}>
          <span style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold', marginBottom: '2px', opacity: 0.95 }}>{val.toFixed(1)}%</span>
        </div>
        <div style={{ fontSize: '11px', color: '#ccc', marginTop: '5px', fontWeight: 'bold' }}>{data && data.year ? data.year : '-'}</div>
      </div>
    );
  };

  return (
    <div style={{ ...styles.panel, marginTop: 30, padding: 20 }} className="panel">
      <h3 style={{ color: '#fff', textAlign: 'center', borderBottom: '1px dashed #333', paddingBottom: 15 }}>Performance Estreme Annuali (Top 3 & Bottom 3)</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
        <div style={{ flex: 1, maxWidth: '450px', borderRight: '1px dashed #333', paddingRight: 15 }}>
          <h4 style={{ color: '#66bb6a', textAlign: 'center', marginBottom: 15 }}>Top 3 Rendimenti Migliori (Crescente)</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', borderBottom: '2px solid #333', padding: '0 10px' }}>{top3_ordered.map((d, i) => renderBar(d, i))}</div>
          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: 5 }}>Terzo Migliore | Secondo Migliore | Primo Migliore</div>
        </div>
        <div style={{ flex: 1, maxWidth: '450px', paddingLeft: 15 }}>
          <h4 style={{ color: '#ef5350', textAlign: 'center', marginBottom: 15 }}>Top 3 Rendimenti Peggiori (Decrescente)</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', borderBottom: '2px solid #333', padding: '0 10px' }}>{bottom3_ordered.map((d, i) => renderBar(d, i + 10))}</div>
          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: 5 }}>Peggiore | Secondo Peggiore | Terzo Peggiore</div>
        </div>
      </div>
      <p style={{ color: '#999', fontSize: '12px', marginTop: 10, borderTop: '1px dashed #444', paddingTop: 10, textAlign: 'center' }}>*L'altezza delle barre ? scalata in base al rendimento annuale assoluto pi? alto registrato.</p>
    </div>
  );
};

// --- TickerSearch (kept) ---
const TickerSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const controllerRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const searchTickers = useCallback(async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); setLoadingLocal(false); return; }
    try {
      if (controllerRef.current) {
        try { controllerRef.current.abort(); } catch (e) { /* ignore */ }
      }
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoadingLocal(true);
      const response = await axiosInstance.get(`/search_tickers?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      setSuggestions(response.data || []);
      setFocusedIndex(-1);
    } catch (error) {
      if (error && (error.name === 'CanceledError' || (error.message && error.message.toLowerCase().includes('aborted')))) {
        // ignore aborted requests
      } else {
        console.error("Errore nella ricerca ticker:", error);
        setSuggestions([]);
      }
    } finally {
      setLoadingLocal(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => searchTickers(query), 250);
    return () => clearTimeout(timeoutId);
  }, [query, searchTickers]);

  const handleKeyDown = (e) => {
    if (!suggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(i => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        const it = suggestions[focusedIndex];
        onSelect(it.ticker, it.name);
        setQuery(''); setSuggestions([]); setFocusedIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]); setFocusedIndex(-1);
    }
  };

  return (
    <div style={{ position: 'relative', margin: '10px 0' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca Ticker (es. SPY, BND)"
        style={styles.input}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls="ticker-suggestions"
      />
      {loadingLocal && <div style={{ position: 'absolute', right: 10, top: 12 }}><Spinner size={14} /></div>}
      {suggestions.length > 0 && (
        <ul id="ticker-suggestions" role="listbox" style={{ position: 'absolute', zIndex: 10, listStyle: 'none', padding: 0, margin: 0, border: '1px solid #66bb6a', width: '100%', backgroundColor: '#1e1e1e', borderRadius: '8px', maxHeight: '240px', overflowY: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
          {suggestions.map((item, idx) => (
            <li
              role="option"
              aria-selected={focusedIndex === idx}
              key={`${item.ticker}${item.isin ? '-' + item.isin : ''}`}
              onClick={() => { onSelect(item.ticker, item.name); setQuery(''); setSuggestions([]); setFocusedIndex(-1); }}
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #333', backgroundColor: focusedIndex === idx ? '#2d2d2d' : '#1e1e1e' }}
              onMouseEnter={() => setFocusedIndex(idx)}
              onMouseLeave={() => setFocusedIndex(-1)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div><strong style={{ marginRight: 8 }}>{item.ticker}</strong> <span style={{ color: '#ccc' }}> - {item.name}</span></div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                    {item.exchange ? `${item.exchange}` : ''}
                  </div>
                </div>
                {item.isin && (
                  <div style={{ fontSize: 12, color: '#aaa', marginLeft: 12, whiteSpace: 'nowrap' }}>
                    ISIN: {item.isin}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- Helper: normalize/sanitize portfolio weights ---
function buildAssetsPayloadFromPortfolioWeights(portfolioWeights, feeMap = {}) {
  const entries = Object.entries(portfolioWeights || {});
  const assets = [];
  for (const [ticker, rawVal] of entries) {
    let num = null;
    if (typeof rawVal === 'number' && isFinite(rawVal)) num = rawVal;
    else if (typeof rawVal === 'string') {
      const s = rawVal.trim().replace('%', '').replace(',', '.');
      const p = parseFloat(s);
      if (!isNaN(p)) num = p;
    }
    if (num === null) continue;
    const fraction = Math.abs(num) > 1 ? (num / 100) : num;
    const feeObj = feeMap[ticker] || {};
    assets.push({
      ticker,
      weight: fraction,
      entry_fee_percent: typeof feeObj.entry_fee_percent === 'number' ? feeObj.entry_fee_percent : (feeObj.entry_fee_percent ?? 0),
      annual_fee_percent: typeof feeObj.annual_fee_percent === 'number' ? feeObj.annual_fee_percent : (feeObj.annual_fee_percent ?? 0)
    });
  }
  const total = assets.reduce((s, a) => s + (a.weight || 0), 0);
  return { assets, total };
}

// --- App (main) ---
const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);
  const [simulatedBacktestResults, setSimulatedBacktestResults] = useState(null);
  const [frontierData, setFrontierData] = useState(null);
  const [canCalculateFrontier, setCanCalculateFrontier] = useState(false);
  const [showFrontierInline, setShowFrontierInline] = useState(false);

  const [form, setForm] = useState({
    assets: [
      { ticker: 'SPY', weight: 0.7, name: 'S&P 500 ETF', entry_fee_percent: 0.0, annual_fee_percent: 0.0 },
      { ticker: 'BND', weight: 0.3, name: 'Total Bond Market', entry_fee_percent: 0.0, annual_fee_percent: 0.0 }
    ],
    initial_investment: 10000,
    annual_contribution: 1200,
    contribution_frequency: 'monthly',
    start_date: '2015-01-01',
    end_date: new Date().toISOString().split('T')[0],
    entry_fee_percent: 0.0,
    annual_fee_percent: 0.0,
    interval: '1d',
    optimization_target: ''
  });

  const messageLiveRef = useRef(null);

  useEffect(() => {
    if (error && messageLiveRef.current) {
      try { messageLiveRef.current.focus(); } catch (e) { /* ignore */ }
    }
  }, [error]);

  const computeWeightsSummary = (assets) => {
    const total = assets.reduce((s, a) => s + (Number(a.weight) || 0), 0);
    return { total, percent: Math.round(total * 10000) / 100, valid: total >= 0.995 && total <= 1.005 };
  };

  const handleAssetSelect = (ticker, name) => {
    if (!form.assets.find(a => a.ticker === ticker)) {
      setForm(prevForm => ({ ...prevForm, assets: [...prevForm.assets, { ticker, weight: 0, name, entry_fee_percent: prevForm.entry_fee_percent ?? 0, annual_fee_percent: prevForm.annual_fee_percent ?? 0 }] }));
    }
  };

  const updateAssetWeight = (index, newPercent) => {
    const newAssets = [...form.assets];
    const parsed = parseFloat(newPercent);
    const newWeight = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed)) / 100;
    newAssets[index].weight = newWeight; setForm({ ...form, assets: newAssets });
  };

  const updateAssetFee = (index, field, newValue) => {
    const newAssets = [...form.assets];
    const parsed = parseFloat(String(newValue).replace(',', '.'));
    newAssets[index][field] = isNaN(parsed) ? 0 : parsed;
    setForm({ ...form, assets: newAssets });
  };

  const normalizeWeights = () => {
    const assets = form.assets.slice();
    const rawSum = assets.reduce((s, a) => s + (Number(a.weight) || 0), 0);
    if (rawSum <= 0) return;
    const normalized = assets.map(a => ({ ...a, weight: Number(((a.weight / rawSum) || 0).toFixed(6)) }));
    setForm({ ...form, assets: normalized });
  };

  const executeApiCall = async (endpoint, payload, successCallback) => {
    setLoading(true); setError(null);
    try {
      if (endpoint === 'backtest') {
        window.__lastBacktestRequest = payload;
      } else if (endpoint === 'efficient_frontier') {
        window.__lastFrontierRequest = payload;
      }
      const response = await axiosInstance.post(`/${endpoint}`, payload);
      window.__lastApiResponse = response.data;
      successCallback(response.data);
      return true;
    } catch (err) {
      const msg = err.response ? (err.response.data.error || `Errore HTTP: ${err.response.status}`) : `Errore di rete: ${err.message}`;
      console.error(`Errore su /${endpoint}:`, msg);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleBacktest = async (e) => {
    e.preventDefault();
    setBacktestResults(null); setSimulatedBacktestResults(null); setCanCalculateFrontier(false); setShowFrontierInline(false);

    const sanitizedAssets = form.assets.map(a => {
      let w = a.weight;
      if (typeof w === 'string') {
        const s = w.trim().replace('%', '').replace(',', '.');
        const p = parseFloat(s);
        w = isNaN(p) ? 0 : p;
      }
      if (Number.isFinite(w) && Math.abs(w) > 1) w = w / 100;
      w = Number.isFinite(w) ? w : 0;

      let entryFee = a.entry_fee_percent;
      if (typeof entryFee === 'string') entryFee = parseFloat(String(entryFee).replace(',', '.')) || 0;
      let annualFee = a.annual_fee_percent;
      if (typeof annualFee === 'string') annualFee = parseFloat(String(annualFee).replace(',', '.')) || 0;

      if (entryFee == null) entryFee = form.entry_fee_percent ?? 0;
      if (annualFee == null) annualFee = form.annual_fee_percent ?? 0;

      return { ticker: a.ticker, weight: w, entry_fee_percent: Number(entryFee), annual_fee_percent: Number(annualFee) , name: a.name };
    });

    const totalWeight = sanitizedAssets.reduce((sum, a) => sum + a.weight, 0);
    if (sanitizedAssets.length > 0 && (totalWeight < 0.999 || totalWeight > 1.001)) {
      setError("La somma dei pesi deve essere vicina al 100% per un backtest statico (inserisci percentuali intere o frazioni corrette).");
      return;
    }

    const weightedFeeTotals = sanitizedAssets.reduce((acc, a) => {
      acc.entry += (Number(a.entry_fee_percent) || 0) * (a.weight || 0);
      acc.annual += (Number(a.annual_fee_percent) || 0) * (a.weight || 0);
      return acc;
    }, { entry: 0, annual: 0 });

    const payload = {
      ...form,
      assets: sanitizedAssets.map(a => ({ ticker: a.ticker, weight: a.weight, entry_fee_percent: a.entry_fee_percent, annual_fee_percent: a.annual_fee_percent })),
      initial_investment: parseFloat(form.initial_investment),
      annual_contribution: parseFloat(form.annual_contribution),
      entry_fee_percent: (weightedFeeTotals.entry > 0) ? weightedFeeTotals.entry : (parseFloat(form.entry_fee_percent) || 0),
      annual_fee_percent: (weightedFeeTotals.annual > 0) ? weightedFeeTotals.annual : (parseFloat(form.annual_fee_percent) || 0),
      optimization_target: ''
    };

    window.__lastBacktestRequest = payload;
    const success = await executeApiCall('backtest', payload, setBacktestResults);
    if (success) setCanCalculateFrontier(true);
  };

  const handleEfficientFrontier = async () => {
    if (form.assets.length < 2) { setError("Devi avere almeno 2 asset per calcolare la Frontiera Efficiente."); return; }
    setShowFrontierInline(false); setFrontierData(null); setSimulatedBacktestResults(null);
    const static_weights_percent = form.assets.map(a => ({ ticker: a.ticker, weight: Number((a.weight * 100).toFixed(2)), entry_fee_percent: Number(a.entry_fee_percent || 0), annual_fee_percent: Number(a.annual_fee_percent || 0) }));
    const payload = {
      assets: form.assets.map(a => ({ ticker: a.ticker, weight: a.weight, entry_fee_percent: Number(a.entry_fee_percent || 0), annual_fee_percent: Number(a.annual_fee_percent || 0) })),
      start_date: form.start_date,
      end_date: form.end_date,
      static_weights: form.assets.map(a => ({ ticker: a.ticker, weight: a.weight, entry_fee_percent: Number(a.entry_fee_percent || 0), annual_fee_percent: Number(a.annual_fee_percent || 0) }))
    };
    const success = await executeApiCall('efficient_frontier', payload, (data) => {
      const augmented = { ...data, static_weights_percent };
      setFrontierData(augmented);
      setShowFrontierInline(true);
    });
    if (!success) setShowFrontierInline(false);
  };

  const handleSimulateOptimalBacktest = async (portfolioWeights, portfolioName, pointId = null) => {
    const feeMap = {};
    for (const a of form.assets) {
      feeMap[a.ticker] = {
        entry_fee_percent: Number(a.entry_fee_percent ?? form.entry_fee_percent ?? 0),
        annual_fee_percent: Number(a.annual_fee_percent ?? form.annual_fee_percent ?? 0)
      };
    }

    const { assets, total } = buildAssetsPayloadFromPortfolioWeights(portfolioWeights, feeMap);
    if (!assets || assets.length === 0 || total <= 0) {
      setError("Composizione non valida: assicurati che i pesi siano numerici (es. 65 o 0.65) e sommino a > 0.");
      return;
    }
    const normalizedAssets = assets.map(a => ({ ticker: a.ticker, weight: a.weight / total, entry_fee_percent: a.entry_fee_percent || 0, annual_fee_percent: a.annual_fee_percent || 0 }));

    const weightedFeeTotals = normalizedAssets.reduce((acc, a) => {
      acc.entry += (Number(a.entry_fee_percent) || 0) * (a.weight || 0);
      acc.annual += (Number(a.annual_fee_percent) || 0) * (a.weight || 0);
      return acc;
    }, { entry: 0, annual: 0 });

    const payload = {
      ...form,
      assets: normalizedAssets,
      initial_investment: parseFloat(form.initial_investment),
      annual_contribution: parseFloat(form.annual_contribution),
      entry_fee_percent: (weightedFeeTotals.entry > 0) ? weightedFeeTotals.entry : (parseFloat(form.entry_fee_percent) || 0),
      annual_fee_percent: (weightedFeeTotals.annual > 0) ? weightedFeeTotals.annual : (parseFloat(form.annual_fee_percent) || 0),
      optimization_target: ''
    };
    window.__lastBacktestRequest = payload;
    const success = await executeApiCall('backtest', payload, (data) => {
      setSimulatedBacktestResults({ ...data, name: portfolioName, point_id: pointId });
    });
    if (success) { /* keep view */ }
  };

  const renderAssetInputs = () => {
    const totalWeight = form.assets.reduce((sum, asset) => sum + asset.weight, 0);
    const percent = Math.round(totalWeight * 10000) / 100;
    const valid = totalWeight >= 0.995 && totalWeight <= 1.005;
    return (
      <div className="panel" style={{ ...styles.panel, marginTop: 20, padding: 15, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#66bb6a', fontSize: 16, margin: 0 }}>Assets nel Portafoglio ({Math.round(totalWeight * 100)}% Allocato)</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={normalizeWeights} style={{ ...styles.buttonBase, backgroundColor: '#555', color: '#fff', padding: '8px 10px', fontSize: 13 }}>Normalizza pesi</button>
            <div style={{ color: valid ? '#9fdbb7' : '#ffb300', fontWeight: 700 }}>{percent}%</div>
          </div>
        </div>
        <div style={{ marginTop: 10, marginBottom: 8 }}>
          <div style={{ height: 10, background: '#111', borderRadius: 6, overflow: 'hidden' }} aria-hidden>
            <div style={{ width: `${Math.min(100, Math.round(totalWeight * 100))}%`, height: '100%', background: valid ? '#66bb6a' : '#ffb300', transition: 'width 0.2s ease' }} />
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>Barra di stato pesi ? la somma dovrebbe essere 100%. Puoi impostare commissioni per singolo asset. Se non presenti, verranno usati i valori globali di seguito.</div>
        </div>
        <TickerSearch onSelect={handleAssetSelect} />
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', marginTop: 10, color: '#fff' }}>
          <thead>
            <tr>
              <th style={{ ...styles.tableHeader, padding: 10, textAlign: 'left', borderRadius: '8px 0 0 0' }}>Ticker</th>
              <th style={{ ...styles.tableHeader, padding: 10, textAlign: 'left' }}>Nome</th>
              <th style={{ ...styles.tableHeader, padding: 10, width: '100px' }}>Peso (%)</th>
              <th style={{ ...styles.tableHeader, padding: 10, width: '120px' }}>Entry Fee (%)</th>
              <th style={{ ...styles.tableHeader, padding: 10, width: '120px' }}>Annual Fee (%)</th>
              <th style={{ ...styles.tableHeader, padding: 10, width: '80px', borderRadius: '0 8px 0 0' }}>Rimuovi</th>
            </tr>
          </thead>
          <tbody>
            {form.assets.map((asset, index) => (
              <tr key={`${asset.ticker}-${index}`} style={{ backgroundColor: '#1b1b1b', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)' }}>
                <td style={{ padding: 10, border: 'none', borderRadius: '4px 0 0 4px', verticalAlign: 'top' }}>{asset.ticker}</td>
                <td style={{ padding: 10, border: 'none', whiteSpace: 'normal', maxWidth: 480 }}>{asset.name}</td>
                <td style={{ padding: 10, border: 'none', textAlign: 'center' }}>
                  <input type="number" value={Math.round(asset.weight * 100)} min="0" max="100" onChange={(e) => updateAssetWeight(index, e.target.value)} style={{ ...styles.input, width: '70px', textAlign: 'center', margin: 0, padding: '6px' }} />
                </td>
                <td style={{ padding: 10, border: 'none', textAlign: 'center' }}>
                  <input type="number" step="0.01" value={asset.entry_fee_percent ?? 0} onChange={(e) => updateAssetFee(index, 'entry_fee_percent', e.target.value)} style={{ ...styles.input, width: '90px', textAlign: 'center', margin: 0, padding: '6px' }} />
                </td>
                <td style={{ padding: 10, border: 'none', textAlign: 'center' }}>
                  <input type="number" step="0.01" value={asset.annual_fee_percent ?? 0} onChange={(e) => updateAssetFee(index, 'annual_fee_percent', e.target.value)} style={{ ...styles.input, width: '90px', textAlign: 'center', margin: 0, padding: '6px' }} />
                </td>
                <td style={{ padding: 10, border: 'none', textAlign: 'center', borderRadius: '0 4px 4px 0' }}>
                  <button onClick={() => setForm({ ...form, assets: form.assets.filter((_, i) => i !== index) })} style={{ ...styles.buttonBase, backgroundColor: '#ef5350', padding: '6px 10px', width: 'auto', fontSize: 14 }}>X</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const DrawdownSection = ({ summary, chartData }) => {
    const drawdown = Number(summary?.max_drawdown ?? 0);
    let drawdownDate = summary?.max_drawdown_date ?? null;
    let recoveryDate = summary?.max_recovery_end_date ?? null;
    let recoveryDays = typeof summary?.max_recovery_time_days === 'number' ? Number(summary.max_recovery_time_days) : null;

    if (Array.isArray(chartData) && chartData.length > 1) {
      let peak = -Infinity;
      const daily = chartData.map(d => {
        const v = Number(d.Value ?? d.value ?? 0);
        if (v > peak) peak = v;
        const dd = (v / peak - 1) * 100;
        return { Date: d.Date, Value: v, Drawdown: dd, PeakValue: peak };
      });

      let trough = daily.reduce((acc, cur) => (cur.Drawdown < (acc?.Drawdown ?? 0) ? cur : acc), null);
      if (trough) {
        drawdownDate = trough.Date || drawdownDate;
        const troughIdx = daily.findIndex(d => d.Date === trough.Date);
        let peakIndex = 0;
        for (let i = troughIdx; i >= 0; i--) {
          if (daily[i].Value >= trough.PeakValue * 0.99999) { peakIndex = i; break; }
        }
        let recoveryIndex = -1; let recovered = false;
        for (let i = troughIdx; i < daily.length; i++) {
          if (daily[i].Drawdown >= -0.01) { recoveryIndex = i; recovered = true; break; }
        }
        if (recoveryIndex !== -1) {
          recoveryDate = daily[recoveryIndex].Date;
          try {
            const peakDateObj = new Date(daily[peakIndex].Date);
            const recDateObj = new Date(recoveryDate);
            const diffDays = Math.round((recDateObj - peakDateObj) / (1000 * 60 * 60 * 24));
            recoveryDays = Number.isFinite(diffDays) ? diffDays : recoveryDays;
          } catch (e) {}
        } else {
          try {
            const peakDateObj = new Date(daily[peakIndex].Date);
            const lastDateObj = new Date(daily[daily.length - 1].Date);
            const diffDays = Math.round((lastDateObj - peakDateObj) / (1000 * 60 * 60 * 24));
            recoveryDays = Number.isFinite(diffDays) ? diffDays : recoveryDays;
            recoveryDate = null;
          } catch (e) {}
        }
      }
    }

    const drawdownFormatted = (typeof drawdown === 'number' && isFinite(drawdown)) ? `${drawdown.toFixed(2)}%` : '-';
    const recoveryFormatted = (typeof recoveryDays === 'number' && isFinite(recoveryDays)) ? `${recoveryDays} giorni` : '-';

    return (
      <div style={{ ...styles.drawdownCard, gridColumn: '1 / 3' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ color: '#fff', margin: 0, textAlign: 'center' }}>Rischio Massimo (Max Drawdown)</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
            <InfoBox
              title="Max Drawdown"
              value={<span style={{ color: '#ef5350' }}>{drawdownFormatted}</span>}
              sub={drawdownDate ? `Picco: ${formatDate(drawdownDate)}` : ''}
            />
            <InfoBox
              title="Durata Recupero"
              value={<span style={{ color: '#ffb300' }}>{recoveryFormatted}</span>}
              sub={recoveryDate ? `Fine recupero: ${formatDate(recoveryDate)}` : '(Non ancora recuperato)'}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <div style={{ width: '100%', maxWidth: '820px' }}>
              <DrawdownChart chartData={chartData} summary={summary} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const KeyMetricsRow = ({ summary }) => {
    const metrics = [
      { label: 'Rendimento Annuo (CAGR)', key: 'cagr_approx', icon: '', color: '#66bb6a' },
      { label: 'Rendimento Totale', key: 'total_return_percentage', icon: '', color: '#66bb6a' },
      { label: 'Volatilit? Annua', key: 'annual_volatility', icon: '', color: '#ffb300' },
      { label: 'Sharpe Ratio', key: 'sharpe_ratio', icon: '', color: '#1e88e5' },
      { label: 'Valore Finale', key: 'final_value', icon: '', color: '#ffffff' },
    ];
    return (
      <div style={{ display: 'flex', gap: 18, marginTop: 30, flexWrap: 'wrap' }}>
        {metrics.map(metric => (
          <div key={metric.key} style={{ ...styles.metricCard, borderLeft: `4px solid ${metric.color}` }}>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>{metric.icon} {metric.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{formatNumber(summary[metric.key], metric.key)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderSummaryContent = (results, title, isSimulation = false, options = {}) => {
    if (!results) return null;
    const summary = results.summary || {};
    const chartData = results.chart_data || [];
    const allAnnualReturns = results.all_annual_returns || results.annual_returns_data || results.annual_returns || results.allAnnualReturns || [];
    const chartProps = options.chartProps || {};
    const hideChart = !!options.hideChart;
    return (
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${isSimulation ? '#ffb300' : '#66bb6a'}` }}>
        <h2 style={{ color: '#fff', marginBottom: 18, fontSize: 20 }}>{title}</h2>
        {!hideChart && results.chart_data && <PortfolioChart data={results} title={`Andamento Storico: ${title}`} {...chartProps} />}
        <KeyMetricsRow summary={summary} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 30, marginTop: 30 }}>
          <ExtremePerformanceHistogram summary={summary} allAnnualReturns={allAnnualReturns} />
          <DrawdownSection summary={summary} chartData={chartData} />
        </div>
      </div>
    );
  };

  return (
    <div style={styles.appContainer}>
      <h1 style={styles.title}>Simulatore di Backtest Finanziario (v7.5)</h1>

      <div ref={messageLiveRef} tabIndex={-1} aria-live="polite" style={{ width: '100%' }}>
        {loading && <div style={{ color: '#ffb300', fontWeight: 700, textAlign: 'center', padding: 12, width: '100%' }}><Spinner size={16} /> Caricamento in corso... attendi</div>}
        {error && <div style={{ backgroundColor: '#ef5350', color: 'white', padding: 12, borderRadius: 8, margin: '8px 0', width: '100%' }}>{error}</div>}
      </div>

      <div className="panel" style={styles.panel}>
        <form onSubmit={handleBacktest} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, marginBottom: 20 }}>
          <div>
            <h3 style={{ color: '#fff' }}>Parametri Finanziari e Temporali</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13 }}>Investimento Iniziale (EUR):</label>
                <input
                  type="number"
                  value={form.initial_investment}
                  onChange={(e) => setForm({ ...form, initial_investment: e.target.value })}
                  required
                  style={styles.compactInput}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13 }}>Contributo Annuo (EUR):</label>
                <input
                  type="number"
                  value={form.annual_contribution}
                  onChange={(e) => setForm({ ...form, annual_contribution: e.target.value })}
                  style={styles.compactInput}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13 }}>Frequenza Contribuzione:</label>
                <select
                  value={form.contribution_frequency}
                  onChange={(e) => setForm({ ...form, contribution_frequency: e.target.value })}
                  style={styles.compactInput}
                >
                  <option value="none">Nessuno</option>
                  <option value="monthly">Mensile</option>
                  <option value="quarterly">Trimestrale</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13 }}>Data Inizio:</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                  style={styles.compactInput}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13 }}>Data Fine:</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  required
                  style={styles.compactInput}
                />
              </div>

              <div style={{ display: 'none' }} />
            </div>

            <h4 style={{ color: '#999', borderTop: '1px solid #333', paddingTop: 10, marginTop: 12 }}>Commissioni Globali (default - possono essere sovrascritte per singolo asset)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13 }}>Commissione Annuale Predefinita (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.annual_fee_percent}
                  onChange={(e) => setForm({ ...form, annual_fee_percent: e.target.value })}
                  style={styles.compactInput}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13 }}>Commissione di Ingresso Predefinita (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.entry_fee_percent}
                  onChange={(e) => setForm({ ...form, entry_fee_percent: e.target.value })}
                  style={styles.compactInput}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ color: '#fff' }}>Selezione Assets e Pesi</h3>
            <label style={{ display: 'block' }}>Obiettivo Analisi:
              <select value={form.optimization_target} disabled={true} style={styles.input}><option value="">1. Pesi Statici Utente</option></select>
            </label>

            {renderAssetInputs()}
          </div>

          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <button type="submit" disabled={loading} style={{ ...styles.buttonBase, backgroundColor: '#1e88e5', color: '#fff', fontSize: 16, padding: '12px 18px' }}>Passo 1: Esegui Backtest Statico</button>
            </div>
            <div style={{ color: '#999', fontSize: 14 }}>Suggerimento: assicurati che i pesi sommino al 100% e che le commissioni siano impostate per ogni asset se necessario.</div>
          </div>
        </form>

        {loading && !backtestResults && (
          <div className="panel" style={{ ...styles.panel, marginTop: 12 }} aria-hidden>
            <SkeletonBox height={18} width={'40%'} />
            <SkeletonBox height={160} />
          </div>
        )}

        {backtestResults && renderSummaryContent(backtestResults, 'Risultati Backtest Statico Utente')}

        <div className="panel" style={{ ...styles.panel, marginTop: 24 }}>
          <h3 style={{ color: '#fff', marginBottom: 12 }}>Calcolo Frontiera Efficiente</h3>
          <p style={{ color: '#999' }}>Clicca per calcolare la frontiera efficiente e visualizzarla sotto come continuazione dei risultati (inline). Le commissioni per singolo asset vengono incluse se presenti.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
            <button type="button" disabled={loading || !canCalculateFrontier} onClick={handleEfficientFrontier} style={{ ...styles.buttonBase, backgroundColor: '#66bb6a', color: '#0b0b0b', flex: 0.25, fontSize: 15 }}>
              Calcola Frontiera Efficiente (Inline)
            </button>
            <div style={{ color: '#999', alignSelf: 'center' }}>{canCalculateFrontier ? 'Pronto a calcolare' : 'Esegui prima il backtest per abilitare'}</div>
          </div>
        </div>

        {showFrontierInline && frontierData && (
          <EfficientFrontierInline
            frontierData={frontierData}
            onSimulate={handleSimulateOptimalBacktest}
            simulatedBacktestResults={simulatedBacktestResults}
            renderSummaryContent={renderSummaryContent}
            backtestResults={backtestResults}
          />
        )}
      </div>
    </div>
  );
};

export default App;