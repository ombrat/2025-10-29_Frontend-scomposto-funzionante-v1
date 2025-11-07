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
 * 📊 AnalysisPage v5.0 - Layout scorrevole + UX identica al backtest
 * 
 * MIGLIORAMENTI:
 * - Layout più scorrevole con filtri in alto
 * - 20 dati per indicatore (5 visibili + scroll per 15)
 * - UX eventi identici al backtest
 * - Interazioni smooth e responsive
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

  // Auto-expand prima categoria al caricamento
  useEffect(() => {
    if (macroData?.indicators && Object.keys(expandedCategories).length === 0) {
      const firstCategory = Object.keys(macroData.indicators)[0];
      if (firstCategory) {
        setExpandedCategories({ [firstCategory]: true });
      }
    }
  }, [macroData, expandedCategories]);

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

  // Toggle con smooth transitions - stile backtest
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

  // LEFT SIDEBAR - Stats compatte stile backtest
  const leftSidebar = (
    <div>
      {/* Stats panel compatto - stile backtest */}
      <div className="panel">
        <div className="panel-title">📈 Sistema Analisi</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="card tight">
            <div style={{ color: '#66bb6a', fontSize: '18px', fontWeight: '700' }}>
              {metadata.totalIndicators || 0}
            </div>
            <div style={{ color: '#cfcfcf', fontSize: '11px' }}>Indicatori</div>
          </div>
          <div className="card tight">
            <div style={{ color: '#42a5f5', fontSize: '18px', fontWeight: '700' }}>
              {Math.round((metadata.totalDataPoints || 0) / 1000)}K
            </div>
            <div style={{ color: '#cfcfcf', fontSize: '11px' }}>Punti Dati</div>
          </div>
          <div className="card tight">
            <div style={{ color: '#ffa726', fontSize: '18px', fontWeight: '700' }}>
              {metadata.yearsRequested || 0}
            </div>
            <div style={{ color: '#cfcfcf', fontSize: '11px' }}>Anni Storia</div>
          </div>
          <div className="card tight">
            <div style={{ color: '#66bb6a', fontSize: '14px', fontWeight: '700' }}>
              ✅
            </div>
            <div style={{ color: '#cfcfcf', fontSize: '11px' }}>Live</div>
          </div>
        </div>
        
        <Button onClick={loadMacroData} style={{ width: '100%', marginTop: '12px', fontSize: '13px', padding: '8px' }}>
          🔄 Refresh
        </Button>
      </div>
    </div>
  );

  // CENTER - Layout scorrevole con filtri in alto
  const centerContent = (
    <div>
      {/* FILTRI IN ALTO - Layout scorrevole */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-title" style={{ marginBottom: '16px' }}>
          📊 Indicatori Economici FRED
        </div>
        
        {/* Controlli filtri in linea - stile backtest */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 200px auto', 
          gap: '12px', 
          alignItems: 'end' 
        }}>
          {/* Search */}
          <div>
            <label style={{ 
              color: '#cfcfcf', 
              fontSize: '13px', 
              fontWeight: '600', 
              display: 'block', 
              marginBottom: '4px' 
            }}>
              🔍 Ricerca
            </label>
            <Input
              type="text"
              placeholder="Cerca indicatori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%',
                fontSize: '14px',
                padding: '8px 12px'
              }}
            />
          </div>
          
          {/* Category filter */}
          <div>
            <label style={{ 
              color: '#cfcfcf', 
              fontSize: '13px', 
              fontWeight: '600', 
              display: 'block', 
              marginBottom: '4px' 
            }}>
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
              <option value="all">Tutte</option>
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
          
          {/* Quick stats */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#cfcfcf', fontSize: '13px', marginBottom: '2px' }}>
              Risultati
            </div>
            <div style={{ color: '#66bb6a', fontSize: '16px', fontWeight: '700' }}>
              {Object.values(filteredData).reduce((acc, cat) => acc + cat.length, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIE - Layout scorrevole */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.keys(filteredData).map((categoryKey) => {
          const categoryIndicators = filteredData[categoryKey];
          const config = getCategoryConfig(categoryKey);
          const isExpanded = expandedCategories[categoryKey];
          
          if (categoryIndicators.length === 0) return null;
          
          return (
            <div key={categoryKey} className="panel">
              {/* Category header - stile backtest con hover smooth */}
              <div 
                className="category-header"
                onClick={() => toggleCategory(categoryKey)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: `1px solid ${config.color}15`,
                  marginBottom: isExpanded ? '12px' : '0',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: `0 4px 12px ${config.color}20`
                }}>
                  {config.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    color: '#fff', 
                    fontSize: '16px', 
                    margin: '0 0 2px 0',
                    fontWeight: '700'
                  }}>
                    {config.name}
                  </h3>
                  <p style={{ 
                    color: '#cfcfcf', 
                    fontSize: '12px', 
                    margin: 0 
                  }}>
                    {categoryIndicators.length} indicatori • Click per espandere
                  </p>
                </div>
                <div style={{ 
                  color: config.color, 
                  fontSize: '16px',
                  transition: 'transform 0.2s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  🔽
                </div>
              </div>

              {/* Indicators list con smooth transition */}
              {isExpanded && (
                <div style={{ 
                  display: 'grid', 
                  gap: '8px',
                  animation: 'slideDown 0.3s ease'
                }}>
                  {categoryIndicators.map((indicator) => {
                    const key = `${categoryKey}_${indicator.id}`;
                    const isIndicatorExpanded = expandedIndicators[key];
                    const observations = indicator.observations || [];
                    
                    // 20 dati: 5 visibili + 15 scrollabili
                    const displayData = observations.slice(0, 20);
                    const visibleData = displayData.slice(0, 5);
                    const scrollableData = displayData.slice(5);
                    
                    if (observations.length === 0) {
                      return (
                        <div key={indicator.id} className="card series-card" style={{ opacity: 0.6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: config.color + '40',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: config.color
                            }}>
                              {indicator.id.slice(0, 2)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ color: '#fff', margin: '0 0 2px 0', fontSize: '14px' }}>
                                {indicator.name}
                              </h4>
                              <p style={{ color: '#cfcfcf', fontSize: '11px', margin: 0 }}>
                                {indicator.id} - Nessun dato disponibile
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    const latestValue = displayData[0];
                    const prevValue = displayData[1];
                    const change = prevValue ? parseFloat(latestValue.value) - parseFloat(prevValue.value) : null;
                    
                    return (
                      <div 
                        key={indicator.id} 
                        className="card series-card"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.6)';
                        }}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        {/* Indicator header compatto */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#000'
                          }}>
                            {indicator.id.slice(0, 2)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ color: '#fff', margin: '0 0 2px 0', fontSize: '14px' }}>
                              {indicator.name}
                            </h4>
                            <p style={{ color: '#cfcfcf', fontSize: '11px', margin: 0 }}>
                              {indicator.id}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                              color: '#fff', 
                              fontSize: '16px', 
                              fontWeight: '700',
                              marginBottom: '1px'
                            }}>
                              {formatValue(latestValue?.value, indicator)}
                            </div>
                            {change !== null && (
                              <div style={{
                                color: change > 0 ? '#66bb6a' : change < 0 ? '#ef5350' : '#999',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}>
                                {change > 0 ? '↗ +' : change < 0 ? '↘ ' : '→ '}{formatValue(Math.abs(change), indicator)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 5 dati visibili sempre */}
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ 
                            color: '#cfcfcf', 
                            fontSize: '12px', 
                            marginBottom: '6px',
                            fontWeight: '600'
                          }}>
                            Ultimi movimenti ({displayData.length} dati disponibili)
                          </div>
                          
                          {/* 5 dati sempre visibili */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }}>
                            {visibleData.map((obs, index) => (
                              <div 
                                key={`${obs.date}_${index}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '4px 6px',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  borderRadius: '3px',
                                  fontSize: '12px'
                                }}
                              >
                                <span style={{ color: '#cfcfcf', fontFamily: 'monospace', fontSize: '11px' }}>
                                  {obs.date}
                                </span>
                                <span style={{ color: '#fff', fontWeight: '600' }}>
                                  {formatValue(obs.value, indicator)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* 15 dati scrollabili se espanso */}
                          {isIndicatorExpanded && scrollableData.length > 0 && (
                            <div className="historical-data" style={{
                              maxHeight: '120px',
                              overflowY: 'auto',
                              marginTop: '6px',
                              paddingTop: '6px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3px'
                            }}>
                              {scrollableData.map((obs, index) => (
                                <div 
                                  key={`${obs.date}_scroll_${index}`}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '4px 6px',
                                    background: 'rgba(255, 255, 255, 0.01)',
                                    borderRadius: '3px',
                                    fontSize: '12px'
                                  }}
                                >
                                  <span style={{ color: '#cfcfcf', fontFamily: 'monospace', fontSize: '11px' }}>
                                    {obs.date}
                                  </span>
                                  <span style={{ color: '#fff', fontWeight: '600' }}>
                                    {formatValue(obs.value, indicator)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Controls compatti - stile backtest */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingTop: '6px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                          <span style={{ color: '#cfcfcf', fontSize: '11px' }}>
                            {observations.length} tot • {displayData.length} mostrati
                          </span>
                          
                          {scrollableData.length > 0 && (
                            <Button
                              onClick={() => toggleIndicator(categoryKey, indicator.id)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              style={{
                                padding: '3px 6px',
                                fontSize: '11px',
                                minWidth: 'auto',
                                background: isIndicatorExpanded 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : `${config.color}15`,
                                border: `1px solid ${isIndicatorExpanded ? 'rgba(255, 255, 255, 0.2)' : config.color + '30'}`,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {isIndicatorExpanded ? '🔼 Meno' : `🔽 Altri ${scrollableData.length}`}
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