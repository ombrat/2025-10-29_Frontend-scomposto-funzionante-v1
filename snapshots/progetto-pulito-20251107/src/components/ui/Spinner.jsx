import React from 'react';

export default function Spinner({ size = 18 }) {
  // Converti size string in numeri
  const sizeMap = {
    'small': 16,
    'medium': 24,
    'large': 32
  };
  
  const spinnerSize = typeof size === 'string' ? sizeMap[size] || 18 : size;
  
  return (
    <svg width={spinnerSize} height={spinnerSize} viewBox="0 0 50 50" style={{ display: 'inline-block' }}>
      <circle cx="25" cy="25" r="20" stroke="#fff" strokeWidth="4" strokeOpacity="0.12" fill="none" />
      <path fill="#fff" d="M25 5 A20 20 0 0 1 45 25" >
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}