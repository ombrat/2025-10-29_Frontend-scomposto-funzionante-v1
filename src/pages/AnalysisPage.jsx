import React, { useState, useEffect, useMemo } from 'react';
import macroService from '../services/macroService.js';

// Layout e UI components come nel backtest
import MainLayout from '../components/layout/MainLayout.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

// Stili come nel backtest
import '../styles/index.css';
import '../styles/components.css';

/**
 * 📊 AnalysisPage v4.0 - Stile identico al BacktestPage
 * 
 * LAYOUT COPIATO:
 * - Stesso MainLayout a 3 colonne del backtest
 * - Panel style identico con tema scuro
 * - Stessi colori, tipografia e spacing
 * - Stessa logica di layout responsivo
 */
export default function AnalysisPage() {
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [loadingLogs, setLoadingLogs] = useState([]);
  
  // Filtri - stile backtest
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadMacroData();
  }, []);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLoadingLogs(prev => [...prev.slice(-8), `${timestamp}: ${message}`]);
    console.log('📊 ANALYSIS:', message);
  };

  const loadMacroData = async () => {
    setLoading(true);
    setError(null);
    setLoadingLogs([]);
    
    try {
      addLog('🚀 Inizializzazione sistema analisi economica...');
      addLog('🌐 Connessione Google Cloud Run FRED API...');
      
      const data = await macroService.fetchMacroDataComplete(70);
      
      addLog(`✅ Sistema pronto: ${data.metadata?.totalIndicators || 0} indicatori`);
      addLog(`📊 Database: ${data.metadata?.totalDataPoints?.toLocaleString() || 0} punti dati`);
      
      setMacroData(data);
      setLoading(false);
      
    } catch (err) {
      console.error('❌ ERRORE FATALE:', err);
      addLog(`❌ ERRORE: ${err.message}`);
      setError(err.message);
      setLoading(false);
    }
  };

  // Configurazione categorie - stile backtest
  const getCategoryConfig = (categoryKey) => {
    const configs = {
      'gdp_growth': { name: 'PIL e Crescita', icon: '🏛️', color: '#66bb6a' },
      'employment': { name: 'Occupazione', icon: '👥', color: '#42a5f5' },
      'inflation': { name: 'Inflazione', icon: '📈', color: '#ef5350' },
      'monetary_policy': { name: 'Politica Monetaria', icon: '💰', color: '#ffa726' },
      'consumer': { name: 'Consumi', icon: '🛒', color: '#ab47bc' },
      'housing': { name: 'Immobiliare', icon: '🏠', color: '#5c6bc0' },
      'manufacturing': { name: 'Manifatturiero', icon: '🏭', color: '#78909c' },
      'trade': { name: 'Commercio', icon: '⚖️', color: '#26a69a' },
      'financial': { name: 'Mercati', icon: '💹', color: '#ec407a' },
      'fiscal': { name: 'Politica Fiscale', icon: '🏛️', color: '#ff7043' }
    };
    
    return configs[categoryKey] || {
      name: categoryKey, icon: '📊', color: '#999'
    };
  };

  // Formattazione valori - stile backtest
  const formatValue = (value, indicator) => {
    if (value === null || value === undefined || value === '.') return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    
    if (indicator?.id?.includes('RATE') || indicator?.id?.includes('DGS')) {
      return `${num.toFixed(2)}%`;
    }
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1 && num > 0) return num.toFixed(3);
    return num.toFixed(2);
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const toggleIndicator = (categoryKey, indicatorId) => {
    const key = `${categoryKey}_${indicatorId}`;
    setExpandedIndicators(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filtri - stile backtest
  const filteredData = useMemo(() => {
    if (!macroData?.indicators) return {};
    
    let filtered = { ...macroData.indicators };
    
    if (selectedCategory !== 'all') {
      filtered = { [selectedCategory]: filtered[selectedCategory] };
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      Object.keys(filtered).forEach(categoryKey => {
        filtered[categoryKey] = filtered[categoryKey].filter(indicator =>
          indicator.name.toLowerCase().includes(searchLower) ||
          indicator.id.toLowerCase().includes(searchLower) ||
          indicator.description?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return filtered;
  }, [macroData, selectedCategory, searchTerm]);

  // Loading state - stile backtest
  if (loading) {
    return (
      <MainLayout
        center={
          <div className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spinner />
            <h2 style={{ 
              color: '#fff', 
              marginTop: '20px', 
              marginBottom: '10px',
              fontSize: '24px'
            }}>
              📊 Caricamento Analisi Economica
            </h2>
            <p style={{ color: '#999', fontSize: '16px', marginBottom: '30px' }}>
              Connessione a Google Cloud Run FRED API...
            </p>
            
            {/* Log panel - stile backtest */}
            <div className="card" style={{ marginTop: '20px', textAlign: 'left' }}>
              <div className="card-header">
                🔄 Log di Sistema
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                {loadingLogs.map((log, index) => (
                  <div key={index} style={{ 
                    color: '#cfcfcf', 
                    marginBottom: '4px',
                    paddingLeft: '10px',
                    borderLeft: '2px solid #66bb6a'
                  }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      />
    );
  }

  // Error state - stile backtest
  if (error) {
    return (
      <MainLayout
        center={
          <div className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ color: '#ef5350', marginBottom: '20px' }}>
              Errore del Sistema
            </h2>
            <div className="card" style={{ 
              background: 'rgba(239, 83, 80, 0.1)', 
              border: '1px solid rgba(239, 83, 80, 0.3)',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#ef5350', fontFamily: 'monospace', fontSize: '13px' }}>
                {error}
              </p>
            </div>
            <Button onClick={loadMacroData} style={{ minWidth: '150px' }}>
              🔄 Riprova Connessione
            </Button>
          </div>
        }
      />
    );
  }

  const indicators = macroData?.indicators || {};
  const metadata = macroData?.metadata || {};

  // LEFT SIDEBAR - Controlli stile backtest
  const leftSidebar = (
    <div>
      {/* Header controls */}
      <div className="panel">
        <div className="panel-title">📊 Analisi Economica</div>
        <p style={{ color: '#cfcfcf', fontSize: '14px', marginBottom: '20px' }}>
          Sistema di monitoraggio indicatori Federal Reserve
        </p>
        
        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: '#fff', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
            🔍 Ricerca Indicatori
          </label>
          <Input
            type="text"
            placeholder="Cerca per nome o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Category filter */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: '#fff', fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
            🏷️ Categoria
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px'
            }}
          >
            <option value="all">🌐 Tutte le Categorie</option>
            {Object.keys(indicators).map(categoryKey => {
              const config = getCategoryConfig(categoryKey);
              return (
                <option key={categoryKey} value={categoryKey}>
                  {config.icon} {config.name}
                </option>
              );
            })}
          </select>
        </div>
        
        <Button onClick={loadMacroData} style={{ width: '100%', marginTop: '10px' }}>
          🔄 Aggiorna Dati
        </Button>
      </div>

      {/* Stats panel - stile backtest */}
      <div className="panel">
        <div className="panel-title">📈 Statistiche Sistema</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="card tight">
            <div style={{ color: '#66bb6a', fontSize: '20px', fontWeight: '700' }}>
              {metadata.totalIndicators || 0}
            </div>
            <div style={{ color: '#cfcfcf', fontSize: '12px' }}>Indicatori</div>
          </div>
          <div className="card tight">
            <div style={{ color: '#42a5f5', fontSize: '20px', fontWeight: '700' }}>
              {metadata.totalDataPoints?.toLocaleString() || 0}
            </div>
            <div style={{ color: '#cfcfcf', fontSize: '12px' }}>Punti Dati</div>
          </div>
          <div className="card tight">
            <div style={{ color: '#ffa726', fontSize: '20px', fontWeight: '700' }}>
              {metadata.yearsRequested || 0}
            </div>
            <div style={{ color: '#cfcfcf', fontSize: '12px' }}>Anni Storia</div>
          </div>
          <div className="card tight">
            <div style={{ color: '#66bb6a', fontSize: '16px', fontWeight: '700' }}>
              ✅
            </div>
            <div style={{ color: '#cfcfcf', fontSize: '12px' }}>Cloud Run</div>
          </div>
        </div>
      </div>
    </div>
  );

  // CENTER - Main content stile backtest
  const centerContent = (
    <div>
      {/* Main header */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          color: '#fff', 
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📊 Indicatori Economici FRED
        </h1>
        <p style={{ color: '#999', fontSize: '16px', margin: 0, lineHeight: 1.4 }}>
          Monitoraggio in tempo reale di {metadata.totalIndicators || 32} indicatori economici principali 
          con {metadata.yearsRequested || 70} anni di dati storici dalla Federal Reserve.
        </p>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Object.keys(filteredData).map((categoryKey) => {
          const categoryIndicators = filteredData[categoryKey];
          const config = getCategoryConfig(categoryKey);
          const isExpanded = expandedCategories[categoryKey];
          
          if (categoryIndicators.length === 0) return null;
          
          return (
            <div key={categoryKey} className="panel">
              {/* Category header - clickable */}
              <div 
                className="category-header"
                onClick={() => toggleCategory(categoryKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: `1px solid ${config.color}20`,
                  marginBottom: isExpanded ? '16px' : '0'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: config.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {config.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    color: '#fff', 
                    fontSize: '18px', 
                    margin: '0 0 4px 0',
                    fontWeight: '700'
                  }}>
                    {config.name}
                  </h3>
                  <p style={{ 
                    color: '#cfcfcf', 
                    fontSize: '13px', 
                    margin: 0 
                  }}>
                    {categoryIndicators.length} indicatori disponibili
                  </p>
                </div>
                <div style={{ color: config.color, fontSize: '18px' }}>
                  {isExpanded ? '🔼' : '🔽'}
                </div>
              </div>

              {/* Indicators list */}
              {isExpanded && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {categoryIndicators.map((indicator) => {
                    const key = `${categoryKey}_${indicator.id}`;
                    const isIndicatorExpanded = expandedIndicators[key];
                    const observations = indicator.observations || [];
                    const recentData = observations.slice(0, 5);
                    
                    if (observations.length === 0) {
                      return (
                        <div key={indicator.id} className="card series-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: config.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#000'
                            }}>
                              {indicator.id.slice(0, 2)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '15px' }}>
                                {indicator.name}
                              </h4>
                              <p style={{ color: '#cfcfcf', fontSize: '12px', margin: 0 }}>
                                {indicator.id} - Nessun dato disponibile
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    const latestValue = recentData[0];
                    const prevValue = recentData[1];
                    const change = prevValue ? parseFloat(latestValue.value) - parseFloat(prevValue.value) : null;
                    
                    return (
                      <div key={indicator.id} className="card series-card">
                        {/* Indicator header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: config.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#000'
                          }}>
                            {indicator.id.slice(0, 2)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '15px' }}>
                              {indicator.name}
                            </h4>
                            <p style={{ color: '#cfcfcf', fontSize: '12px', margin: 0 }}>
                              {indicator.id}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                              color: '#fff', 
                              fontSize: '18px', 
                              fontWeight: '700',
                              marginBottom: '2px'
                            }}>
                              {formatValue(latestValue?.value, indicator)}
                            </div>
                            {change !== null && (
                              <div style={{
                                color: change > 0 ? '#66bb6a' : change < 0 ? '#ef5350' : '#999',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {change > 0 ? '+' : ''}{formatValue(change, indicator)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recent data */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ 
                            color: '#cfcfcf', 
                            fontSize: '13px', 
                            marginBottom: '8px',
                            fontWeight: '600'
                          }}>
                            {isIndicatorExpanded ? `Ultimi ${Math.min(50, observations.length)} dati` : 'Ultimi 5 movimenti'}
                          </div>
                          
                          <div className="historical-data" style={{
                            maxHeight: isIndicatorExpanded ? '200px' : 'auto',
                            overflowY: isIndicatorExpanded ? 'auto' : 'visible',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            {(isIndicatorExpanded ? observations.slice(0, 50) : recentData).map((obs, index) => (
                              <div 
                                key={`${obs.date}_${index}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '6px 8px',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}
                              >
                                <span style={{ color: '#cfcfcf', fontFamily: 'monospace' }}>
                                  {obs.date}
                                </span>
                                <span style={{ color: '#fff', fontWeight: '600' }}>
                                  {formatValue(obs.value, indicator)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Controls */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                          <span style={{ color: '#cfcfcf', fontSize: '12px' }}>
                            {observations.length} osservazioni totali
                          </span>
                          
                          {observations.length > 5 && (
                            <Button
                              onClick={() => toggleIndicator(categoryKey, indicator.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                minWidth: 'auto',
                                background: isIndicatorExpanded 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : `${config.color}20`,
                                border: `1px solid ${isIndicatorExpanded ? 'rgba(255, 255, 255, 0.2)' : config.color}40`
                              }}
                            >
                              {isIndicatorExpanded ? '🔼 Comprimi' : '🔽 Espandi tutto'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <MainLayout
      left={leftSidebar}
      center={centerContent}
    />
  );
}