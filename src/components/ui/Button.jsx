import React from 'react';
import '../../styles/components.css';

export default function Button({ children, onClick, variant = 'default', className = '', disabled = false, style = {}, ...rest }) {
  const base = 'btn';
  const vClass = variant === 'primary' ? 'btn-primary' : variant === 'accent' ? 'btn-accent' : variant === 'danger' ? 'btn-danger' : '';
  return (
    <button
      className={`${base} ${vClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}