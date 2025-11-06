import React, { useState, useEffect } from 'react';
import macroService from '../../services/macroService.js';

/**
 * Componente per visualizzare grafici storici degli indicatori macro economici
 */
export default function HistoricalChart({ indicator, years = 5, height = 300 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistoricalData();
  }, [indicator, years]);

  const loadHistoricalData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await macroService.getHistoricalDataForIndicator(indicator, years);
      setData(result);
      console.log(`📈 Dati storici caricati per ${indicator}:`, result.statistics);
    } catch (err) {
      console.error('Errore caricamento dati storici:', err);
      setError('Errore nel caricamento dei dati storici');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        height: height + 40 // Include padding
      }}>
        {/* Header skeleton */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            height: '24px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            width: '200px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}></div>
          
          <div style={{
            display: 'flex',
            gap: '20px'
          }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                height: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                width: '80px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
            ))}
          </div>
        </div>

        {/* Chart area skeleton */}
        <div style={{
          height: height,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          marginBottom: '15px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Simulated chart lines */}
          <svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="skeleton-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.05)"/>
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)"/>
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)"/>
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  values="-100 0;100 0;-100 0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="40"
                y1={40 + (ratio * (height - 80))}
                x2="100%"
                y2={40 + (ratio * (height - 80))}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
            ))}
            
            {/* Skeleton chart line */}
            <path
              d={`M 40 ${height - 60} Q 200 ${height - 100} 400 ${height - 80} T 800 ${height - 70}`}
              fill="none"
              stroke="url(#skeleton-gradient)"
              strokeWidth="2"
            />
          </svg>
          
          {/* Loading indicator */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#999',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ 
              animation: 'spin 1s linear infinite',
              display: 'inline-block'
            }}>⟳</span>
            Caricamento {indicator}...
          </div>
        </div>

        {/* Footer skeleton */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '15px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            height: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            width: '150px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}></div>
          <div style={{
            height: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            width: '200px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}></div>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 0.8; }
            100% { opacity: 0.4; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(239, 83, 80, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(239, 83, 80, 0.3)',
        color: '#ef5350'
      }}>
        {error || 'Dati non disponibili'}
      </div>
    );
  }

  const { statistics } = data;
  const chartData = data.data || [];

  // Calcola le coordinate per il grafico SVG
  const padding = 40;
  const chartWidth = 800 - (padding * 2);
  const chartHeight = height - (padding * 2);

  if (chartData.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#999'
      }}>
        Nessun dato disponibile per {indicator}
      </div>
    );
  }

  // Trova min/max per scaling
  const values = chartData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;
  
  // Aggiungi un po' di padding sopra e sotto
  const paddedMin = minValue - (valueRange * 0.1);
  const paddedMax = maxValue + (valueRange * 0.1);
  const paddedRange = paddedMax - paddedMin;

  // Genera i punti per il grafico
  const points = chartData.map((point, index) => {
    const x = (index / (chartData.length - 1)) * chartWidth + padding;
    const y = ((paddedMax - point.value) / paddedRange) * chartHeight + padding;
    return { x, y, value: point.value, date: point.date };
  });

  // Genera la path per la linea
  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  // Area sotto la curva
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  // Formatta il nome dell'indicatore
  const indicatorNames = {
    'gdp': 'PIL (Crescita %)',
    'inflation': 'Inflazione (%)',
    'unemployment': 'Disoccupazione (%)',
    'federal_funds_rate': 'Fed Rate (%)',
    'consumer_sentiment': 'Sentiment Consumatori',
    'retail_sales': 'Vendite Retail (%)',
    'nonfarm_payroll': 'Posti di Lavoro (K)',
    'durable_goods': 'Beni Durevoli (%)',
    'housing_starts': 'Costruzioni (M)',
    'trade_balance': 'Bilancia Commerciale ($B)'
  };

  const indicatorName = indicatorNames[indicator] || indicator.toUpperCase();
  const trendColor = statistics.trend > 0 ? '#66bb6a' : statistics.trend < 0 ? '#ef5350' : '#ffa726';
  const lineColor = '#1e88e5';

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '20px'
    }}>
      {/* Header con statistiche */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          margin: 0,
          color: '#fff',
          fontSize: '18px'
        }}>
          {indicatorName}
        </h3>
        
        <div style={{
          display: 'flex',
          gap: '20px',
          fontSize: '14px'
        }}>
          <div>
            <span style={{ color: '#999' }}>Attuale: </span>
            <span style={{ color: '#fff', fontWeight: '600' }}>
              {statistics.lastValue?.toFixed(2)}
            </span>
          </div>
          <div>
            <span style={{ color: '#999' }}>Media: </span>
            <span style={{ color: '#fff' }}>{statistics.average}</span>
          </div>
          <div>
            <span style={{ color: '#999' }}>Trend: </span>
            <span style={{ color: trendColor, fontWeight: '600' }}>
              {statistics.trend > 0 ? '↗' : statistics.trend < 0 ? '↘' : '→'}
              {Math.abs(statistics.trend).toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* Grafico SVG */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 800 ${height}`}
          style={{ display: 'block' }}
        >
          {/* Definizioni */}
          <defs>
            <linearGradient id={`gradient-${indicator}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.05"/>
            </linearGradient>
          </defs>

          {/* Griglia orizzontale */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + (ratio * chartHeight);
            const value = paddedMax - (ratio * paddedRange);
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={800 - padding}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fill="#999"
                  fontSize="12"
                  textAnchor="end"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Griglia verticale (anni) */}
          {points.filter((_, index) => index % Math.floor(points.length / 5) === 0).map((point, i) => (
            <g key={i}>
              <line
                x1={point.x}
                y1={padding}
                x2={point.x}
                y2={height - padding}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
              <text
                x={point.x}
                y={height - padding + 20}
                fill="#999"
                fontSize="12"
                textAnchor="middle"
              >
                {new Date(point.date).getFullYear()}
              </text>
            </g>
          ))}

          {/* Area sotto la curva */}
          <path
            d={areaPath}
            fill={`url(#gradient-${indicator})`}
          />

          {/* Linea principale */}
          <path
            d={pathData}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Punti dati */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill={lineColor}
                style={{ cursor: 'pointer' }}
              >
                <title>
                  {new Date(point.date).toLocaleDateString('it-IT')}: {point.value.toFixed(2)}
                </title>
              </circle>
            </g>
          ))}
        </svg>
      </div>

      {/* Footer con info addizionali */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '15px',
        paddingTop: '15px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '12px',
        color: '#999'
      }}>
        <div>
          Range: {statistics.minimum} - {statistics.maximum} | Mediana: {statistics.median}
        </div>
        <div>
          {statistics.dataPoints} punti dati | 
          {data.source === 'mock' ? ' Dati simulati' : ' Dati reali'} | 
          Ultimo aggiornamento: {new Date(statistics.lastDate).toLocaleDateString('it-IT')}
        </div>
      </div>
    </div>
  );
}