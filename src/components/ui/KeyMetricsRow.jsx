import React from 'react';
import { formatMoney } from '../../utils/formatters';

const KeyMetricsRow = ({ summary }) => {
  if (!summary) return null;

  const formatNumber = (value, key) => {
    if (typeof value !== 'number') return value;
    if (key.includes('percent') || key.includes('volatility') || key.includes('drawdown') || key.includes('cagr') || key.includes('return') || key.includes('year')) {
      return `${value.toFixed(2)}%`;
    }
    if (key.includes('final_value') || key.includes('value') || key === 'total_invested') {
      return formatMoney(value);
    }
    if (key.includes('ratio') || key.includes('sharpe')) {
      return value.toFixed(3);
    }
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(2);
  };

  const metrics = [
    { label: 'Rendimento Annuo (CAGR)', key: 'cagr_approx', icon: '📈', color: '#66bb6a' },
    { label: 'Rendimento Totale', key: 'total_return_percentage', icon: '💰', color: '#66bb6a' },
    { label: 'Volatilità Annua', key: 'annual_volatility', icon: '📊', color: '#ffb300' },
    { label: 'Sharpe Ratio', key: 'sharpe_ratio', icon: '⚡', color: '#1e88e5' },
    { label: 'Valore Finale', key: 'final_value', icon: '🎯', color: '#ffffff' },
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
      {metrics.map((metric, index) => (
        <div
          key={metric.key}
          style={{
            background: `linear-gradient(135deg, rgba(${metric.color === '#66bb6a' ? '102, 187, 106' : metric.color === '#ffb300' ? '255, 179, 0' : metric.color === '#1e88e5' ? '30, 136, 229' : '255, 255, 255'}, 0.05) 0%, rgba(${metric.color === '#66bb6a' ? '102, 187, 106' : metric.color === '#ffb300' ? '255, 179, 0' : metric.color === '#1e88e5' ? '30, 136, 229' : '255, 255, 255'}, 0.1) 100%)`,
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
            {formatNumber(summary[metric.key], metric.key)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KeyMetricsRow;