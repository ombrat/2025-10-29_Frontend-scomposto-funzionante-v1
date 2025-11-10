import React from 'react';
import Header from './Header';
import Footer from './Footer';
import '../../styles/components.css';

/**
 * MainLayout - layout principale con grid adattiva.
 * Ora calcola dinamicamente grid-template-columns in base a left/right.
 * Se left e right sono entrambi falsy -> colonna centrale unica (full-width).
 */
export default function MainLayout({ left, center, right }) {
  // decide la struttura a colonne in base alla presenza di left/right
  let gridTemplateColumns = '320px 1fr 360px';
  if (!left && !right) gridTemplateColumns = '1fr';
  else if (!left && right) gridTemplateColumns = '1fr 360px';
  else if (left && !right) gridTemplateColumns = '320px 1fr';

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns,
    gap: '18px',
    padding: '22px',
    maxWidth: '1300px',
    margin: '18px auto',
    boxSizing: 'border-box'
  };

  return (
    <div className="app-root-layout">
      <Header />
      <div className="layout-container" style={containerStyle}>
        {left ? <aside className="layout-left">{left}</aside> : null}
        <main className="layout-center">{center}</main>
        {right ? <aside className="layout-right">{right}</aside> : null}
      </div>
      <Footer />
    </div>
  );
}