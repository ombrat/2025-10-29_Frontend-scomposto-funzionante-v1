import React from 'react';

export default function SkeletonBox({ height = 16, width = '100%', borderRadius = 6 }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      marginBottom: 8
    }} />
  );
}
