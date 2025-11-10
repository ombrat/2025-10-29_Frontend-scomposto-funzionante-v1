import React, { useState, useEffect } from 'react';
import macroService from '../services/macroService.js';
import Spinner from '../components/ui/Spinner.jsx';

/**
 * 🚨 EMERGENCY VERSION: Pagina Analysis semplificata per stabilità layout
 */
export default function AnalysisPageSimple() {
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica solo dati mock stabili
  useEffect(() => {
    loadSimpleData();
  }, []);

  const loadSimpleData = async () => {
    try {
      console.log('🚨 EMERGENCY LOAD: Dati mock stabili...');
      
      // Solo dati mock - niente API calls
      const mockData = macroService.getMockMacroDataWithHistory();
      setMacroData(mockData);
      setLoading(false);
      
      console.log('✅ Emergency data loaded:', Object.keys(mockData?.historical || {}).length, 'indicators');
      
    } catch (err) {
      console.error('❌ Emergency load failed:', err);
      setError('Errore nel caricamento');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        color: '#ccc' 
      }}>
        <Spinner />
        <span style={{ marginLeft: '15px' }}>Caricamento dati macro...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        color: '#ff6b6b' 
      }}>
        <div>❌ {error}</div>
      </div>
    );
  }

  const events = macroData?.events || [];
  const historical = macroData?.historical || {};

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      color: '#fff',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh'
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px'
        }}>
          📊 Analisi Macro Economica
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>
          🚨 Modalità Emergency - Dati Mock Stabili ({Object.keys(historical).length} indicatori)
        </p>
      </div>

      {/* Eventi Recenti */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '1.8rem', 
          marginBottom: '20px',
          borderBottom: '2px solid #333',
          paddingBottom: '10px'
        }}>
          📈 Eventi Macro Recenti
        </h2>
        
        {events.length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {events.slice(0, 8).map((event, index) => (
              <div key={index} style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '20px',
                borderLeft: `4px solid ${event.impact === 'high' ? '#ff6b6b' : 
                                        event.impact === 'medium' ? '#ffa726' : '#4caf50'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#fff' }}>
                    {event.title}
                  </h3>
                  <span style={{ 
                    backgroundColor: event.impact === 'high' ? '#ff6b6b' : 
                                    event.impact === 'medium' ? '#ffa726' : '#4caf50',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {event.impact?.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: '#ccc', margin: '10px 0', lineHeight: '1.5' }}>
                  {event.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#888' }}>
                  <span>📅 {event.date}</span>
                  <span>🏷️ {event.category || 'Economic'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px'
          }}>
            📊 Nessun evento macro disponibile
          </div>
        )}
      </div>

      {/* Indicatori Principali */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '1.8rem', 
          marginBottom: '20px',
          borderBottom: '2px solid #333',
          paddingBottom: '10px'
        }}>
          📊 Indicatori Economici
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {Object.entries(historical).slice(0, 6).map(([key, indicator]) => {
            const latestData = indicator.data?.slice(-1)[0];
            const previousData = indicator.data?.slice(-2)[0];
            const change = latestData && previousData ? 
              ((latestData.value - previousData.value) / previousData.value * 100) : 0;
            
            return (
              <div key={key} style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #333'
              }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', color: '#fff' }}>
                  {indicator.name || key}
                </h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50', marginBottom: '5px' }}>
                  {latestData?.value?.toFixed(2) || 'N/A'}
                </div>
                <div style={{ fontSize: '0.9rem', color: change >= 0 ? '#4caf50' : '#ff6b6b' }}>
                  {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>
                  {latestData?.date || 'Data non disponibile'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        marginTop: '40px'
      }}>
        <p style={{ color: '#888', margin: 0 }}>
          🚨 <strong>Modalità Emergency</strong>: Dati mock per garantire stabilità del layout
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem', margin: '10px 0 0 0' }}>
          Fonte dati: {macroData?.source || 'Mock Data'} • 
          Ultimo aggiornamento: {new Date().toLocaleString()}
        </p>
      </div>

    </div>
  );
}