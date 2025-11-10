import React, { useState, useEffect } from 'react';
import macroService from '../services/macroService.js';
import Spinner from '../components/ui/Spinner.jsx';
import HistoricalChart from '../components/charts/HistoricalChart.jsx';

/**
 * Pagina dedicata agli eventi macro economici e analisi
 * Versione ottimizzata per evitare layout shifts
 */
export default function AnalysisPage() {
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImportance, setSelectedImportance] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Stati per caricamento progressivo
  const [contentReady, setContentReady] = useState(false);
  const [updatingRealData, setUpdatingRealData] = useState(false);

  // Carica i dati macro all'avvio
  useEffect(() => {
    loadMacroData();
  }, []);

  const loadMacroData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setContentReady(false);
    }
    setError(null);

    try {
      console.log('📊 STEP 1: Caricamento dati base...');
      
      // STEP 1: Carica dati mock iniziali per stabilizzare layout
      const mockData = macroService.getMockMacroDataWithHistory();
      setMacroData(mockData);
      setContentReady(true);
      setLoading(false);
      
      console.log('✅ STEP 1 completato - Layout stabilizzato con dati mock');
      
      // STEP 2: Aggiorna con dati reali in background (senza alterare layout)
      console.log('� STEP 2: Aggiornamento dati reali in background...');
      
      try {
        const realData = await macroService.getMacroDataWithHistory(forceRefresh, 5);
        
        // Aggiorna SOLO i dati, mantenendo la struttura layout
        setMacroData(prevData => ({
          ...prevData,
          ...realData,
          // Preserva struttura per evitare shift
          events: realData.events || prevData.events,
          historical: realData.historical || prevData.historical,
          statistics: realData.statistics || prevData.statistics
        }));
        
        console.log('✅ STEP 2 completato - Dati reali caricati senza layout shift');
        
      } catch (apiError) {
        console.warn('⚠️ STEP 2 fallito - Mantengo dati mock:', apiError.message);
        // Layout già stabile con dati mock, nessun problema
      }
      
      if (forceRefresh) setRefreshing(false);
      
      setMacroData(data);
      setContentReady(true);
      
    } catch (err) {
      console.error('❌ Errore caricamento STEP 1:', err);
      setError('Errore nel caricamento dei dati macro. Riprova più tardi.');
      setLoading(false);
      setContentReady(true);
      if (forceRefresh) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadMacroData(true);
  };

  // Filtra eventi basati sui filtri selezionati
  const filteredEvents = (macroData && contentReady) ? 
    macroService.filterEventsByCountry(
      macroService.filterEventsByImportance(macroData.events || [], selectedImportance), 
      selectedCountry
    ) : [];

  // Raggruppa eventi per data
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  const getImportanceColor = (importance) => {
    const colors = {
      'high': '#ef5350',
      'medium': '#ffa726', 
      'low': '#66bb6a'
    };
    return colors[importance] || '#999';
  };

  const getImpactIcon = (impact) => {
    const icons = {
      'positive': '📈',
      'negative': '📉',
      'neutral': '➡️',
      'pending': '⏳'
    };
    return icons[impact] || '📊';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Domani';
    if (diffDays === -1) return 'Ieri';
    if (diffDays > 0) return `Tra ${diffDays} giorni`;
    return `${Math.abs(diffDays)} giorni fa`;
  };

  return (
    <div style={{
      padding: '40px',
      background: '#0a0a0a',
      minHeight: 'calc(100vh - 160px)',
      color: '#fff'
    }}>
      {/* Global CSS per animazioni */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Header fisso */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <div>
          <h1 style={{
            fontSize: '48px',
            margin: '0 0 20px 0',
            background: 'linear-gradient(45deg, #1e88e5, #66bb6a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📊 Analisi Macro Economica
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#999',
            margin: 0,
            lineHeight: 1.6
          }}>
            Calendario eventi e indicatori economici per le decisioni di investimento
          </p>
        </div>
        
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          style={{
            padding: '12px 24px',
            background: refreshing ? '#333' : 'linear-gradient(45deg, #1e88e5, #66bb6a)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: refreshing ? 'default' : 'pointer',
            opacity: refreshing ? 0.7 : 1
          }}
        >
          {refreshing ? '⟳ Aggiornamento...' : '🔄 Aggiorna'}
        </button>
      </div>

      {/* Loading overlay per prima volta */}
      {loading && !contentReady && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(10, 10, 10, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Spinner />
          <p style={{ marginTop: '20px', fontSize: '18px' }}>
            Caricamento analisi macro economiche...
          </p>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#999' }}>
            Preparazione dati storici e eventi in corso
          </p>
        </div>
      )}

      {/* Contenuto principale - sempre renderizzato ma nascosto durante loading */}
      <div style={{ 
        opacity: (!loading && contentReady) ? 1 : 0.3,
        transition: 'opacity 0.5s ease',
        pointerEvents: (!loading && contentReady) ? 'auto' : 'none'
      }}>
        
        {error ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(239, 83, 80, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 83, 80, 0.3)'
          }}>
            <p style={{ color: '#ef5350', fontSize: '18px', marginBottom: '20px' }}>
              {error}
            </p>
            <button 
              onClick={() => loadMacroData(true)}
              style={{
                padding: '12px 24px',
                background: '#ef5350',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Riprova
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard Indicatori */}
            <div style={{ marginBottom: '50px' }}>
              <h2 style={{
                fontSize: '32px',
                margin: '0 0 30px 0',
                color: '#fff'
              }}>
                📈 Indicatori Chiave
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                {macroData?.indicators?.map((indicator) => (
                  <div key={indicator.name} className="fade-in" style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '10px',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>{indicator.country}</span>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#66bb6a' 
                      }}>
                        {indicator.name}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      marginBottom: '10px'
                    }}>
                      <span style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}>
                        {indicator.current}
                      </span>
                      
                      {indicator.previous && (
                        <span style={{
                          fontSize: '14px',
                          color: indicator.trend === 'up' ? '#66bb6a' : 
                                 indicator.trend === 'down' ? '#ef5350' : '#999',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {indicator.trend === 'up' ? '↗' : indicator.trend === 'down' ? '↘' : '→'}
                          Prec: {indicator.previous}
                        </span>
                      )}
                    </div>
                    
                    <p style={{
                      fontSize: '14px',
                      color: '#999',
                      margin: 0,
                      lineHeight: 1.4
                    }}>
                      {indicator.description}
                    </p>
                  </div>
                )) || [...Array(8)].map((_, i) => (
                  <div key={i} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    minHeight: '120px'
                  }}>
                    <div style={{
                      height: '20px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      width: '70%',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></div>
                    <div style={{
                      height: '30px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      width: '50%',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></div>
                    <div style={{
                      height: '15px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      width: '80%',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtri */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{
                fontSize: '32px',
                margin: '0 0 20px 0',
                color: '#fff'
              }}>
                🗓️ Calendario Eventi
              </h2>
              
              <div style={{
                display: 'flex',
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#999',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Importanza:
                  </label>
                  <select 
                    value={selectedImportance} 
                    onChange={(e) => setSelectedImportance(e.target.value)}
                    style={{
                      padding: '10px 15px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="all">Tutti</option>
                    <option value="high">Alta 🔴</option>
                    <option value="medium">Media 🟠</option>
                    <option value="low">Bassa 🟢</option>
                  </select>
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    color: '#999',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Paese:
                  </label>
                  <select 
                    value={selectedCountry} 
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    style={{
                      padding: '10px 15px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="all">Tutti</option>
                    <option value="🇺🇸">🇺🇸 USA</option>
                    <option value="🇪🇺">🇪🇺 Eurozona</option>
                    <option value="🇬🇧">🇬🇧 UK</option>
                    <option value="🇯🇵">🇯🇵 Giappone</option>
                    <option value="🇨🇳">🇨🇳 Cina</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calendario Eventi */}
            <div style={{ marginBottom: '50px' }}>
              {Object.keys(eventsByDate).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}>
                  <p>Nessun evento trovato con i filtri selezionati</p>
                </div>
              ) : (
                Object.entries(eventsByDate)
                  .sort(([a], [b]) => new Date(a) - new Date(b))
                  .map(([date, events]) => (
                    <div key={date} className="fade-in" style={{ marginBottom: '40px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        padding: '0 20px'
                      }}>
                        <h3 style={{
                          fontSize: '24px',
                          color: '#fff',
                          margin: 0
                        }}>
                          {new Date(date).toLocaleDateString('it-IT', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <span style={{
                          fontSize: '16px',
                          color: '#66bb6a',
                          fontWeight: '500'
                        }}>
                          {formatDate(date)}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px'
                      }}>
                        {events.map((event) => (
                          <div key={event.id} style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                marginBottom: '10px'
                              }}>
                                <span style={{ fontSize: '20px' }}>{event.country}</span>
                                <span style={{ 
                                  color: '#999', 
                                  fontSize: '14px' 
                                }}>
                                  {event.time}
                                </span>
                                <div style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  backgroundColor: getImportanceColor(event.importance)
                                }}></div>
                              </div>
                              
                              <h4 style={{
                                fontSize: '18px',
                                color: '#fff',
                                margin: '0 0 8px 0',
                                fontWeight: '600'
                              }}>
                                {event.name}
                              </h4>
                              
                              <p style={{
                                fontSize: '14px',
                                color: '#999',
                                margin: '0 0 15px 0',
                                lineHeight: 1.4
                              }}>
                                {event.description}
                              </p>
                              
                              <div style={{
                                display: 'flex',
                                gap: '20px',
                                flexWrap: 'wrap'
                              }}>
                                {event.forecast && (
                                  <div>
                                    <span style={{ color: '#999', fontSize: '12px' }}>Previsione: </span>
                                    <span style={{ color: '#fff', fontWeight: '500' }}>{event.forecast}</span>
                                  </div>
                                )}
                                
                                {event.actual && (
                                  <div>
                                    <span style={{ color: '#999', fontSize: '12px' }}>Dato effettivo: </span>
                                    <span style={{ color: '#66bb6a', fontWeight: '500' }}>{event.actual}</span>
                                  </div>
                                )}
                                
                                {event.previous && (
                                  <div>
                                    <span style={{ color: '#999', fontSize: '12px' }}>Precedente: </span>
                                    <span style={{ color: '#fff', fontWeight: '500' }}>{event.previous}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              marginLeft: '20px'
                            }}>
                              <span style={{ fontSize: '24px', marginBottom: '5px' }}>
                                {getImpactIcon(event.impact)}
                              </span>
                              <span style={{
                                fontSize: '12px',
                                color: event.impact === 'positive' ? '#66bb6a' : 
                                       event.impact === 'negative' ? '#ef5350' : '#999',
                                textAlign: 'center'
                              }}>
                                {event.impact === 'positive' ? 'Positivo' : 
                                 event.impact === 'negative' ? 'Negativo' : 
                                 event.impact === 'neutral' ? 'Neutrale' : 'In attesa'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Storico Dati Macro - Vista Tabellare */}
            {macroData?.historical && contentReady && (
              <div style={{ marginBottom: '50px' }}>
                <h2 style={{
                  fontSize: '32px',
                  margin: '0 0 20px 0',
                  color: '#fff'
                }}>
                  � Storico Indicatori Macro
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#999',
                  marginBottom: '30px'
                }}>
                  Dati storici degli ultimi 5 anni per i principali indicatori economici
                </p>

                {/* Statistiche Riassuntive */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  padding: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '30px'
                }}>
                  <h3 style={{
                    fontSize: '24px',
                    margin: '0 0 20px 0',
                    color: '#fff'
                  }}>
                    📈 Panoramica Statistiche
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px'
                  }}>
                    {Object.entries(macroData.statistics || {}).map(([indicator, stats]) => {
                      const indicatorNames = {
                        'gdp': 'PIL (%)',
                        'inflation': 'Inflazione (%)',
                        'unemployment': 'Disoccupazione (%)',
                        'federal_funds_rate': 'Fed Rate (%)',
                        'consumer_sentiment': 'Consumer Sentiment',
                        'retail_sales': 'Retail Sales (%)',
                        'nonfarm_payroll': 'NFP (K)'
                      };
                      
                      const name = indicatorNames[indicator] || indicator;
                      const trendColor = stats.trend > 0 ? '#66bb6a' : stats.trend < 0 ? '#ef5350' : '#ffa726';
                      
                      return (
                        <div key={indicator} className="fade-in" style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          padding: '20px'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            color: '#66bb6a',
                            fontWeight: '600',
                            marginBottom: '8px'
                          }}>
                            {name}
                          </div>
                          
                          <div style={{
                            fontSize: '20px',
                            color: '#fff',
                            fontWeight: 'bold',
                            marginBottom: '5px'
                          }}>
                            {stats.lastValue?.toFixed(2)}
                          </div>
                          
                          <div style={{
                            fontSize: '12px',
                            color: trendColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>
                              {stats.trend > 0 ? '↗' : stats.trend < 0 ? '↘' : '→'}
                            </span>
                            <span>
                              Trend: {Math.abs(stats.trend).toFixed(3)}
                            </span>
                          </div>
                          
                          <div style={{
                            fontSize: '11px',
                            color: '#999',
                            marginTop: '8px',
                            lineHeight: 1.3
                          }}>
                            <div>Media: {stats.average}</div>
                            <div>Range: {stats.minimum} - {stats.maximum}</div>
                            <div>Mediana: {stats.median}</div>
                            <div>Punti dati: {stats.dataPoints}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabelle Dati Storici per Indicatore */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                  gap: '30px'
                }}>
                  {Object.entries(macroData.historical).slice(0, 6).map(([indicator, data]) => {
                    const indicatorNames = {
                      'gdp': 'PIL (Crescita %)',
                      'inflation': 'Inflazione (%)',
                      'unemployment': 'Disoccupazione (%)',
                      'federal_funds_rate': 'Federal Funds Rate (%)',
                      'consumer_sentiment': 'Consumer Sentiment',
                      'retail_sales': 'Retail Sales (%)',
                      'nonfarm_payroll': 'Nonfarm Payroll (K)'
                    };

                    const name = indicatorNames[indicator] || indicator.toUpperCase();
                    const recentData = data.slice(-12); // Ultimi 12 mesi

                    return (
                      <div key={indicator} className="fade-in" style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        overflow: 'hidden'
                      }}>
                        {/* Header tabella */}
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '20px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <h4 style={{
                            margin: 0,
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: '600'
                          }}>
                            {name}
                          </h4>
                          <p style={{
                            margin: '5px 0 0 0',
                            color: '#999',
                            fontSize: '14px'
                          }}>
                            Ultimi 12 mesi
                          </p>
                        </div>

                        {/* Tabella dati */}
                        <div style={{
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse'
                          }}>
                            <thead style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              position: 'sticky',
                              top: 0
                            }}>
                              <tr>
                                <th style={{
                                  padding: '12px 20px',
                                  textAlign: 'left',
                                  color: '#66bb6a',
                                  fontSize: '14px',
                                  fontWeight: '600'
                                }}>
                                  Data
                                </th>
                                <th style={{
                                  padding: '12px 20px',
                                  textAlign: 'right',
                                  color: '#66bb6a',
                                  fontSize: '14px',
                                  fontWeight: '600'
                                }}>
                                  Valore
                                </th>
                                <th style={{
                                  padding: '12px 20px',
                                  textAlign: 'right',
                                  color: '#66bb6a',
                                  fontSize: '14px',
                                  fontWeight: '600'
                                }}>
                                  Variazione
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentData.map((dataPoint, index) => {
                                const prevValue = index > 0 ? recentData[index - 1].value : null;
                                const change = prevValue ? ((dataPoint.value - prevValue) / prevValue * 100) : null;
                                const changeColor = change > 0 ? '#66bb6a' : change < 0 ? '#ef5350' : '#999';
                                
                                return (
                                  <tr key={`${indicator}-${index}`} style={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                  }}>
                                    <td style={{
                                      padding: '12px 20px',
                                      color: '#fff',
                                      fontSize: '14px'
                                    }}>
                                      {new Date(dataPoint.date).toLocaleDateString('it-IT', {
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </td>
                                    <td style={{
                                      padding: '12px 20px',
                                      textAlign: 'right',
                                      color: '#fff',
                                      fontSize: '14px',
                                      fontWeight: '500'
                                    }}>
                                      {indicator === 'nonfarm_payroll' 
                                        ? Math.round(dataPoint.value).toLocaleString()
                                        : dataPoint.value.toFixed(2)
                                      }
                                    </td>
                                    <td style={{
                                      padding: '12px 20px',
                                      textAlign: 'right',
                                      color: change !== null ? changeColor : '#999',
                                      fontSize: '13px',
                                      fontWeight: '500'
                                    }}>
                                      {change !== null ? (
                                        <>
                                          {change > 0 ? '↗' : change < 0 ? '↘' : '→'}
                                          {Math.abs(change).toFixed(2)}%
                                        </>
                                      ) : (
                                        '-'
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strumenti di Analisi */}
            <div>
              <h2 style={{
                fontSize: '32px',
                margin: '0 0 20px 0',
                color: '#fff'
              }}>
                🔬 Strumenti di Analisi Quantitativa
              </h2>
              <p style={{
                fontSize: '18px',
                color: '#999',
                margin: '0 0 30px 0'
              }}>
                Strumenti avanzati per l'analisi tecnica del tuo portafoglio
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '30px',
                marginBottom: '50px'
              }}>
                {[
                  {
                    id: 'monte-carlo',
                    icon: '🎲',
                    name: 'Simulazione Monte Carlo',
                    description: 'Analizza migliaia di scenari possibili per valutare il rischio del portafoglio',
                    features: [
                      'Simulazioni multiple parallele',
                      'Distribuzione dei rendimenti',
                      'Analisi del Value at Risk (VaR)',
                      'Scenario stress testing'
                    ],
                    status: 'available'
                  },
                  {
                    id: 'efficient-frontier',
                    icon: '📈',
                    name: 'Frontiera Efficiente',
                    description: 'Ottimizzazione del rapporto rischio-rendimento secondo Markowitz',
                    features: [
                      'Calcolo portafogli ottimali',
                      'Analisi rischio/rendimento',
                      'Sharpe ratio ottimale',
                      'Diversificazione efficace'
                    ],
                    status: 'available'
                  },
                  {
                    id: 'backtest',
                    icon: '⏰',
                    name: 'Backtesting Avanzato',
                    description: 'Test delle performance storiche con analisi dettagliata',
                    features: [
                      'Performance storiche',
                      'Drawdown analysis',
                      'Metriche di rischio',
                      'Confronto benchmark'
                    ],
                    status: 'available'
                  },
                  {
                    id: 'correlation',
                    icon: '🔗',
                    name: 'Analisi Correlazioni',
                    description: 'Studio delle correlazioni tra asset e settori',
                    features: [
                      'Matrice correlazioni',
                      'Clustering settoriali',
                      'Analisi temporale',
                      'Risk decomposition'
                    ],
                    status: 'development'
                  },
                  {
                    id: 'var-analysis',
                    icon: '📉',
                    name: 'Value at Risk',
                    description: 'Calcolo del rischio massimo potenziale in condizioni normali',
                    features: [
                      'VaR parametrico',
                      'VaR storico',
                      'Expected Shortfall',
                      'Stress scenarios'
                    ],
                    status: 'development'
                  },
                  {
                    id: 'black-litterman',
                    icon: '🧮',
                    name: 'Black-Litterman',
                    description: 'Ottimizzazione avanzata con views soggettive del mercato',
                    features: [
                      'Incorpora views market',
                      'Riduce errori stima',
                      'Portafogli stabili',
                      'Prior bayesiani'
                    ],
                    status: 'planned'
                  }
                ].map((tool) => (
                  <div key={tool.id} className="fade-in" style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    padding: '30px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      marginBottom: '15px'
                    }}>
                      <span style={{ fontSize: '32px' }}>{tool.icon}</span>
                      <h3 style={{
                        fontSize: '20px',
                        color: '#fff',
                        margin: 0,
                        fontWeight: '600'
                      }}>
                        {tool.name}
                      </h3>
                    </div>
                    
                    <p style={{
                      fontSize: '16px',
                      color: '#999',
                      margin: '0 0 20px 0',
                      lineHeight: 1.5
                    }}>
                      {tool.description}
                    </p>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{
                        fontSize: '16px',
                        color: '#66bb6a',
                        margin: '0 0 10px 0'
                      }}>
                        Caratteristiche principali:
                      </h4>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        color: '#999'
                      }}>
                        {tool.features.map((feature, idx) => (
                          <li key={idx} style={{ marginBottom: '5px' }}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <span style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        background: tool.status === 'available' ? 'rgba(102, 187, 106, 0.2)' : 
                                   tool.status === 'development' ? 'rgba(255, 167, 38, 0.2)' : 
                                   'rgba(158, 158, 158, 0.2)',
                        color: tool.status === 'available' ? '#66bb6a' : 
                               tool.status === 'development' ? '#ffa726' : 
                               '#999'
                      }}>
                        {tool.status === 'available' ? '✅ Disponibile' : 
                         tool.status === 'development' ? '🚧 In sviluppo' : 
                         '📅 Pianificato'}
                      </span>
                    </div>
                  </div>
                ))}
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
                  Pronto per l'analisi quantitativa?
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: '#999',
                  margin: '0 0 30px 0',
                  lineHeight: 1.6
                }}>
                  Utilizza gli strumenti di analisi avanzata direttamente nel simulatore di backtest
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
                  🚀 Inizia l'Analisi
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}