import React from 'react';

export default function InfoBox({ title, value, subtitle, color = '#66bb6a' }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: '16px 20px',
      minWidth: '180px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    }}>
      <div style={{ 
        fontSize: 12, 
        fontWeight: 500,
        marginBottom: 8, 
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>{title}</div>
      <div style={{ 
        fontSize: 24, 
        fontWeight: 700, 
        color: color,
        lineHeight: 1.2,
        marginBottom: subtitle ? 4 : 0
      }}>{value}</div>
      {subtitle && <div style={{ 
        fontSize: 11, 
        color: '#bbb',
        fontWeight: 400
      }}>{subtitle}</div>}
    </div>
  );
}
