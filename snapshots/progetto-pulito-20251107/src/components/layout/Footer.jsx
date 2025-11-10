import React from 'react';

export default function Footer() {
  return (
    <footer style={{ padding: 12, borderTop: '1px solid #141414', textAlign: 'center', color: '#777', fontSize: 13 }}>
      © {new Date().getFullYear()} - Simulatore · UI skeleton
    </footer>
  );
}