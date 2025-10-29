import React from 'react';

export default function Header() {
  return (
    <header style={{
      padding: '14px 22px',
      borderBottom: '1px solid #222',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'linear-gradient(90deg,#0b0b0b,#0f0f0f)'
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h1 style={{ color: '#66bb6a', margin: 0, fontSize: 18 }}>Simulatore di Backtest Finanziario</h1>
        <div style={{ color: '#999', fontSize: 12 }}>v7.5 (frontend)</div>
      </div>
      <div style={{ color: '#aaa', fontSize: 13 }}>Local UI</div>
    </header>
  );
}