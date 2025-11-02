import React, { useState } from 'react';
import { formatDate } from '../../utils/formatters';

export default function ExtremePerformanceHistogram({ summary, allAnnualReturns }) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const annualReturns = allAnnualReturns || [];
  
  if (!annualReturns || !Array.isArray(annualReturns) || annualReturns.length === 0) {
    return (
      <div style={{ 
        marginTop: 30, 
        padding: 24,
        background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.05) 0%, rgba(255, 179, 0, 0.1) 100%)',
        borderRadius: 16,
        border: '2px solid #ffb30033',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 18, color: '#ffb300', fontWeight: 600, marginBottom: 8 }}>
          📊 Dati Non Disponibili
        </div>
        <p style={{ color: '#999', margin: 0 }}>Nessun dato annuale disponibile per l'analisi delle performance estreme.</p>
      </div>
    );
  }

  const safeValue = (d) => {
    if (d == null) return 0;
    if (typeof d.return_percentage === 'number') return d.return_percentage;
    if (typeof d.return_percent === 'number') return d.return_percent;
    if (typeof d.return === 'number') return d.return;
    if (typeof d.value === 'number') return d.value;
    if (typeof d === 'number') return d;
    return 0;
  };

  const sortedReturns = [...annualReturns].sort((a, b) => safeValue(b) - safeValue(a));
  const top3_raw = sortedReturns.slice(0, 3);
  const top3_ordered = [top3_raw[0], top3_raw[1], top3_raw[2]].filter(Boolean); // Migliore → Secondo → Terzo
  const bottom3_raw = sortedReturns.slice(-3);
  const bottom3_ordered = bottom3_raw.reverse().filter(Boolean); // Primo Peggiore → Secondo Peggiore → Terzo Peggiore
  // Migliore scaling: usa il massimo valore delle colonne visualizzate, non di tutti i dati
  const displayedValues = [...top3_ordered, ...bottom3_ordered].map(d => Math.abs(safeValue(d)));
  const maxDisplayed = displayedValues.length > 0 ? Math.max(...displayedValues) : 10;
  const minMax = Math.max(maxDisplayed, 5);
  // Aumenta significativamente la scala per utilizzare meglio lo spazio
  const scale = 140 / minMax;
  const getColor = (value) => (value >= 0 ? '#66bb6a' : '#ef5350');

  const renderBar = (data, idx, section) => {
    const val = safeValue(data);
    // Altezza minima più alta e migliore utilizzo dello spazio
    const heightPx = Math.max(40, Math.abs(val) * scale);
    const key = (data && data.year) ? `${data.year}-${val}` : `bar-${idx}`;
    const isHovered = hoveredBar === `${section}-${idx}`;
    const color = getColor(val);
    
    return (
      <div 
        key={key} 
        style={{ 
          flex: 1, 
          textAlign: 'center', 
          margin: '0 8px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-end', 
          height: '220px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={() => setHoveredBar(`${section}-${idx}`)}
        onMouseLeave={() => setHoveredBar(null)}
      >
        <div style={{ 
          height: `${heightPx}px`, 
          width: '100%', 
          background: `linear-gradient(180deg, ${color} 0%, ${color}dd  100%)`,
          borderRadius: '8px 8px 4px 4px', 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'center', 
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'scale(1.05) translateY(-4px)' : 'scale(1) translateY(0px)',
          boxShadow: isHovered 
            ? `0 12px 24px rgba(0,0,0,0.4), 0 0 20px ${color}33` 
            : '0 4px 12px rgba(0,0,0,0.2)',
          border: `2px solid ${isHovered ? color : color + '88'}`,
          position: 'relative'
        }}>
          <span style={{ 
            fontSize: '12px', 
            color: '#fff', 
            fontWeight: 700, 
            marginBottom: '4px', 
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            {val.toFixed(1)}%
          </span>
        </div>
        
        <div style={{ 
          fontSize: isHovered ? 14 : 12, 
          color: isHovered ? '#fff' : '#ccc', 
          marginTop: '8px', 
          fontWeight: isHovered ? 700 : 600,
          transition: 'all 0.3s ease'
        }}>
          {data && data.year ? data.year : '-'}
        </div>
      </div>
    );
  };

  return (
      
      <div style={{ 
        marginTop: 30, 
        padding: 24,
        background: 'linear-gradient(180deg, #0e0e0e, #0a0a0a)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.02)',
        color: '#f1f1f1',
        animation: 'slideInUp 0.6s ease-out'
      }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 32,
          borderBottom: '2px solid rgba(255,255,255,0.1)',
          paddingBottom: 20
        }}>
          <h3 style={{ 
            color: '#fff', 
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}>
            📊 Performance Estreme Annuali
          </h3>
          <p style={{ 
            color: '#999', 
            margin: '8px 0 0 0', 
            fontSize: 14 
          }}>
            Analisi dei migliori e peggiori rendimenti annuali del portafoglio
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 32, 
          flexWrap: 'wrap'
        }}>
          {/* TOP 3 SECTION */}
          <div style={{ 
            flex: 1, 
            maxWidth: '480px', 
            minWidth: '320px',
            background: 'linear-gradient(180deg, #0e0e0e, #0a0a0a)',
            borderRadius: 10,
            border: '1px solid #66bb6a33',
            padding: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)'
          }}>
            <h4 style={{ 
              color: '#66bb6a', 
              textAlign: 'center', 
              marginBottom: 20,
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              🏆 Top 3 Migliori
            </h4>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              height: '180px', 
              borderBottom: '3px solid #66bb6a44', 
              padding: '0 16px',
              borderRadius: '0 0 8px 8px'
            }}>
              {top3_ordered.map((d, i) => renderBar(d, i, 'top'))}
            </div>

          </div>
          
          {/* BOTTOM 3 SECTION */}
          <div style={{ 
            flex: 1, 
            maxWidth: '480px', 
            minWidth: '320px',
            background: 'linear-gradient(180deg, #0e0e0e, #0a0a0a)',
            borderRadius: 10,
            border: '1px solid #ef535033',
            padding: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)'
          }}>
            <h4 style={{ 
              color: '#ef5350', 
              textAlign: 'center', 
              marginBottom: 20,
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              📉 Top 3 Peggiori
            </h4>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              height: '180px', 
              borderBottom: '3px solid #ef535044', 
              padding: '0 16px',
              borderRadius: '0 0 8px 8px'
            }}>
              {bottom3_ordered.map((d, i) => renderBar(d, i, 'bottom'))}
            </div>

          </div>
        </div>
        

      </div>
  );
}