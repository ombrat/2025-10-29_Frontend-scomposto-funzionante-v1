import React from 'react';
import '../../styles/components.css';

export default function Input({ className = '', style = {}, ...props }) {
  return (
    <input
      className={`input ${className}`}
      style={style}
      {...props}
    />
  );
}