import React, { useRef, useState } from 'react';
import useResizeObserver from '../../hooks/useResizeObserver';
import { sampleEvenIndices, niceTicks, estimateTextWidth } from '../../features/frontier/FrontierHelpers';
import { formatDate, formatMoney } from '../../utils/formatters';
import { downloadSvgAsPng, exportCsvFromChartData } from '../../utils/csvExport';
import KeyMetricsRow from '../ui/KeyMetricsRow';

const MAX_DISPLAY_POINTS = 300;

export default function PortfolioChart({ data, title, onHover = null, hoverIndex = null, highlightColor = '#1e88e5', summary = null }) {
  const chartDataRaw = data?.chart_data;
  const dataSummary = data?.summary;
  const finalSummary = summary || dataSummary;
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
    const valueVal = Number(d.Value ?? d.value ?? 0);
    return investedVal > 0 || valueVal > 0;
  });
  const startIdx = firstInvestedIndexInRaw >= 0 ? firstInvestedIndexInRaw : 0;
  const trimmedRaw = chartDataRaw.slice(startIdx);
  const chartData = sampleEvenIndices(trimmedRaw, MAX_DISPLAY_POINTS);

  const values = chartData.map(d => Number(d.Value ?? d.value ?? 0));
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
  const [hoverData, setHoverData] = useState(null);
  const [showInvested, setShowInvested] = useState(true);
  const svgRef = useRef(null);
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
    if (typeof onHover === 'function') onHover(payload);
    else setLocalHoverIndex(idx);
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
    setHoverData(null);
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

  const renderTooltip = () => {
    if (!hoverData || !wrapperRef.current) return null;
    const rect = wrapperRef.current.getBoundingClientRect();
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
    <div ref={wrapperRef} className="panel" style={{ marginTop: 18, padding: 14, border: '1px solid #222', position: 'relative' }}>
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

        <div className="chart-controls" style={{ marginTop: 8, marginBottom: 12, textAlign: 'right', opacity: 0.7 }}>
          <button className="btn btn-small" style={{ marginRight: 6, fontSize: 11, padding: '4px 8px', background: '#2a2a2a', border: '1px solid #444', color: '#bbb' }} onClick={() => downloadSvgAsPng(svgRef.current, 'portfolio.png')} aria-label="Scarica PNG">PNG</button>
          <button className="btn btn-small" style={{ marginRight: 8, fontSize: 11, padding: '4px 8px', background: '#2a2a2a', border: '1px solid #444', color: '#bbb' }} onClick={() => exportCsvFromChartData(chartData, 'portfolio.csv')}>CSV</button>
          <label style={{ color: '#999', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={showInvested} onChange={(e) => setShowInvested(e.target.checked)} style={{ transform: 'scale(0.8)' }} /> Totale Investito
          </label>
        </div>

        <div style={{ textAlign: 'center', fontSize: 13 }}>
          <span style={{ color: '#1e88e5', marginRight: 10 }}>Valore Portafoglio</span>
          <span style={{ color: '#ffb300' }}>Totale Investito</span>
        </div>

        {/* KEY METRICS */}
        {finalSummary && <KeyMetricsRow summary={finalSummary} />}

        {renderTooltip()}
      </div>
    </div>
  );
}