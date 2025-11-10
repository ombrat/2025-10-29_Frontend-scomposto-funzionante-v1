import React from 'react';

/**
 * Pagina dedicata alla gestione e analisi del Portfolio
 */
export default function PortfolioPage() {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      {/* Header della pagina */}
      <div style={{
        textAlign: 'center',
        marginBottom: '50px'
      }}>
        <h1 style={{
          fontSize: '36px',
          margin: '0 0 15px 0',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px'
        }}>
          💼 Gestione Portfolio
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#999',
          margin: 0,
          lineHeight: 1.6
        }}>
          Analizza, ottimizza e monitora la composizione del tuo portafoglio di investimenti
        </p>
      </div>

      {/* Sezioni principali */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '30px',
        marginBottom: '50px'
      }}>
        {/* Composizione Portfolio */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '30px'
        }}>
          <h3 style={{
            fontSize: '20px',
            margin: '0 0 20px 0',
            color: '#66bb6a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🥧 Composizione Attuale
          </h3>
          <p style={{
            color: '#999',
            lineHeight: 1.6,
            marginBottom: '20px'
          }}>
            Visualizza la distribuzione dei tuoi asset per settori, geografiie valute.
          </p>
          <div style={{
            background: 'rgba(102, 187, 106, 0.1)',
            borderRadius: '8px',
            padding: '15px',
            textAlign: 'center',
            color: '#66bb6a',
            fontSize: '14px'
          }}>
            📊 Disponibile nella sezione Backtest
          </div>
        </div>

        {/* Ottimizzazione */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '30px'
        }}>
          <h3 style={{
            fontSize: '20px',
            margin: '0 0 20px 0',
            color: '#1e88e5',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚖️ Ottimizzazione Pesi
          </h3>
          <p style={{
            color: '#999',
            lineHeight: 1.6,
            marginBottom: '20px'
          }}>
            Utilizza algoritmi di ottimizzazione per bilanciare rischio e rendimento.
          </p>
          <div style={{
            background: 'rgba(30, 136, 229, 0.1)',
            borderRadius: '8px',
            padding: '15px',
            textAlign: 'center',
            color: '#1e88e5',
            fontSize: '14px'
          }}>
            🔄 In sviluppo
          </div>
        </div>
      </div>

      {/* Metriche principali */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        padding: '40px',
        marginBottom: '50px'
      }}>
        <h3 style={{
          fontSize: '24px',
          margin: '0 0 30px 0',
          color: '#fff',
          textAlign: 'center'
        }}>
          📊 Metriche di Portfolio
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '30px'
        }}>
          {[
            { label: 'Rendimento Totale', value: '-', color: '#66bb6a' },
            { label: 'Volatilità Annua', value: '-', color: '#ff7043' },
            { label: 'Sharpe Ratio', value: '-', color: '#1e88e5' },
            { label: 'Max Drawdown', value: '-', color: '#e53e3e' }
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: metric.color,
                marginBottom: '8px'
              }}>
                {metric.value}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#999'
              }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div style={{
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1) 0%, rgba(102, 187, 106, 0.1) 100%)',
        borderRadius: '12px',
        padding: '40px'
      }}>
        <h3 style={{
          fontSize: '24px',
          margin: '0 0 15px 0',
          color: '#fff'
        }}>
          Pronto per analizzare il tuo portfolio?
        </h3>
        <p style={{
          fontSize: '16px',
          color: '#999',
          margin: '0 0 30px 0',
          lineHeight: 1.6
        }}>
          Inizia con un backtest per vedere come si comportano i tuoi investimenti nel tempo
        </p>
        <a
          href="/backtest"
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: 'linear-gradient(45deg, #1e88e5, #66bb6a)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          📊 Vai al Backtest
        </a>
      </div>
    </div>
  );
}