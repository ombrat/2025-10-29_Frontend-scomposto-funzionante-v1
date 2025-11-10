import React, { useState, useRef } from 'react';
import useResizeObserver from '../../hooks/useResizeObserver.js';
import { measureText, formatValue } from '../../utils/analysis/indicatorUtils.js';

/**
 * Componente grafico per visualizzare l'andamento storico di un indicatore
 */
const IndicatorChart = ({ data, color, height = 280, title = "Andamento Storico", indicator = null }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('MAX');
  const [hoverData, setHoverData] = useState(null);
  const chartRef = useRef(null);
  const svgRef = useRef(null);
  const pendingRef = useRef(false);
  const lastMouseRef = useRef(null);
  const { width: chartWidth } = useResizeObserver(chartRef);
  
  if (!data || data.length < 2) return null;

  // Filtra solo valori numerici validi
  const allValidData = data
    .filter(d => d.value !== '.' && !isNaN(parseFloat(d.value)))
    .map(d => ({ ...d, numValue: parseFloat(d.value) }));

  if (allValidData.length < 2) return null;

  // Filtra per periodo selezionato
  const getFilteredData = () => {
    const currentDate = new Date();
    const cutoffDate = new Date();
    
    let filteredData;
    
    switch (selectedPeriod) {
      case '1Y':
        cutoffDate.setFullYear(currentDate.getFullYear() - 1);
        filteredData = allValidData.filter(d => {
          const dataDate = new Date(d.date);
          return dataDate >= cutoffDate;
        });
        break;
      case '5Y':
        cutoffDate.setFullYear(currentDate.getFullYear() - 5);
        filteredData = allValidData.filter(d => {
          const dataDate = new Date(d.date);
          return dataDate >= cutoffDate;
        });
        break;
      default: // MAX - usa tutti i dati storici
        filteredData = allValidData;
        break;
    }
    
    // Campionamento proporzionale per limitare a 300 punti massimo
    const MAX_POINTS = 300;
    if (filteredData.length <= MAX_POINTS) {
      return filteredData;
    }
    
    // Campionamento uniforme su tutta la serie
    const sampledData = [];
    const step = (filteredData.length - 1) / (MAX_POINTS - 1);
    
    for (let i = 0; i < MAX_POINTS; i++) {
      const index = Math.round(i * step);
      if (index < filteredData.length) {
        sampledData.push(filteredData[index]);
      }
    }
    
    // Assicurati che l'ultimo punto sia incluso
    if (sampledData[sampledData.length - 1] !== filteredData[filteredData.length - 1]) {
      sampledData[sampledData.length - 1] = filteredData[filteredData.length - 1];
    }
    
    return sampledData;
  };

  const validData = getFilteredData();
  if (validData.length < 2) return null;

  // Calcola dimensioni responsive
  const computedWidth = Math.round(chartWidth || 900);
  const WIDTH = Math.max(400, Math.min(1200, computedWidth));
  const HEIGHT = height;

  // Margini
  const RIGHT_MARGIN = 48;
  const TOP_MARGIN = 48;
  const BOTTOM_MARGIN = 70;

  const values = validData.map(d => d.numValue);
  const dates = validData.map(d => new Date(d.date));
  
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const range = maxY - minY || 1;

  // Calcola tick per asse Y
  const desiredYTicks = 5;
  const yTicks = [];
  for (let i = 0; i < desiredYTicks; i++) {
    yTicks.push(minY + (i / (desiredYTicks - 1)) * range);
  }

  // Calcola margini dinamici per le etichette
  const yLabelStrings = yTicks.map(v => 
    indicator ? formatValue(v, indicator, false) : v.toFixed(v < 10 ? 3 : 2)
  );
  const maxYLabelWidth = Math.max(...yLabelStrings.map(s => s.length * 7));
  const leftGutter = Math.max(56, maxYLabelWidth + 20);

  const innerWidth = WIDTH - leftGutter - RIGHT_MARGIN;
  const innerHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

  // Funzioni di mapping coordinate
  const getX = (index) => leftGutter + index * (innerWidth) / Math.max(1, (values.length - 1));
  const getY = (value) => {
    const normalized = (value - minY) / (range || 1);
    return TOP_MARGIN + (1 - normalized) * innerHeight;
  };

  // Gestione eventi mouse per tooltip
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
    
    const payload = { 
      index: idx, 
      date: dates[idx], 
      x: getX(idx), 
      y: getY(values[idx]), 
      value: values[idx],
      rawData: validData[idx]
    };
    
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
    setHoverData(null);
    lastMouseRef.current = null;
    pendingRef.current = false;
  };

  // Crea il path del grafico
  const dataPath = values.map((value, index) => {
    const x = getX(index);
    const y = getY(value);
    return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  // Area riempita sotto la linea
  const areaPath = `M ${leftGutter},${getY(minY)} L ${dataPath.slice(2)} L ${getX(values.length - 1)},${getY(minY)} Z`;

  // Rendering del tooltip
  const renderTooltip = () => {
    if (!hoverData || !chartRef.current) return null;
    
    const rect = chartRef.current.getBoundingClientRect();
    const leftPxRaw = (hoverData.x / WIDTH) * rect.width;
    const topPxRaw = (hoverData.y / HEIGHT) * rect.height;
    
    const dateLabel = hoverData.date?.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }) || '';
    const valueLabel = indicator 
      ? formatValue(hoverData.value, indicator, true) 
      : hoverData.value?.toFixed(4) || '';
    
    // Calcola dimensioni precise del contenuto
    const fontSize = 12;
    const padding = 16;
    const dateSize = measureText(dateLabel, fontSize);
    const valueSize = measureText(`Valore: ${valueLabel}`, fontSize);
    
    // Dimensioni effettive del tooltip
    const contentWidth = Math.max(dateSize.width, valueSize.width);
    const BOX_WIDTH = Math.min(Math.max(140, contentWidth + 20), Math.min(280, rect.width * 0.7));
    const BOX_HEIGHT = padding + dateSize.height + valueSize.height + 6;
    
    const offsetFromPoint = 12;
    const pointRadius = 5;
    
    // Calcola posizione orizzontale (centrata sul punto)
    let left = leftPxRaw - BOX_WIDTH / 2;
    left = Math.max(8, Math.min(rect.width - BOX_WIDTH - 8, left));
    
    // Calcola posizione verticale
    let top;
    const pointTop = topPxRaw - pointRadius;
    const pointBottom = topPxRaw + pointRadius;
    
    const spaceAbove = pointTop - (TOP_MARGIN * rect.height / HEIGHT);
    const spaceBelow = rect.height - pointBottom - (BOTTOM_MARGIN * rect.height / HEIGHT);
    
    if (spaceAbove >= BOX_HEIGHT + offsetFromPoint) {
      top = pointTop - offsetFromPoint - BOX_HEIGHT;
    } else if (spaceBelow >= BOX_HEIGHT + offsetFromPoint) {
      top = pointBottom + offsetFromPoint;
    } else {
      if (spaceAbove > spaceBelow) {
        top = Math.max(8, pointTop - BOX_HEIGHT - 8);
      } else {
        top = Math.min(rect.height - BOX_HEIGHT - 8, pointBottom + 8);
      }
    }
    
    top = Math.max(8, Math.min(rect.height - BOX_HEIGHT - 8, top));
    
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
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ color: color, fontWeight: 700 }}>Valore</div>
          <div style={{ color: '#ddd', fontWeight: 700 }}>{valueLabel}</div>
        </div>
      </div>
    );
  };

  const trend = validData.length > 1 
    ? validData[validData.length - 1].numValue > validData[0].numValue 
    : null;

  // Calcolo delle statistiche
  const latest = validData[validData.length - 1];
  const change = validData.length > 1 
    ? latest.numValue - validData[validData.length - 2].numValue 
    : 0;

  return (
    <div 
      ref={chartRef}
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '8px',
        padding: '14px',
        border: `1px solid ${color}30`,
        marginBottom: '16px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>
              📈 {title}
            </span>
            <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
              ({validData.length} punti)
            </span>
          </div>
          
          {/* Selettori periodo */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['1Y', '5Y', 'MAX'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  background: selectedPeriod === period 
                    ? color 
                    : 'rgba(255,255,255,0.05)',
                  color: selectedPeriod === period ? '#000' : '#ccc',
                  cursor: 'pointer',
                  fontWeight: selectedPeriod === period ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>
            {indicator ? formatValue(latest.numValue, indicator, true) : latest.numValue.toFixed(3)}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: change > 0 ? '#66bb6a' : change < 0 ? '#ef5350' : '#999',
            fontWeight: '600'
          }}>
            {change > 0 ? '+' : ''}{indicator ? formatValue(Math.abs(change), indicator, true) : change.toFixed(3)} {trend !== null && (trend ? '📈' : '📉')}
          </div>
        </div>
      </div>
      
      <div style={{ width: '100%', display: 'block', position: 'relative' }}>
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`} 
          style={{ 
            width: '100%', 
            height: `${HEIGHT}px`, 
            display: 'block', 
            margin: '0 auto' 
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Griglia orizzontale */}
          {yTicks.map((v, i) => (
            <line 
              key={i} 
              x1={leftGutter} 
              x2={WIDTH - RIGHT_MARGIN} 
              y1={getY(v)} 
              y2={getY(v)} 
              stroke="#2d2d2d" 
              strokeDasharray="3 3" 
            />
          ))}
          
          {/* Area riempita con gradiente */}
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: color, stopOpacity: 0.3}} />
              <stop offset="100%" style={{stopColor: color, stopOpacity: 0.05}} />
            </linearGradient>
          </defs>
          
          <path 
            d={areaPath} 
            fill={`url(#gradient-${color.replace('#', '')})`} 
            opacity="0.7"
          />
          
          {/* Linea principale */}
          <path 
            d={dataPath} 
            fill="none" 
            stroke={color} 
            strokeWidth="3" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
          
          {/* Etichette asse Y */}
          {yTicks.map((labelValue, i) => (
            <text 
              key={i} 
              x={leftGutter - 12} 
              y={getY(labelValue) + 5} 
              textAnchor="end" 
              fontSize="12" 
              fill="#999"
            >
              {indicator ? formatValue(labelValue, indicator, false) : labelValue.toFixed(labelValue < 10 ? 3 : 2)}
            </text>
          ))}
          
          {/* Etichette asse X */}
          {Array.from(new Set([
            0, 
            Math.floor((values.length - 1) * 0.25), 
            Math.floor((values.length - 1) * 0.5), 
            Math.floor((values.length - 1) * 0.75), 
            values.length - 1
          ])).map((idx) => (
            <text 
              key={idx} 
              x={getX(idx)} 
              y={HEIGHT - BOTTOM_MARGIN + 22} 
              textAnchor="middle" 
              fontSize="12" 
              fill="#999"
            >
              {dates[idx]?.toLocaleDateString('it-IT', { 
                month: 'short', 
                year: '2-digit' 
              })}
            </text>
          ))}
          
          {/* Asse Y */}
          <line 
            x1={leftGutter} 
            x2={leftGutter} 
            y1={TOP_MARGIN - 6} 
            y2={HEIGHT - BOTTOM_MARGIN} 
            stroke="#444" 
          />
          
          {/* Linea di hover e punto attivo */}
          {hoverData && hoverData.index >= 0 && hoverData.index < values.length && (
            <>
              <line 
                x1={getX(hoverData.index)} 
                x2={getX(hoverData.index)} 
                y1={TOP_MARGIN} 
                y2={HEIGHT - BOTTOM_MARGIN} 
                stroke={color} 
                strokeWidth="1" 
                strokeDasharray="4 4" 
                opacity="0.9" 
              />
              <circle 
                cx={getX(hoverData.index)} 
                cy={getY(values[hoverData.index])} 
                r="5" 
                fill={color} 
                stroke="#fff" 
                strokeWidth="1.4" 
              />
            </>
          )}
        </svg>
        
        {renderTooltip()}
      </div>
    </div>
  );
};

export default IndicatorChart;
