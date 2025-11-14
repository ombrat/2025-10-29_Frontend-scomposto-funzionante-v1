import React, { useState, useCallback, useEffect } from 'react';
import yahooFinanceService from '../services/yahooFinanceService';
import Spinner from '../components/ui/Spinner';

/**
 * 🏦 Stock Analysis Page
 * Pagina per cercare e analizzare azioni tramite Yahoo Finance API
 */
export default function StockAnalysisPage() {
  // Stati search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Stati ticker selezionato
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [tickerData, setTickerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 🔍 Gestione ricerca ticker
   */
  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const results = await yahooFinanceService.searchTicker(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Errore ricerca:', err);
      setError('Errore durante la ricerca. Riprova.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  /**
   * Debounce della ricerca
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  /**
   * 📊 Carica dati ticker selezionato
   */
  const loadTickerData = async (ticker) => {
    setLoading(true);
    setError(null);
    setSelectedTicker(ticker);
    setSearchResults([]); // Chiudi i risultati di ricerca
    setSearchQuery(ticker.ticker);

    try {
      const info = await yahooFinanceService.getTickerInfo(ticker.ticker);
      const metrics = yahooFinanceService.extractKeyMetrics(info);
      const organizedMetrics = yahooFinanceService.organizeMetricsByCategory(metrics);
      
      setTickerData({
        raw: info,
        metrics: metrics,
        organized: organizedMetrics
      });
      
      console.log('✅ Dati ticker caricati:', metrics);
    } catch (err) {
      console.error('Errore caricamento ticker:', err);
      setError(`Impossibile caricare i dati per ${ticker.ticker}. ${err.message}`);
      setTickerData(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🗑️ Reset ricerca
   */
  const handleReset = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedTicker(null);
    setTickerData(null);
    setError(null);
  };

  return (
    <div style={{
      padding: '40px',
      background: '#0a0a0a',
      minHeight: 'calc(100vh - 160px)',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          margin: '0 0 20px 0',
          background: 'linear-gradient(45deg, #1e88e5, #66bb6a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🏦 Analisi Azioni
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#999',
          margin: 0
        }}>
          Cerca e analizza qualsiasi azione tramite ISIN, Ticker o Nome
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 40px',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Cerca per ISIN, Ticker o Nome (es: AAPL, Apple, US0378331005)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                fontSize: '16px',
                background: '#1a1a1a',
                border: '2px solid #333',
                borderRadius: '12px',
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e88e5'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
            
            {searching && (
              <div style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #333',
                  borderTop: '2px solid #1e88e5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            )}
          </div>

          {(selectedTicker || searchQuery) && (
            <button
              onClick={handleReset}
              style={{
                padding: '15px 30px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#444'}
              onMouseLeave={(e) => e.target.style.background = '#333'}
            >
              🗑️ Reset
            </button>
          )}
        </div>

        {/* Risultati Ricerca */}
        {searchResults.length > 0 && !selectedTicker && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '10px',
            background: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => loadTickerData(result)}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #333' : 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#252525'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <div style={{
                  fontWeight: '600',
                  color: '#1e88e5',
                  marginBottom: '5px'
                }}>
                  {result.ticker}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#999'
                }}>
                  {result.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 40px',
          padding: '20px',
          background: 'rgba(239, 83, 80, 0.1)',
          border: '1px solid rgba(239, 83, 80, 0.3)',
          borderRadius: '12px',
          color: '#ef5350'
        }}>
          <strong>❌ Errore:</strong> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px'
        }}>
          <Spinner />
          <p style={{
            marginTop: '20px',
            fontSize: '18px',
            color: '#999'
          }}>
            Caricamento dati per {selectedTicker?.ticker}...
          </p>
        </div>
      )}

      {/* Dati Ticker */}
      {!loading && tickerData && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Header Ticker */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1), rgba(102, 187, 106, 0.1))',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '40px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '36px',
                  margin: '0 0 10px 0',
                  color: '#fff'
                }}>
                  {tickerData.metrics.symbol}
                </h2>
                <p style={{
                  fontSize: '20px',
                  color: '#999',
                  margin: '0 0 10px 0'
                }}>
                  {tickerData.metrics.longName}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    padding: '5px 15px',
                    background: '#1e88e5',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {tickerData.metrics.sector}
                  </span>
                  <span style={{
                    padding: '5px 15px',
                    background: '#66bb6a',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {tickerData.metrics.industry}
                  </span>
                  <span style={{
                    padding: '5px 15px',
                    background: '#ffa726',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {tickerData.metrics.country}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#66bb6a',
                  marginBottom: '10px'
                }}>
                  {yahooFinanceService.formatValue(tickerData.metrics.currentPrice, 'currency')}
                </div>
                {tickerData.metrics.previousClose && (
                  <div style={{
                    fontSize: '16px',
                    color: '#999'
                  }}>
                    Chiusura precedente: {yahooFinanceService.formatValue(tickerData.metrics.previousClose, 'currency')}
                  </div>
                )}
              </div>
            </div>

            {tickerData.metrics.website && (
              <div style={{ marginTop: '20px' }}>
                <a
                  href={tickerData.metrics.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#1e88e5',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  🌐 {tickerData.metrics.website}
                </a>
              </div>
            )}
          </div>

          {/* Grid Metriche */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {Object.entries(tickerData.organized).map(([categoryKey, category]) => (
              <div
                key={categoryKey}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  padding: '25px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <h3 style={{
                  fontSize: '20px',
                  margin: '0 0 20px 0',
                  color: '#fff',
                  borderBottom: '2px solid rgba(255,255,255,0.1)',
                  paddingBottom: '10px'
                }}>
                  {category.title}
                </h3>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {category.metrics.map((metric, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0'
                      }}
                    >
                      <span style={{
                        color: '#999',
                        fontSize: '14px'
                      }}>
                        {metric.label}
                      </span>
                      <span style={{
                        color: '#fff',
                        fontSize: '15px',
                        fontWeight: '600',
                        fontFamily: metric.type === 'text' ? 'inherit' : 'monospace'
                      }}>
                        {yahooFinanceService.formatValue(metric.value, metric.type)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Debug Info (solo in dev) */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{
              marginTop: '40px',
              padding: '20px',
              background: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #333'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#999'
              }}>
                🔍 Debug: Dati Raw Yahoo Finance
              </summary>
              <pre style={{
                marginTop: '20px',
                padding: '15px',
                background: '#0a0a0a',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#66bb6a',
                overflowX: 'auto'
              }}>
                {JSON.stringify(tickerData.raw, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Placeholder iniziale */}
      {!loading && !tickerData && !error && searchResults.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#666'
        }}>
          <div style={{
            fontSize: '72px',
            marginBottom: '20px'
          }}>
            🔍
          </div>
          <p style={{
            fontSize: '20px',
            marginBottom: '10px'
          }}>
            Inizia la ricerca
          </p>
          <p style={{
            fontSize: '16px',
            color: '#555'
          }}>
            Inserisci un ISIN, Ticker o Nome per cercare un'azione
          </p>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
