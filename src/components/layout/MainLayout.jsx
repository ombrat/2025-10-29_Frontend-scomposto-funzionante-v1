import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import '../../styles/components.css';

export default function MainLayout({ left, center, right }) {
  return (
    <div className="app-root-layout">
      <Header />
      <div className="layout-container">
        <aside className="layout-left">{left}</aside>
        <main className="layout-center">{center}</main>
        <aside className="layout-right">{right}</aside>
      </div>
      <Footer />
    </div>
  );
}