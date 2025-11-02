import React, { useMemo, useState } from 'react';

/**
 * PortfolioPieChart - Grafico a torta per mostrare la composizione del portafoglio
 * @param {Object} props
 * @param {Array} props.assets - Array di asset con ticker, name e weight
 * @param {string} props.title - Titolo del grafico (opzionale)
 * @param {number} props.size - Dimensione del grafico (default: 300)
 */
export default function PortfolioPieChart({ assets, title = "Composizione Portafoglio", size = 300 }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  // Calcola i dati per il grafico a torta
  const pieData = useMemo(() => {
    if (!assets || !Array.isArray(assets)) return [];
    
    // Filtra solo gli asset con peso > 0
    const validAssets = assets.filter(asset => Number(asset.weight) > 0);
    
    // Calcola la somma totale dei pesi
    const totalWeight = validAssets.reduce((sum, asset) => sum + Number(asset.weight), 0);
    
    if (totalWeight === 0) return [];
    
    // Genera colori per ogni asset
    const colors = [
      '#66bb6a', '#42a5f5', '#ff7043', '#ffca28', '#ab47bc', 
      '#26c6da', '#66bb6a', '#8d6e63', '#78909c', '#ff8a65',
      '#a1c181', '#ffd54f', '#81c784', '#64b5f6', '#f06292'
    ];
    
    let currentAngle = 0;
    
    return validAssets.map((asset, index) => {
      const percentage = (Number(asset.weight) / totalWeight) * 100;
      const angle = (percentage / 100) * 360;
      const color = colors[index % colors.length];
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;
      
      return {
        ticker: asset.ticker,
        name: asset.name || asset.ticker,
        weight: Number(asset.weight),
        percentage: percentage,
        startAngle,
        endAngle,
        color
      };
    });
  }, [assets]);

  // Gestione hover e click
  const handleSliceMouseEnter = (slice, event) => {
    setHoveredSlice(slice.ticker);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      data: slice
    });
  };

  const handleSliceMouseLeave = () => {
    setHoveredSlice(null);
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  };

  const handleSliceMouseMove = (event) => {
    if (tooltip.visible) {
      setTooltip(prev => ({
        ...prev,
        x: event.clientX,
        y: event.clientY
      }));
    }
  };

  // Funzione per creare il path SVG per ogni settore
  const createPieSlice = (slice, centerX, centerY, radius) => {
    const { startAngle, endAngle, color, ticker } = slice;
    const isHovered = hoveredSlice === ticker;
    
    // Calcola il raggio con effetto hover
    const currentRadius = isHovered ? radius * 1.05 : radius;
    
    const startAngleRad = (startAngle - 90) * Math.PI / 180;
    const endAngleRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = centerX + currentRadius * Math.cos(startAngleRad);
    const y1 = centerY + currentRadius * Math.sin(startAngleRad);
    const x2 = centerX + currentRadius * Math.cos(endAngleRad);
    const y2 = centerY + currentRadius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${currentRadius} ${currentRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return (
      <path
        key={ticker}
        d={pathData}
        fill={color}
        stroke={isHovered ? '#fff' : '#1a1a1a'}
        strokeWidth={isHovered ? 2 : 1}
        style={{
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
        }}
        className="pie-slice"
        onMouseEnter={(e) => handleSliceMouseEnter(slice, e)}
        onMouseLeave={handleSliceMouseLeave}
        onMouseMove={handleSliceMouseMove}
      />
    );
  };

  if (!pieData || pieData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: size,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#999'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📊</div>
          <div>Nessun dato disponibile</div>
        </div>
      </div>
    );
  }

  const radius = (size - 40) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(102, 187, 106, 0.05) 0%, rgba(102, 187, 106, 0.1) 100%)',
      border: '2px solid rgba(102, 187, 106, 0.3)',
      borderRadius: 12,
      padding: 20,
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <h3 style={{
        color: '#66bb6a',
        margin: '0 0 20px 0',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        🥧 {title}
      </h3>
      
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 30,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Grafico SVG */}
        <div style={{ position: 'relative' }}>
          <svg width={size} height={size} style={{ display: 'block' }}>
            {pieData.map((slice) => 
              createPieSlice(slice, centerX, centerY, radius)
            )}
            
            {/* Cerchio centrale per effetto donut */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius * 0.4}
              fill="#1a1a1a"
              stroke="rgba(102, 187, 106, 0.3)"
              strokeWidth="2"
            />
            
            {/* Testo centrale */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              fill="#66bb6a"
              fontSize="14"
              fontWeight="600"
            >
              Portfolio
            </text>
            <text
              x={centerX}
              y={centerY + 12}
              textAnchor="middle"
              fill="#999"
              fontSize="12"
            >
              {pieData.length} asset{pieData.length !== 1 ? 's' : ''}
            </text>
          </svg>
        </div>

        {/* Legenda */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 200
        }}>
          <div style={{
            color: '#bdbdbd',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: 8
          }}>
            Allocazione
          </div>
          
          {pieData.map((slice, index) => {
            const isHovered = hoveredSlice === slice.ticker;
            
            return (
            <div
              key={slice.ticker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: isHovered ? `${slice.color}15` : 'rgba(0, 0, 0, 0.2)',
                borderRadius: 8,
                border: `1px solid ${slice.color}30`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
              }}
              onMouseEnter={(e) => {
                setHoveredSlice(slice.ticker);
              }}
              onMouseLeave={(e) => {
                setHoveredSlice(null);
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: slice.color,
                  flexShrink: 0,
                  border: '2px solid #1a1a1a'
                }}
              />
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {slice.ticker}
                </div>
                <div style={{
                  color: '#999',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {slice.name}
                </div>
              </div>
              
              <div style={{
                color: slice.color,
                fontSize: 16,
                fontWeight: 700,
                textAlign: 'right'
              }}>
                {slice.percentage.toFixed(1)}%
              </div>
            </div>
          );
          })}
          
          {/* Totale */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            background: 'rgba(102, 187, 106, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(102, 187, 106, 0.3)',
            marginTop: 8
          }}>
            <span style={{ color: '#66bb6a', fontWeight: 600 }}>
              Totale
            </span>
            <span style={{ color: '#66bb6a', fontWeight: 700, fontSize: 16 }}>
              100.0%
            </span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y - 60,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 14,
            border: `2px solid ${tooltip.data.color}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            pointerEvents: 'none',
            minWidth: 180
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 6, color: tooltip.data.color }}>
            {tooltip.data.ticker}
          </div>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 8 }}>
            {tooltip.data.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Peso:</span>
            <span style={{ fontWeight: 'bold', color: tooltip.data.color }}>
              {tooltip.data.percentage.toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
            Clicca per selezionare
          </div>
        </div>
      )}
    </div>
  );
}