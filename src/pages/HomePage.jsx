import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Homepage del sito PortfolioLab
 */
export default function HomePage() {
  const features = [
    {
      icon: '📊',
      title: 'Backtest Avanzato',
      description: 'Testa le tue strategie di investimento con dati storici reali e analisi dettagliate.',
      path: '/backtest',
      color: '#1e88e5'
    },
    {
      icon: '💼',
      title: 'Gestione Portfolio',
      description: 'Visualizza e analizza la composizione del tuo portafoglio con grafici interattivi.',
      path: '/portfolio',
      color: '#66bb6a'
    },
    {
      icon: '📈',
      title: 'Analisi Quantitative',
      description: 'Simulazioni Monte Carlo, frontiera efficiente e metriche di rischio avanzate.',
      path: '/analysis',
      color: '#ff7043'
    },
    {
      icon: '📰',
      title: 'News Finanziarie',
      description: '40+ articoli aggiornati automaticamente da fonti autoritative. 8 categorie specializzate.',
      path: '/news',
      color: '#ab47bc'
    }
  ];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px'
    }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '80px 0',
        background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1) 0%, rgba(102, 187, 106, 0.1) 100%)',
        borderRadius: '16px',
        margin: '40px 0'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          margin: '0 0 20px 0',
          background: 'linear-gradient(45deg, #1e88e5, #66bb6a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          PortfolioLab
        </h1>
        <h2 style={{
          fontSize: '24px',
          color: '#ccc',
          margin: '0 0 30px 0',
          fontWeight: 'normal'
        }}>
          Laboratorio Avanzato per l'Analisi Finanziaria
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#999',
          lineHeight: 1.6,
          maxWidth: '600px',
          margin: '0 auto 40px auto'
        }}>
          Strumenti professionali per il backtest, l'ottimizzazione di portafoglio 
          e l'analisi quantitativa degli investimenti. 
          Tutto quello che serve per prendere decisioni informate.
        </p>
        <Link
          to="/backtest"
          style={{
            display: 'inline-block',
            padding: '16px 32px',
            background: 'linear-gradient(45deg, #1e88e5, #66bb6a)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(30, 136, 229, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(30, 136, 229, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(30, 136, 229, 0.3)';
          }}
        >
          🚀 Inizia il Backtest
        </Link>
      </section>

      {/* Features Grid */}
      <section style={{ margin: '60px 0' }}>
        <h3 style={{
          fontSize: '32px',
          textAlign: 'center',
          margin: '0 0 50px 0',
          color: '#fff'
        }}>
          Funzionalità Principali
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px'
        }}>
          {features.map((feature) => (
            <Link
              key={feature.path}
              to={feature.path}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '30px',
                transition: 'all 0.3s ease',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.borderColor = feature.color;
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = `0 8px 25px ${feature.color}20`;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.02)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={{
                fontSize: '48px',
                marginBottom: '20px'
              }}>
                {feature.icon}
              </div>
              <h4 style={{
                fontSize: '20px',
                margin: '0 0 15px 0',
                color: '#fff',
                fontWeight: '600'
              }}>
                {feature.title}
              </h4>
              <p style={{
                fontSize: '16px',
                lineHeight: 1.6,
                color: '#999',
                margin: 0
              }}>
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        padding: '40px',
        margin: '60px 0',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '28px',
          margin: '0 0 40px 0',
          color: '#fff'
        }}>
          Perché Scegliere PortfolioLab?
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '30px'
        }}>
          {[
            { number: '10+', label: 'Anni di Dati Storici' },
            { number: '50+', label: 'Indicatori Tecnici' },
            { number: '1000+', label: 'Asset Supportati' },
            { number: '100%', label: 'Open Source' }
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#66bb6a',
                marginBottom: '10px'
              }}>
                {stat.number}
              </div>
              <div style={{
                fontSize: '16px',
                color: '#999'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}