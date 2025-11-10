import React, { useState, useEffect } from 'react';
import backendService from '../services/backendService.js';
import Spinner from '../components/ui/Spinner.jsx';

/**
 * 🧪 Pagina di test per verificare la connessione al backend
 */
export default function BackendTestPage() {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [healthData, setHealthData] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    testBackendConnection();
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), { timestamp, message, type }]);
  };

  const testBackendConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    addLog('🚀 Iniziando test di connessione al backend...');

    try {
      // Test 1: Health Check
      addLog('🏥 Test 1: Health check...');
      const health = await backendService.checkHealth();
      setHealthData(health);
      addLog('✅ Health check superato', 'success');

      // Test 2: Caricamento indicatori
      addLog('📊 Test 2: Caricamento indicatori principali...');
      const indicatorsData = await backendService.getMainIndicators();
      setIndicators(indicatorsData);
      addLog('✅ Indicatori caricati con successo', 'success');

      setConnectionStatus('connected');
      addLog('🎉 Tutti i test superati - Backend connesso!', 'success');

    } catch (err) {
      console.error('❌ Errore test backend:', err);
      setError(err.message);
      setConnectionStatus('error');
      addLog(`❌ Errore: ${err.message}`, 'error');
    }
  };

  const retryConnection = () => {
    testBackendConnection();
  };

  const clearCache = () => {
    backendService.clearCache();
    addLog('🧹 Cache pulita', 'info');
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'error': return '#dc3545';
      case 'testing': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅';
      case 'error': return '❌';
      case 'testing': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: 'calc(100vh - 120px)' 
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '10px',
          background: 'linear-gradient(45deg, #1e88e5, #66bb6a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🧪 Backend Connection Test
        </h1>
        <p style={{ color: '#ccc', fontSize: '16px' }}>
          Test di connessione al backend Google Cloud Run
        </p>
      </div>

      {/* Status Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '48px', 
          marginBottom: '20px' 
        }}>
          {getStatusIcon()}
        </div>
        
        <h2 style={{ 
          color: getStatusColor(),
          marginBottom: '10px',
          fontSize: '24px'
        }}>
          Status: {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
        </h2>
        
        <p style={{ color: '#ccc', marginBottom: '20px' }}>
          Backend URL: <code style={{ color: '#66bb6a' }}>
            {backendService.baseURL}
          </code>
        </p>

        {connectionStatus === 'testing' && <Spinner />}
        
        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '20px',
            color: '#ff6b6b'
          }}>
            <strong>Errore:</strong> {error}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={retryConnection}
            style={{
              background: '#1e88e5',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Riprova Test
          </button>
          
          <button
            onClick={clearCache}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🧹 Pulisci Cache
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '30px' 
      }}>
        
        {/* Health Data */}
        {healthData && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '25px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ 
              marginBottom: '20px', 
              color: '#28a745',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🏥 Health Check Data
            </h3>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '15px',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#e6e6e6',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        )}

        {/* Indicators Data */}
        {indicators && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '25px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ 
              marginBottom: '20px', 
              color: '#66bb6a',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📊 Indicators Data
            </h3>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '15px',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#e6e6e6',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(indicators, null, 2)}
            </pre>
          </div>
        )}

        {/* Logs */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '25px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          gridColumn: logs.length > 0 ? 'span 2' : '1'
        }}>
          <h3 style={{ 
            marginBottom: '20px', 
            color: '#ffc107',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📋 Test Logs
          </h3>
          
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '15px',
            borderRadius: '6px',
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            {logs.length === 0 ? (
              <p style={{ color: '#999', fontStyle: 'italic' }}>
                Nessun log disponibile
              </p>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{
                  marginBottom: '8px',
                  padding: '8px',
                  borderRadius: '4px',
                  background: log.type === 'error' ? 'rgba(220, 53, 69, 0.1)' :
                            log.type === 'success' ? 'rgba(40, 167, 69, 0.1)' :
                            'rgba(255, 193, 7, 0.1)',
                  border: `1px solid ${
                    log.type === 'error' ? 'rgba(220, 53, 69, 0.3)' :
                    log.type === 'success' ? 'rgba(40, 167, 69, 0.3)' :
                    'rgba(255, 193, 7, 0.3)'
                  }`,
                  fontSize: '14px'
                }}>
                  <span style={{ color: '#999', marginRight: '10px' }}>
                    [{log.timestamp}]
                  </span>
                  <span style={{
                    color: log.type === 'error' ? '#ff6b6b' :
                          log.type === 'success' ? '#51cf66' :
                          '#e6e6e6'
                  }}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}