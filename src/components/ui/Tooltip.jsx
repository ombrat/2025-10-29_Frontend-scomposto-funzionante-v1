import React from 'react';

export default function Tooltip({ style = {}, children }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg,#151515,#1e1e1e)',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: 8,
      borderRadius: 8,
      color: '#e6e6e6',
      fontSize: 12,
      ...style
    }}>
      {children}
    </div>
  );
}