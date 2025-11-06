import React, { useState, useEffect } from 'react';
import macroService from '../services/macroService.js';
import Spinner from '../components/ui/Spinner.jsx';
import DayTimeline from '../components/analysis/DayTimeline.jsx';

/**
 * Pagina dedicata agli eventi macro economici e analisi
 * Versione con caricamento step-by-step per dati reali
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
  const [apiDebugLog, setApiDebugLog] = useState([]);

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
      console.log('📊 Caricamento dati dal backend Google Cloud Run...');
      setUpdatingRealData(true);
      
      // Logger per debug visibile
      const debugLogger = (message) => {
        console.log('📊 DEBUG:', message);
        setApiDebugLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
      };
      
      debugLogger('Chiamata macroService.fetchMacroDataComplete...');
        
        try {
          debugLogger('Eseguendo fetchMacroDataComplete con 5 anni di dati...');
          const realData = await macroService.fetchMacroDataComplete(5);
          
          debugLogger(`Dati ricevuti: ${Object.keys(realData?.historical || {}).length} indicatori`);
          
          // Sostituisci completamente i dati (come fa NewsService)
        setMacroData(realData);
        
        // Log per UI
        setApiDebugLog(prev => [
          ...prev,
          `✅ Dati caricati: ${Object.keys(realData?.historical || {}).length} indicatori`,
          `� Fonte: ${realData?.source || 'fallback'}`,
          `⏱️ Ultimo aggiornamento: ${new Date().toLocaleTimeString()}`
        ]);
        
        console.log('✅ Dati caricati dal backend Google Cloud Run');
        console.log('🔍 DEBUG - Source ricevuto:', realData?.source);
        
        // Imposta lo stato di completamento solo dopo aver ricevuto i dati dal backend
        setContentReady(true);
        setLoading(false);
        
      } catch (apiError) {
        console.error('❌ Errore backend, fallback a dati mock:', apiError.message);
        
        // Fallback a dati mock solo se il backend fallisce
        const fallbackData = macroService.getMockMacroDataWithHistory();
        setMacroData(fallbackData);
        setContentReady(true);
        setLoading(false);
        
        setApiDebugLog(prev => [...prev, `❌ Errore backend: ${apiError.message}`, '🔄 Utilizzando dati mock come fallback']);
      } finally {
        setUpdatingRealData(false);
      }
      
      if (forceRefresh) setRefreshing(false);
      
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

  // DEBUG: Log eventi per capire il problema
  React.useEffect(() => {
    if (macroData && contentReady) {
      console.log('🔍 DEBUG AnalysisPage - Eventi totali:', macroData.events?.length || 0);
      console.log('🔍 DEBUG AnalysisPage - Eventi raw:', macroData.events?.slice(0, 3));
      console.log('🔍 DEBUG AnalysisPage - Filtri:', { selectedImportance, selectedCountry });
      console.log('🔍 DEBUG AnalysisPage - Eventi filtrati:', filteredEvents.length);
      console.log('🔍 DEBUG AnalysisPage - Primi eventi filtrati:', filteredEvents.slice(0, 3));
    }
  }, [macroData, contentReady, filteredEvents, selectedImportance, selectedCountry]);

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
    return colors[importance] || colors.low;
  };

  const getCountryFlag = (country) => {
    const flags = {
      'USA': '🇺🇸',
      'EUR': '🇪🇺', 
      'UK': '🇬🇧',
      'JP': '🇯🇵',
      'CHN': '🇨🇳',
      'GER': '🇩🇪'
    };
    return flags[country] || '🌍';
  };

  // Loading overlay screen
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}>
        <Spinner size="large" />
        <div style={{
          marginTop: '30px',
          color: '#fff',
          fontSize: '18px',
          fontWeight: '500'
        }}>
          Caricamento analisi macro economiche...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        minHeight: '100vh'
      }}>
        <div style={{ color: '#ef5350', fontSize: '18px', marginBottom: '20px' }}>
          ❌ {error}
        </div>
        <button 
          onClick={() => loadMacroData()} 
          style={{
            background: '#66bb6a',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🔄 Riprova
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      minHeight: '100vh',
      padding: '20px',
      opacity: contentReady ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Header con indicatore aggiornamento */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #66bb6a, #4fc3f7, #ab47bc)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              margin: 0
            }}>
              📊 Analisi Macro Economica
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Indicatore aggiornamento real-time */}
              {updatingRealData && (
                <div style={{
                  background: 'rgba(102, 187, 106, 0.2)',
                  border: '1px solid rgba(102, 187, 106, 0.3)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#66bb6a',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <Spinner size="small" />
                  Aggiornando dati reali...
                </div>
              )}
              
              {/* Status dati */}
              <div style={{
                background: macroData?.source === 'google_cloud_backend' ? 
                  'rgba(102, 187, 106, 0.2)' :
                  macroData?.source === 'api_enhanced_mock' ? 
                  'rgba(102, 187, 106, 0.2)' :
                  macroData?.source === 'api' ? 
                    'rgba(102, 187, 106, 0.2)' : 
                  macroData?.source?.includes('mock') ?
                    'rgba(79, 195, 247, 0.2)' : 'rgba(255, 167, 38, 0.2)',
                border: `1px solid ${macroData?.source === 'google_cloud_backend' ? 
                  'rgba(102, 187, 106, 0.3)' :
                  macroData?.source === 'api_enhanced_mock' ? 
                  'rgba(102, 187, 106, 0.3)' :
                  macroData?.source === 'api' ? 
                    'rgba(102, 187, 106, 0.3)' : 
                  macroData?.source?.includes('mock') ?
                    'rgba(79, 195, 247, 0.3)' : 'rgba(255, 167, 38, 0.3)'}`,
                borderRadius: '12px',
                padding: '8px 16px',
                color: macroData?.source === 'google_cloud_backend' ? '#66bb6a' :
                       macroData?.source === 'api_enhanced_mock' ? '#66bb6a' :
                       macroData?.source === 'api' ? '#66bb6a' : 
                       macroData?.source?.includes('mock') ? '#4fc3f7' : '#ffa726',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {macroData?.source === 'google_cloud_backend' ? '🟢 Backend Live (Google Cloud Run)' :
                 macroData?.source === 'api_enhanced_mock' ? '🟢 Dati Ibridi (API + Avanzati)' :
                 macroData?.source === 'api' ? '🟢 Dati API Reali' : 
                 macroData?.source?.includes('mock') ? '🔵 Demo Avanzato' : '🟡 Dati Demo'}
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  background: refreshing ? '#555' : '#66bb6a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s'
                }}
              >
                {refreshing ? <Spinner size="small" /> : '🔄'}
                {refreshing ? 'Aggiornando...' : 'Aggiorna'}
              </button>
            </div>
          </div>
          
          <p style={{
            fontSize: '18px',
            color: '#ccc',
            margin: '20px 0 0 0',
            lineHeight: 1.6
          }}>
            Monitora gli eventi macro economici più importanti e analizza i dati storici 
            degli indicatori chiave che influenzano i mercati finanziari.
          </p>
          
          {macroData?.source && macroData.source.includes('mock') && (
            <div style={{
              background: 'rgba(79, 195, 247, 0.1)',
              border: '1px solid rgba(79, 195, 247, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: '15px 0 0 0',
              color: '#4fc3f7',
              fontSize: '14px',
              lineHeight: 1.4
            }}>
              ℹ️ <strong>Modalità Demo:</strong> I dati vengono aggiornati giornalmente per simulare l'ambiente reale. 
              Per dati live, configura una chiave API Alpha Vantage in <code>apiConfig.js</code>.
            </div>
          )}
          
          {macroData?.source === 'google_cloud_backend' && (
            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: '15px 0 0 0',
              color: '#4caf50',
              fontSize: '14px',
              lineHeight: 1.4
            }}>
              ✅ <strong>Dati Live:</strong> Connesso al backend Google Cloud Run - Dati economici ufficiali in tempo reale.
            </div>
          )}
          
          {macroData?.lastUpdate && (
            <p style={{
              fontSize: '14px',
              color: '#999',
              margin: '10px 0 0 0'
            }}>
              Ultimo aggiornamento: {new Date(macroData.lastUpdate).toLocaleString('it-IT')}
            </p>
          )}
          
          {/* Debug Log API (visibile senza devtools) */}
          {apiDebugLog.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              margin: '15px 0 0 0',
              maxHeight: '120px',
              overflowY: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <div style={{ color: '#4fc3f7', marginBottom: '8px', fontWeight: 'bold' }}>
                📡 API Debug Log:
              </div>
              {apiDebugLog.slice(-5).map((log, index) => (
                <div key={index} style={{ color: '#ccc', marginBottom: '4px' }}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contenuto principale - reso solo quando contentReady */}
        {contentReady && (
          <div>
            {/* Calendario Giornaliero */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '40px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #4fc3f7, #66bb6a)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    margin: '0 0 8px 0'
                  }}>
                    📅 Oggi - {new Date().toLocaleDateString('it-IT', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                  <p style={{
                    color: '#999',
                    fontSize: '16px',
                    margin: 0
                  }}>
                    Eventi e rilasci dati economici di oggi
                  </p>
                </div>
                
                <div style={{
                  background: 'rgba(79, 195, 247, 0.2)',
                  border: '1px solid rgba(79, 195, 247, 0.3)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  color: '#4fc3f7',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  🕐 {new Date().toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayEvents = filteredEvents.filter(event => event.date === today);
                const upcomingEvents = filteredEvents.filter(event => event.date > today).slice(0, 3);

                // Render timeline calendar for today
                const timeline = (
                  <div style={{ marginBottom: 18 }}>
                    <DayTimeline date={today} events={todayEvents} />
                  </div>
                );
                
                if (todayEvents.length === 0 && upcomingEvents.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
                      <h3 style={{
                        color: '#fff',
                        fontSize: '20px',
                        margin: '0 0 10px 0'
                      }}>
                        Nessun evento oggi
                      </h3>
                      <p style={{
                        color: '#999',
                        fontSize: '16px',
                        margin: 0
                      }}>
                        Giornata tranquilla sui mercati macro
                      </p>
                    </div>
                  );
                }

                return (
                  <div>
                    {timeline}
                    {/* Eventi di Oggi */}
                    {todayEvents.length > 0 && (
                      <div style={{ marginBottom: '30px' }}>
                        <h3 style={{
                          color: '#66bb6a',
                          fontSize: '20px',
                          fontWeight: '600',
                          margin: '0 0 20px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🔴 OGGI ({todayEvents.length} {todayEvents.length === 1 ? 'evento' : 'eventi'})
                        </h3>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                          gap: '15px'
                        }}>
                          {todayEvents.map((event, index) => {
                            const eventTime = new Date(`${event.date}T${event.time || '12:00'}`);
                            const isPast = eventTime < new Date();
                            
                            return (
                              <div 
                                key={`today-${event.id}-${index}`} 
                                className={`calendar-event-card ${!isPast ? 'live-event' : ''}`}
                                style={{
                                background: isPast ? 
                                  'rgba(158, 158, 158, 0.1)' : 
                                  'rgba(102, 187, 106, 0.1)',
                                border: isPast ?
                                  '2px solid rgba(158, 158, 158, 0.3)' :
                                  '2px solid rgba(102, 187, 106, 0.3)',
                                borderLeft: isPast ?
                                  '4px solid #9e9e9e' :
                                  `4px solid ${getImportanceColor(event.importance)}`,
                                borderRadius: '12px',
                                padding: '20px',
                                position: 'relative',
                                transition: 'all 0.2s ease'
                              }}>
                                {/* Badge stato */}
                                <div style={{
                                  position: 'absolute',
                                  top: '12px',
                                  right: '12px',
                                  background: isPast ? '#9e9e9e' : '#66bb6a',
                                  color: '#fff',
                                  padding: '4px 8px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>
                                  {isPast ? '✓ PASSATO' : '🔴 LIVE'}
                                </div>
                                
                                {/* Contenuto evento */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '15px',
                                  marginBottom: '15px'
                                }}>
                                  <span style={{ fontSize: '28px' }}>{event.icon || macroService.getIndicatorIcon(event.category || event.title || 'default')}</span>
                                  <div style={{ flex: 1 }}>
                                    <h4 style={{
                                      margin: '0 0 8px 0',
                                      color: isPast ? '#ccc' : '#fff',
                                      fontSize: '16px',
                                      fontWeight: '600',
                                      lineHeight: 1.3
                                    }}>
                                      {event.title}
                                    </h4>
                                    <p style={{
                                      margin: '0 0 12px 0',
                                      color: isPast ? '#999' : '#ccc',
                                      fontSize: '14px',
                                      lineHeight: 1.4
                                    }}>
                                      {event.description}
                                    </p>
                                    
                                    {/* Orario e paese */}
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '15px',
                                      fontSize: '13px',
                                      color: isPast ? '#888' : '#999'
                                    }}>
                                      <span>
                                        🕐 {event.time || '12:00'}
                                      </span>
                                      <span>
                                        {getCountryFlag(event.country)} {event.country}
                                      </span>
                                      <span style={{
                                        background: getImportanceColor(event.importance),
                                        color: '#fff',
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                      }}>
                                        {event.importance}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Dati attesi/effettivi */}
                                {(event.expected || event.actual) && (
                                  <div style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    {event.expected && (
                                      <div>
                                        <div style={{
                                          fontSize: '11px',
                                          color: '#999',
                                          fontWeight: '600',
                                          textTransform: 'uppercase',
                                          marginBottom: '4px'
                                        }}>
                                          Atteso
                                        </div>
                                        <div style={{
                                          fontSize: '14px',
                                          color: '#ccc',
                                          fontWeight: '500'
                                        }}>
                                          {event.expected}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {event.actual && (
                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                          fontSize: '11px',
                                          color: '#66bb6a',
                                          fontWeight: '600',
                                          textTransform: 'uppercase',
                                          marginBottom: '4px'
                                        }}>
                                          Effettivo
                                        </div>
                                        <div style={{
                                          fontSize: '16px',
                                          color: '#66bb6a',
                                          fontWeight: '600'
                                        }}>
                                          {event.actual}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Prossimi Eventi (Preview) */}
                    {upcomingEvents.length > 0 && (
                      <div>
                        <h3 style={{
                          color: '#4fc3f7',
                          fontSize: '18px',
                          fontWeight: '600',
                          margin: '0 0 15px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          📅 Prossimi Eventi
                        </h3>
                        
                        <div 
                          className="calendar-upcoming-scroll"
                          style={{
                            display: 'flex',
                            gap: '15px',
                            overflowX: 'auto',
                            paddingBottom: '10px'
                          }}>
                          {upcomingEvents.map((event, index) => (
                            <div key={`upcoming-${event.id}-${index}`} style={{
                              minWidth: '280px',
                              background: 'rgba(79, 195, 247, 0.05)',
                              border: '1px solid rgba(79, 195, 247, 0.2)',
                              borderRadius: '10px',
                              padding: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              <span style={{ fontSize: '20px' }}>
                                {event.icon || macroService.getIndicatorIcon(event.category || event.title || 'default')}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontSize: '14px',
                                  color: '#4fc3f7',
                                  fontWeight: '600',
                                  marginBottom: '4px'
                                }}>
                                  {new Date(event.date).toLocaleDateString('it-IT', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  color: '#ccc',
                                  lineHeight: 1.3
                                }}>
                                  {event.title}
                                </div>
                              </div>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: getImportanceColor(event.importance)
                              }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Filtri */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ color: '#66bb6a', fontWeight: '600' }}>
                🔍 Filtra eventi:
              </div>
              
              {/* Filtro importanza */}
              <select 
                value={selectedImportance}
                onChange={(e) => setSelectedImportance(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="all">Tutte le importanze</option>
                <option value="high">🔴 Alta</option>
                <option value="medium">🟡 Media</option>
                <option value="low">🟢 Bassa</option>
              </select>
              
              {/* Filtro paese */}
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="all">Tutti i paesi</option>
                <option value="USA">🇺🇸 USA</option>
                <option value="EUR">🇪🇺 Europa</option>
                <option value="UK">🇬🇧 Regno Unito</option>
                <option value="JP">🇯🇵 Giappone</option>
              </select>
              
              <div style={{
                marginLeft: 'auto',
                color: '#999',
                fontSize: '14px'
              }}>
                {filteredEvents.length} eventi trovati
              </div>
            </div>

            {/* Eventi Macro */}
            <div style={{ marginBottom: '50px' }}>
              <h2 style={{
                fontSize: '32px',
                margin: '0 0 20px 0',
                color: '#fff'
              }}>
                📅 Eventi Macro in Arrivo
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#999',
                marginBottom: '30px'
              }}>
                Calendario degli eventi economici più importanti per i prossimi giorni
              </p>
              
              {Object.keys(eventsByDate).length === 0 ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
                  <div style={{ color: '#999', fontSize: '18px' }}>
                    Nessun evento trovato per i filtri selezionati
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '20px'
                }}>
                  {Object.entries(eventsByDate)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, events]) => (
                    <div key={date} className="fade-in" style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden'
                    }}>
                      {/* Header data */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <h3 style={{
                          margin: 0,
                          color: '#66bb6a',
                          fontSize: '20px',
                          fontWeight: '600'
                        }}>
                          📅 {new Date(date).toLocaleDateString('it-IT', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                      </div>
                      
                      {/* Eventi della giornata */}
                      <div style={{ padding: '20px' }}>
                        <div style={{
                          display: 'grid',
                          gap: '15px'
                        }}>
                          {events.map((event, index) => (
                            <div key={`${event.id}-${index}`} style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              borderRadius: '8px',
                              padding: '16px',
                              border: `2px solid ${getImportanceColor(event.importance)}20`,
                              borderLeft: `4px solid ${getImportanceColor(event.importance)}`
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '8px'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}>
                                  <span style={{ fontSize: '24px' }}>{event.icon}</span>
                                  <div>
                                    <h4 style={{
                                      margin: 0,
                                      color: '#fff',
                                      fontSize: '16px',
                                      fontWeight: '600'
                                    }}>
                                      {event.title}
                                    </h4>
                                    <p style={{
                                      margin: '4px 0 0 0',
                                      color: '#999',
                                      fontSize: '14px'
                                    }}>
                                      {event.description}
                                    </p>
                                  </div>
                                </div>
                                
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}>
                                  <span style={{ fontSize: '20px' }}>
                                    {getCountryFlag(event.country)}
                                  </span>
                                  <div style={{
                                    background: getImportanceColor(event.importance),
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                  }}>
                                    {event.importance}
                                  </div>
                                </div>
                              </div>
                              
                              {(event.expected || event.actual) && (
                                <div style={{
                                  display: 'flex',
                                  gap: '20px',
                                  marginTop: '12px'
                                }}>
                                  {event.expected && (
                                    <div style={{
                                      color: '#999',
                                      fontSize: '14px'
                                    }}>
                                      <span style={{ fontWeight: '600' }}>Atteso:</span> {event.expected}
                                    </div>
                                  )}
                                  {event.actual && (
                                    <div style={{
                                      color: '#66bb6a',
                                      fontSize: '14px'
                                    }}>
                                      <span style={{ fontWeight: '600' }}>Effettivo:</span> {event.actual}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  📊 Storico Indicatori Macro
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
          </div>
        )}
      </div>

      {/* CSS per animazioni */}
      <style>
        {`
          .fade-in {
            animation: fadeIn 0.6s ease-in-out;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Scrollbar styling per le tabelle */
          *::-webkit-scrollbar {
            width: 8px;
          }
          
          *::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          
          *::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
          }
          
          *::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          
          /* Calendario Giornaliero */
          .calendar-event-card {
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .calendar-event-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          }
          
          .calendar-upcoming-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          }
          
          .calendar-upcoming-scroll::-webkit-scrollbar {
            height: 6px;
          }
          
          .calendar-upcoming-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
          }
          
          .calendar-upcoming-scroll::-webkit-scrollbar-thumb {
            background: rgba(79, 195, 247, 0.3);
            border-radius: 3px;
          }
          
          .calendar-upcoming-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(79, 195, 247, 0.5);
          }
          
          /* Pulse animation for live events */
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(102, 187, 106, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(102, 187, 106, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(102, 187, 106, 0);
            }
          }
          
          .live-event {
            animation: pulse 2s infinite;
          }
        `}
      </style>
    </div>
  );
}