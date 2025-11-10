import React from 'react';

/**
 * Very small best/worst display.
 * Props: best (number), worst (number)
 */
export default function BestWorstChart({ best = null, worst = null }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ 
        backgroundColor: '#1a1a1a',
        border: '2px solid #66bb6a',
        borderRadius: '12px',
        padding: '12px 16px',
        flex: 1,
        minWidth: '140px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          fontSize: 11, 
          fontWeight: 500,
          marginBottom: 6, 
          color: '#999',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Miglior Anno
        </div>
        <div style={{ 
          fontSize: 18, 
          fontWeight: 700, 
          color: '#66bb6a',
          lineHeight: 1.2
        }}>
          {best != null ? `${Number(best).toFixed(2)}%` : '—'}
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#1a1a1a',
        border: '2px solid #ef5350',
        borderRadius: '12px',
        padding: '12px 16px',
        flex: 1,
        minWidth: '140px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          fontSize: 11, 
          fontWeight: 500,
          marginBottom: 6, 
          color: '#999',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Peggior Anno
        </div>
        <div style={{ 
          fontSize: 18, 
          fontWeight: 700, 
          color: '#ef5350',
          lineHeight: 1.2
        }}>
          {worst != null ? `${Number(worst).toFixed(2)}%` : '—'}
        </div>
      </div>
    </div>
  );
}