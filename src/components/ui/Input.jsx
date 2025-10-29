import React from 'react';

export default function Input(props) {
  return (
    <input
      {...props}
      style={{
        padding: '10px 12px',
        background: '#1f1f1f',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: 8,
        outline: 'none',
        ...props.style
      }}
    />
  );
}