import React, { useRef, useState } from 'react';
import useResizeObserver from '../../hooks/useResizeObserver';
import { sampleEvenIndices, niceTicks, estimateTextWidth } from '../../features/frontier/FrontierHelpers';
import { formatDate, formatMoney } from '../../utils/formatters';
import { downloadSvgAsPng, exportCsvFromChartData } from '../../utils/csvExport';

export default function CombinedPortfolioChart({ primaryResult, secondaryResult, titlePrimary, titleSecondary, onHover = null, primaryColor = '#1e88e5', secondaryColor = '#ffb300' }) {
  if (!primaryResult || !primaryResult.chart_data || primaryResult.chart_data.length === 0) return null;

  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(true);

  const wrapperRef = useRef(null);
  const { width: wrapperWidth } = useResizeObserver(wrapperRef);
  const computedWidth = Math.round(wrapperWidth || 900);
  const WIDTH = Math.max(720, Math.min(1800, computedWidth));
  const HEIGHT = Math.round(WIDTH * 0.44);
  const RIGHT_MARGIN = 48;
  const TOP_MARGIN = 48;
  const BOTTOM_MARGIN = 70;

  const trimAndSample = (chartDataRaw) => {
    if (!chartDataRaw || chartDataRaw.length === 0) return [];
    const firstInvestedIndexInRaw = chartDataRaw.findIndex(d => {
      const investedVal = Number(d.TotalInvested ?? d.Total_invested ?? d.totalInvested ?? 0);
      const valueVal = Number(d.Value ?? d.value ?? 0);
      return investedVal > 0 || valueVal > 0;
    });
    const startIdx = firstInvestedIndexInRaw >= 0 ? firstInvestedIndexInRaw : 0;
    const trimmed = chartDataRaw.slice(startIdx);
    return sampleEvenIndices(trimmed, 300);
  };

  const primaryChart = trimAndSample(primaryResult.chart_data);
  const secondaryChart = secondaryResult ? trimAndSample(secondaryResult.chart_data) : [];

  const primaryValues = primaryChart.map(d => Number(d.Value ?? d.value ?? 0));
  const primaryInvested = primaryChart.map(d => Number(d.TotalInvested ?? d.Total_invested ?? d.totalInvested ?? 0));
  const primaryDates = primaryChart.map(d => new Date(d.Date));

  const secondaryValues = secondaryChart.map(d => Number(d.Value ?? d.value ?? 0));
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

  const datesForLabels = primaryDates.length ? primaryDates : secondaryDates;
  const nx = datesForLabels.length || 1;

  return (
    <div ref={wrapperRef} className="panel" style={{ marginTop: 18, padding: 14, border: '1px solid #222', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ color: '#fff', marginBottom: 0 }}>{`${titlePrimary || 'Simulazione'} • ${titleSecondary || 'Statico Utente'}`}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ color: '#ccc', fontSize: 13 }}>
            <input 
              type="checkbox" 
              checked={showPrimary} 
              onChange={(e) => setShowPrimary(e.target.checked)}
            /> {titlePrimary || 'Simulazione'}
          </label>
          <label style={{ color: '#ccc', fontSize: 13 }}>
            <input 
              type="checkbox" 
              checked={showSecondary} 
              onChange={(e) => setShowSecondary(e.target.checked)}
            /> {titleSecondary || 'Statico Utente'}
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
            {showPrimary && localHover.idxPrimary != null && (<circle cx={getXPrimary(localHover.idxPrimary)} cy={getY(localHover.primaryValue)} r="5" fill={primaryColor} stroke="#fff" strokeWidth="1.2" />)}
            {showSecondary && localHover.idxSecondary != null && (<circle cx={getXSecondary(localHover.idxSecondary)} cy={getY(localHover.secondaryValue)} r="5" fill={secondaryColor} stroke="#fff" strokeWidth="1.2" />)}
          </>
        )}
      </svg>

      <div className="chart-controls" style={{ marginTop: 10 }}>
        <button className="btn" style={{ marginRight: 8 }} onClick={() => downloadSvgAsPng(svgRef.current, 'combined-portfolio.png')}>Scarica PNG</button>
        <button className="btn" onClick={() => {
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
}