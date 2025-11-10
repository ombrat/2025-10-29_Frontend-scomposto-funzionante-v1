import React, { useState, useRef } from 'react';
import useResizeObserver from '../../hooks/useResizeObserver.js';
import { getIndicatorConfig } from '../../utils/analysis/indicatorConfig.js';
import { formatValue } from '../../utils/analysis/indicatorUtils.js';

/**
 * Componente per il grafico di confronto tra due indicatori
 */
const CompareChart = ({ primary, secondary, onClose, macroData, macroService }) => {
  const chartRef = useRef(null);
  const svgRef = useRef(null);
  const [hoverData, setHoverData] = useState(null);
  const { width: chartWidth } = useResizeObserver(chartRef);
  
  if (!primary?.observations || !secondary?.observations) return null;

  // Calcola dimensioni responsive
  const computedWidth = Math.round(chartWidth || 900);
  const WIDTH = Math.max(600, Math.min(1200, computedWidth));
  const HEIGHT = Math.round(WIDTH * 0.44);

  const RIGHT_MARGIN = 48;
  const TOP_MARGIN = 48;
  const BOTTOM_MARGIN = 70;

  // Filtra e normalizza i dati
  const primaryData = primary.observations.filter(d => d.value !== '.' && !isNaN(parseFloat(d.value)))
    .map(d => ({ date: new Date(d.date), value: parseFloat(d.value) }));
  
  const secondaryData = secondary.observations.filter(d => d.value !== '.' && !isNaN(parseFloat(d.value)))
    .map(d => ({ date: new Date(d.date), value: parseFloat(d.value) }));

  if (primaryData.length === 0 || secondaryData.length === 0) return null;

  // Trova la data più recente di entrambe le serie come punto di partenza
  const primaryMaxDate = new Date(Math.max(...primaryData.map(d => d.date)));
  const secondaryMaxDate = new Date(Math.max(...secondaryData.map(d => d.date)));
  const maxDate = new Date(Math.max(primaryMaxDate, secondaryMaxDate));
  
  // Trova la data più vecchia tra le due serie come punto finale
  const primaryMinDate = new Date(Math.min(...primaryData.map(d => d.date)));
  const secondaryMinDate = new Date(Math.min(...secondaryData.map(d => d.date)));
  
  // Usa la data più recente tra le due date più vecchie
  // Questo allinea le serie alla data più recente disponibile per entrambe
  const minDate = new Date(Math.max(primaryMinDate, secondaryMinDate));
  
  // Filtra i dati per includere solo il range comune
  const filteredPrimaryData = primaryData.filter(d => d.date >= minDate && d.date <= maxDate);
  const filteredSecondaryData = secondaryData.filter(d => d.date >= minDate && d.date <= maxDate);

  // Campiona i dati per performance (max 300 punti)
  const sampleData = (data, maxPoints = 300) => {
    if (data.length <= maxPoints) return data;
    const step = (data.length - 1) / (maxPoints - 1);
    const sampled = [];
    for (let i = 0; i < maxPoints; i++) {
      const index = Math.round(i * step);
      if (index < data.length) sampled.push(data[index]);
    }
    return sampled;
  };

  const sampledPrimary = sampleData(filteredPrimaryData);
  const sampledSecondary = sampleData(filteredSecondaryData);

  // Normalizza i dati per il confronto visuale (scala 0-100)
  const normalizeData = (data) => {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return data.map(d => ({
      ...d,
      normalizedValue: ((d.value - min) / range) * 100
    }));
  };

  const normalizedPrimary = normalizeData(sampledPrimary);
  const normalizedSecondary = normalizeData(sampledSecondary);

  // Calcola margini dinamici
  const leftGutter = 80;
  const innerWidth = WIDTH - leftGutter - RIGHT_MARGIN;
  const innerHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

  // Funzioni di mapping coordinate
  const getX = (date) => {
    const dateTime = date.getTime();
    const minTime = minDate.getTime();
    const maxTime = maxDate.getTime();
    const normalized = (dateTime - minTime) / (maxTime - minTime || 1);
    return leftGutter + normalized * innerWidth;
  };

  const getY = (normalizedValue) => {
    const normalized = normalizedValue / 100;
    return TOP_MARGIN + (1 - normalized) * innerHeight;
  };

  // Crea i path per le linee
  const primaryPath = normalizedPrimary.map((d, i) => {
    const x = getX(d.date);
    const y = getY(d.normalizedValue);
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  const secondaryPath = normalizedSecondary.map((d, i) => {
    const x = getX(d.date);
    const y = getY(d.normalizedValue);
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  // Gestione eventi mouse
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    
    if (mouseX >= leftGutter && mouseX <= WIDTH - RIGHT_MARGIN) {
      const dateRatio = (mouseX - leftGutter) / innerWidth;
      const targetTime = minDate.getTime() + dateRatio * (maxDate.getTime() - minDate.getTime());
      
      // Trova i punti più vicini
      const findClosest = (data) => {
        return data.reduce((closest, current) => {
          const currentDiff = Math.abs(current.date.getTime() - targetTime);
          const closestDiff = Math.abs(closest.date.getTime() - targetTime);
          return currentDiff < closestDiff ? current : closest;
        });
      };

      const closestPrimary = findClosest(normalizedPrimary);
      const closestSecondary = findClosest(normalizedSecondary);

      setHoverData({
        date: new Date(targetTime),
        primary: closestPrimary,
        secondary: closestSecondary,
        x: mouseX,
        y: (getY(closestPrimary.normalizedValue) + getY(closestSecondary.normalizedValue)) / 2
      });
    }
  };

  const handleMouseLeave = () => setHoverData(null);

  const primaryConfig = getIndicatorConfig(primary.id, macroData, macroService);
  const secondaryConfig = getIndicatorConfig(secondary.id, macroData, macroService);

  return (
    <div 
      ref={chartRef}
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '20px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>
          📊 Confronto Indicatori
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(239, 83, 80, 0.1)',
            border: '1px solid rgba(239, 83, 80, 0.3)',
            color: '#ef5350',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ✕ Chiudi
        </button>
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
          {/* Griglia */}
          {[0, 25, 50, 75, 100].map((v) => (
            <line 
              key={v} 
              x1={leftGutter} 
              x2={WIDTH - RIGHT_MARGIN} 
              y1={getY(v)} 
              y2={getY(v)} 
              stroke="#2d2d2d" 
              strokeDasharray="3 3" 
            />
          ))}

          {/* Linee del grafico */}
          <path 
            d={primaryPath} 
            fill="none" 
            stroke={primaryConfig.color} 
            strokeWidth="3" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
          
          <path 
            d={secondaryPath} 
            fill="none" 
            stroke={secondaryConfig.color} 
            strokeWidth="3" 
            strokeDasharray="8 4"
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />

          {/* Etichette asse Y */}
          {[0, 25, 50, 75, 100].map((v) => (
            <text 
              key={v} 
              x={leftGutter - 12} 
              y={getY(v) + 5} 
              textAnchor="end" 
              fontSize="12" 
              fill="#999"
            >
              {v}%
            </text>
          ))}

          {/* Etichette asse X */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const date = new Date(minDate.getTime() + ratio * (maxDate.getTime() - minDate.getTime()));
            const x = leftGutter + ratio * innerWidth;
            return (
              <text 
                key={i} 
                x={x} 
                y={HEIGHT - BOTTOM_MARGIN + 22} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#999"
              >
                {date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })}
              </text>
            );
          })}

          {/* Asse Y */}
          <line 
            x1={leftGutter} 
            x2={leftGutter} 
            y1={TOP_MARGIN - 6} 
            y2={HEIGHT - BOTTOM_MARGIN} 
            stroke="#444" 
          />

          {/* Linea di hover */}
          {hoverData && (
            <line 
              x1={hoverData.x} 
              x2={hoverData.x} 
              y1={TOP_MARGIN} 
              y2={HEIGHT - BOTTOM_MARGIN} 
              stroke="rgba(255,255,255,0.5)" 
              strokeWidth="1" 
              strokeDasharray="4 4" 
            />
          )}
        </svg>

        {/* Tooltip */}
        {hoverData && (
          <div style={{
            position: 'absolute',
            left: `${(hoverData.x / WIDTH) * 100}%`,
            top: '20px',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg,#151515,#1e1e1e)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '200px',
            zIndex: 1000,
            pointerEvents: 'none'
          }}>
            <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}>
              {hoverData.date.toLocaleDateString('it-IT')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '12px' }}>
              <span style={{ color: primaryConfig.color, fontSize: '12px' }}>📈 {primary.name}</span>
              <span style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>
                {formatValue(hoverData.primary?.value, primary, true)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: secondaryConfig.color, fontSize: '12px' }}>📊 {secondary.name}</span>
              <span style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>
                {formatValue(hoverData.secondary?.value, secondary, true)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '30px',
        marginTop: '15px',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '20px', 
            height: '3px', 
            background: primaryConfig.color,
            borderRadius: '2px'
          }}></div>
          <span style={{ color: '#fff' }}>{primary.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '20px', 
            height: '3px', 
            background: secondaryConfig.color,
            borderRadius: '2px',
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.3) 4px, rgba(0,0,0,0.3) 8px)'
          }}></div>
          <span style={{ color: '#fff' }}>{secondary.name}</span>
        </div>
      </div>
    </div>
  );
};

export default CompareChart;
