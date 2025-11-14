import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Header component with navigation bar and hamburger menu
 */
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/backtest', label: 'Backtest', icon: '📊' },
    { path: '/portfolio', label: 'Portfolio', icon: '💼' },
    { path: '/analysis', label: 'Analisi', icon: '📈' },
    { path: '/stocks', label: 'Azioni', icon: '🏦' },
    { path: '/news', label: 'News', icon: '📰' },
    { path: '/backend-test', label: 'Backend Test', icon: '🧪' },
    { path: '/about', label: 'About', icon: 'ℹ️' }
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'linear-gradient(90deg, #0a0a0a 0%, #1a1a1a 100%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Main Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '60px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo/Brand */}
        <Link to="/" style={{
          textDecoration: 'none',
          color: '#fff',
          fontSize: '24px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            background: 'linear-gradient(45deg, #1e88e5, #66bb6a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📈 PortfolioLab
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{
          display: 'flex',
          gap: '30px',
          alignItems: 'center'
        }}>
          {navItems.slice(1, 6).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                color: location.pathname === item.path ? '#66bb6a' : '#ccc',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: location.pathname === item.path ? 'rgba(102, 187, 106, 0.1)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.color = '#fff';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.color = '#ccc';
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
          }}
        >
          <div style={{
            width: '20px',
            height: '2px',
            background: '#fff',
            margin: '2px 0',
            transition: 'all 0.3s ease',
            transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
          }} />
          <div style={{
            width: '20px',
            height: '2px',
            background: '#fff',
            margin: '2px 0',
            transition: 'all 0.3s ease',
            opacity: isMenuOpen ? 0 : 1
          }} />
          <div style={{
            width: '20px',
            height: '2px',
            background: '#fff',
            margin: '2px 0',
            transition: 'all 0.3s ease',
            transform: isMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none'
          }} />
        </button>
      </div>

      {/* Mobile/Hamburger Menu */}
      {isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '20px',
          background: 'linear-gradient(180deg, #1a1a1a, #0a0a0a)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          minWidth: '200px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                textDecoration: 'none',
                color: location.pathname === item.path ? '#66bb6a' : '#ccc',
                fontSize: '16px',
                fontWeight: '500',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                background: location.pathname === item.path ? 'rgba(102, 187, 106, 0.1)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = location.pathname === item.path ? 'rgba(102, 187, 106, 0.1)' : 'transparent';
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </header>
  );
}