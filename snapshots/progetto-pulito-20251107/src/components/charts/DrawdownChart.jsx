import React, { useRef, useState } from 'react';
import useResizeObserver from '../../hooks/useResizeObserver';
import { niceTicks, estimateTextWidth } from '../../features/frontier/FrontierHelpers';
import { formatDate } from '../../utils/formatters';

export default function DrawdownChart({ chartData, summary, selectedDrawdownPeriod = null }) {
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

  let maxDrawdownSummary, troughEntry, peakIndex, recoveryIndex, isRecovered;
  
  if (selectedDrawdownPeriod) {
    // Usa il drawdown selezionato dall'utente
    maxDrawdownSummary = selectedDrawdownPeriod.maxDrawdown;
    
    // Trova gli indici corrispondenti nel dailyDrawdownData
    const peakDate = new Date(selectedDrawdownPeriod.peakDate);
    const troughDate = new Date(selectedDrawdownPeriod.troughDate);
    const recoveryDate = selectedDrawdownPeriod.recoveryDate ? new Date(selectedDrawdownPeriod.recoveryDate) : null;
    
    peakIndex = dailyDrawdownData.findIndex(d => new Date(d.Date) >= peakDate);
    const troughIndex = dailyDrawdownData.findIndex(d => new Date(d.Date) >= troughDate);
    
    if (peakIndex === -1) peakIndex = 0;
    if (troughIndex === -1) {
      troughEntry = dailyDrawdownData.reduce((acc, cur) => Math.abs(cur.Drawdown - maxDrawdownSummary) < Math.abs(acc.Drawdown - maxDrawdownSummary) ? cur : acc, dailyDrawdownData[0]);
    } else {
      troughEntry = dailyDrawdownData[troughIndex];
    }
    
    if (recoveryDate) {
      recoveryIndex = dailyDrawdownData.findIndex(d => new Date(d.Date) >= recoveryDate);
      isRecovered = recoveryIndex !== -1;
    } else {
      recoveryIndex = -1;
      isRecovered = false;
    }
  } else {
    // Usa il drawdown principale dal summary (comportamento originale)
    maxDrawdownSummary = Number(summary?.max_drawdown ?? 0);
    if (Math.abs(maxDrawdownSummary) < 0.1) return <p style={{ color: '#66bb6a', fontSize: '14px', marginTop: '10px' }}>Nessun drawdown significativo registrato nel periodo di backtest.</p>;

    troughEntry = dailyDrawdownData.find(d => Math.abs(d.Drawdown - maxDrawdownSummary) < 0.001) || dailyDrawdownData.reduce((acc, cur) => cur.Drawdown < (acc?.Drawdown ?? 0) ? cur : acc, null);
    if (!troughEntry) return null;

    peakIndex = 0;
    for (let i = dailyDrawdownData.indexOf(troughEntry); i >= 0; i--) {
      if (dailyDrawdownData[i].Value >= troughEntry.PeakValue * 0.99999) { peakIndex = i; break; }
    }

    recoveryIndex = -1; isRecovered = false;
    for (let i = dailyDrawdownData.indexOf(troughEntry); i < dailyDrawdownData.length; i++) {
      if (dailyDrawdownData[i].Drawdown >= -0.01) { recoveryIndex = i; isRecovered = true; break; }
    }
  }

  const endIndex = recoveryIndex !== -1 ? recoveryIndex : dailyDrawdownData.length - 1;
  const relevantData = dailyDrawdownData.slice(peakIndex, endIndex + 1);
  if (relevantData.length < 2) return <p style={{ color: '#ef5350', fontSize: '14px', marginTop: '10px' }}>L'evento di drawdown è troppo corto per essere visualizzato correttamente.</p>;

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

  // Calculate recovery info using actual dates from the chart data
  const drawdownDate = summary?.max_drawdown_date;
  
  // Calculate actual recovery days using the date range of relevantData
  const actualRecoveryDays = (() => {
    if (relevantData.length < 2) return null;
    try {
      const startDate = new Date(relevantData[0].Date);
      const endDate = new Date(relevantData[relevantData.length - 1].Date);
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : null;
    } catch (e) {
      return null;
    }
  })();

  const renderDrawdownHeader = () => {
    const drawdownFormatted = `${maxDrawdownSummary.toFixed(2)}%`;
    const recoveryFormatted = actualRecoveryDays !== null ? `${actualRecoveryDays} giorni` : 'Non recuperato';

    return null;
  };

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



  return (
    <div style={{ width: '100%' }}>
      {renderDrawdownHeader()}
      <div ref={containerRef} style={{ position: 'relative', width: '100%' }} onMouseMove={handleMouseMoveD} onMouseLeave={handleMouseLeaveD}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: `${HEIGHT}px`, overflow: 'visible', display: 'block', margin: '0 auto' }}>
        {yTicks.map((v, i) => {
          const yPos = getY(v);
          // Only show grid lines that are within the chart area (above the X axis)
          if (yPos > HEIGHT - BOTTOM_MARGIN) return null;
          return <line key={i} x1={leftGutter} x2={WIDTH - RIGHT_MARGIN} y1={yPos} y2={yPos} stroke="#2d2d2d" strokeDasharray="3 3" />;
        })}
        {getY(0) <= HEIGHT - BOTTOM_MARGIN && <line x1={leftGutter} x2={WIDTH - RIGHT_MARGIN} y1={getY(0)} y2={getY(0)} stroke="#66bb6a" strokeWidth="1" strokeDasharray="4 2" />}
        <path d={drawdownPath} fill="none" stroke="#ef5350" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={troughX} cy={troughY} r="4" fill="#ef5350" stroke="#fff" strokeWidth="1.2" />
        {isRecovered && (<circle cx={getX(relevantData.length - 1)} cy={getY(relevantData[relevantData.length - 1].Drawdown)} r="4" fill="#1e88e5" stroke="#fff" strokeWidth="1.2" />)}
        {yTicks.map((labelValue, i) => {
          const yPos = getY(labelValue);
          // Only show labels that are within the chart area (above the X axis)
          if (yPos > HEIGHT - BOTTOM_MARGIN) return null;
          return <text key={i} x={leftGutter - 12} y={yPos + 5} textAnchor="end" fontSize="12" fill="#999">{labelValue.toFixed(1)}%</text>;
        })}

        {Array.from(new Set([0, Math.floor((relevantData.length - 1) * 0.25), Math.floor((relevantData.length - 1) * 0.5), Math.floor((relevantData.length - 1) * 0.75), relevantData.length - 1])).map((idx) => (
          <text key={idx} x={getX(idx)} y={HEIGHT - BOTTOM_MARGIN + 22} textAnchor="middle" fontSize="12" fill="#999">{formatDate(relevantData[idx].Date)}</text>
        ))}

        <line x1={leftGutter} x2={leftGutter} y1={TOP_MARGIN - 6} y2={HEIGHT - BOTTOM_MARGIN} stroke="#444" />
        <line x1={leftGutter} x2={WIDTH - RIGHT_MARGIN} y1={HEIGHT - BOTTOM_MARGIN} y2={HEIGHT - BOTTOM_MARGIN} stroke="#444" />
        {hoverData && (
          <>
            <line x1={hoverData.x} x2={hoverData.x} y1={TOP_MARGIN} y2={HEIGHT - BOTTOM_MARGIN} stroke="#ffffff" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.6" />
            <circle cx={hoverData.x} cy={hoverData.y} r="5" fill="#1e88e5" stroke="#fff" strokeWidth="1.2" />
          </>
        )}
        </svg>
        {renderTooltip()}
      </div>

      {/* DRAWDOWN FREQUENCY METRICS */}
      {chartData && chartData.length > 0 && (() => {
        // Calcola drawdown superiori al 10%, loro media e media giorni di recupero
        const calculateDrawdowns = (data) => {
          let drawdownCount = 0;
          let drawdownValues = [];
          let recoveryDays = [];
          let peak = Number(data[0].Value ?? data[0].value ?? 0);
          let peakIndex = 0;
          let inDrawdown = false;
          let currentDrawdownMax = 0;
          let drawdownStartIndex = -1;

          for (let i = 1; i < data.length; i++) {
            const currentValue = Number(data[i].Value ?? data[i].value ?? 0);
            
            // Aggiorna il picco se il valore corrente è più alto
            if (currentValue > peak) {
              // Se stavamo in un drawdown, registra il massimo raggiunto e calcola i giorni di recupero
              if (inDrawdown && currentDrawdownMax > 10) {
                drawdownValues.push(currentDrawdownMax);
                
                // Calcola i giorni di recupero (dal picco al recupero)
                const daysBetween = i - peakIndex;
                recoveryDays.push(daysBetween);
              }
              
              peak = currentValue;
              peakIndex = i;
              inDrawdown = false;
              currentDrawdownMax = 0;
              drawdownStartIndex = -1;
            } else {
              // Calcola il drawdown percentuale dal picco
              const drawdown = ((peak - currentValue) / peak) * 100;
              
              // Aggiorna il massimo drawdown del periodo corrente
              if (drawdown > currentDrawdownMax) {
                currentDrawdownMax = drawdown;
              }
              
              // Se il drawdown supera il 10% e non eravamo già in un drawdown
              if (drawdown > 10 && !inDrawdown) {
                drawdownCount++;
                inDrawdown = true;
                drawdownStartIndex = i;
              }
            }
          }
          
          // Se alla fine siamo ancora in drawdown, registra l'ultimo valore ma non i giorni (non recuperato)
          if (inDrawdown && currentDrawdownMax > 10) {
            drawdownValues.push(currentDrawdownMax);
            // Non aggiungiamo giorni di recupero perché non è ancora recuperato
          }
          
          const averageDrawdown = drawdownValues.length > 0 
            ? drawdownValues.reduce((sum, val) => sum + val, 0) / drawdownValues.length 
            : 0;
          
          const averageRecoveryDays = recoveryDays.length > 0 
            ? recoveryDays.reduce((sum, days) => sum + days, 0) / recoveryDays.length 
            : 0;
          
          return { 
            count: drawdownCount, 
            average: averageDrawdown, 
            averageRecoveryDays: averageRecoveryDays,
            recoveredCount: recoveryDays.length 
          };
        };

        const drawdownResults = calculateDrawdowns(chartData);
        const drawdownsOver10 = drawdownResults.count;
        const averageDrawdownOver10 = drawdownResults.average;
        const averageRecoveryDays = drawdownResults.averageRecoveryDays;
        const recoveredCount = drawdownResults.recoveredCount;

        const drawdownMetrics = [
          { 
            label: 'Drawdown > 10%', 
            value: `${drawdownsOver10} ${drawdownsOver10 === 1 ? 'volta' : 'volte'}`, 
            icon: '🔴', 
            color: '#ef5350' 
          },
          { 
            label: 'Media Drawdown > 10%', 
            value: averageDrawdownOver10 > 0 ? `${averageDrawdownOver10.toFixed(2)}%` : 'N/A', 
            icon: '📉', 
            color: '#ff9800' 
          },
          { 
            label: 'Media Recupero > 10%', 
            value: recoveredCount > 0 ? `${Math.round(averageRecoveryDays)} giorni` : 'N/A', 
            icon: '⏱️', 
            color: '#9c27b0' 
          },
        ];

        return (
          <div style={{ 
            display: 'flex', 
            gap: 16, 
            marginTop: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
            animation: 'fadeIn 0.6s ease-out'
          }}>
            {drawdownMetrics.map((metric, index) => (
              <div
                key={metric.label}
                style={{
                  background: `linear-gradient(135deg, rgba(${metric.color === '#ef5350' ? '239, 83, 80' : metric.color === '#ff9800' ? '255, 152, 0' : '156, 39, 176'}, 0.05) 0%, rgba(${metric.color === '#ef5350' ? '239, 83, 80' : metric.color === '#ff9800' ? '255, 152, 0' : '156, 39, 176'}, 0.1) 100%)`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  border: `2px solid ${metric.color}33`,
                  boxShadow: `0 4px 15px rgba(0,0,0,0.15), 0 0 0 1px ${metric.color}22`,
                  minWidth: 140,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px) scale(1.01)';
                  e.target.style.boxShadow = `0 6px 20px rgba(0,0,0,0.25), 0 0 0 2px ${metric.color}44`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0px) scale(1)';
                  e.target.style.boxShadow = `0 4px 15px rgba(0,0,0,0.15), 0 0 0 1px ${metric.color}22`;
                }}
              >
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 500,
                  marginBottom: 8, 
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}>
                  {metric.icon} {metric.label}
                </div>
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: 700, 
                  color: metric.color,
                  lineHeight: 1.2
                }}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

    </div>
  );
}