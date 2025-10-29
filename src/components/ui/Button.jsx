import React from 'react';

export default function Button({ children, onClick, style = {}, disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#555' : '#1e88e5',
        color: '#fff',
        fontWeight: 700,
        ...style
      }}
    >
      {children}
    </button>
  );
}