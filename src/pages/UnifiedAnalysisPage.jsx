import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';

// Services
import macroService from '../services/macroService.js';
import ecbService from '../services/ecbService.js';
import eurostatService from '../services/eurostatService.js';

// Components Analysis
import AnalysisSearch from '../components/analysis/AnalysisSearch.jsx';
import CompareSection from '../components/analysis/CompareSection.jsx';
import CategorySection from '../components/analysis/CategorySection.jsx';
import CustomIndicators from '../components/analysis/CustomIndicators.jsx';

// Styles
import '../styles/index.css';
import '../styles/components.css';
import '../styles/HeatmapPage.css';

/**
 * 🔥 UnifiedAnalysisPage - Combina Heatmap + Analisi
 * 
 * STRUTTURA:
 * 1. SEZIONE HEATMAP (sopra) - Visualizzazione rapida indicatori con colori
 * 2. SEZIONE ANALISI (sotto) - Dettagli completi, confronti, ricerche
 * 
 * VANTAGGI UX:
 * - Vista d'insieme immediata (heatmap)
 * - Drill-down per dettagli (analisi)
 * - Single-page experience fluida
 */

export default function UnifiedAnalysisPage() {
  // Stati condivisi
  const [region, setRegion] = useState('USA'); // Sincronizzato tra heatmap e analisi
  
  // Stati Heatmap
  const [heatmapData, setHeatmapData] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [heatmapError, setHeatmapError] = useState(null);
  const [viewMode, setViewMode] = useState('monthly');
  const [yearsToShow, setYearsToShow] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  
  // Stati Analisi
  const [macroData, setMacroData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [customIndicators, setCustomIndicators] = useState({});
  const [primaryIndicator, setPrimaryIndicator] = useState(null);
  const [compareIndicator, setCompareIndicator] = useState(null);
  const [showCompareChart, setShowCompareChart] = useState(false);

  // ====================
  // HEATMAP DATA LOADING
  // ====================
  
  const loadHeatmapData = async () => {
    setHeatmapLoading(true);
    setHeatmapError(null);

    try {
      let result;
      if (region === 'USA') {
        result = await macroService.fetchMacroDataComplete();
      } else {
        const [ecbData, eurostatData] = await Promise.all([
          ecbService.fetchEcbDataComplete(),
          eurostatService.fetchEurostatDataComplete()
        ]);
        
        result = {
          data: {
            'BCE': ecbData.data?.['BCE'] || [],
            'Eurostat': eurostatData.data?.['Eurostat'] || []
          },
          metadata: {
            lastUpdate: new Date().toISOString()
          }
        };
      }
      
      // Normalizza struttura: usa sempre 'indicators' per compatibilità
      const normalizedData = {
        indicators: result.data || result.indicators || {},
        metadata: result.metadata || { lastUpdate: new Date().toISOString() }
      };
      
      setHeatmapData(normalizedData);
    } catch (err) {
      console.error('Errore caricamento heatmap:', err);
      setHeatmapError(err.message || 'Errore nel caricamento dei dati');
    } finally {
      setHeatmapLoading(false);
    }
  };

  // ====================
  // ANALYSIS DATA LOADING
  // ====================
  
  const loadAnalysisData = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    setLoadingLogs([]);

    const addLog = (message) => {
      setLoadingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    try {
      addLog('🔌 Connessione al backend...');
      
      let result;
      
      if (region === 'USA') {
        addLog('🇺🇸 Caricamento indicatori USA (FRED)...');
        result = await macroService.fetchMacroDataComplete(70);
      } else {
        addLog('🇪🇺 Caricamento indicatori EU (BCE + Eurostat)...');
        const [ecbData, eurostatData] = await Promise.all([
          ecbService.fetchEcbDataComplete(),
          eurostatService.fetchEurostatDataComplete()
        ]);
        
        result = {
          data: {
            ...ecbData.data,
            ...eurostatData.data
          },
          metadata: {
            lastUpdate: new Date().toISOString()
          }
        };
      }
      
      // Normalizza struttura: usa sempre 'indicators' per compatibilità con componenti
      const normalizedData = {
        indicators: result.data || result.indicators || {},
        metadata: result.metadata || { lastUpdate: new Date().toISOString() }
      };
      
      addLog(`✅ ${Object.keys(normalizedData.indicators).length} categorie caricate`);
      setMacroData(normalizedData);
      
    } catch (err) {
      console.error('Errore caricamento analisi:', err);
      setAnalysisError(err.message || 'Errore nel caricamento dei dati');
      addLog(`❌ Errore: ${err.message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Carica dati all'avvio e quando cambia regione
  useEffect(() => {
    loadHeatmapData();
    loadAnalysisData();
  }, [region]);

  // ====================
  // HEATMAP LOGIC
  // ====================

  const detectDataFrequency = (observations) => {
    if (!observations || observations.length === 0) return 'monthly';
    const hasQuarterly = observations.some(d => d && d.includes && d.includes('-Q'));
    return hasQuarterly ? 'quarterly' : 'monthly';
  };

  const generatePeriods = (mode, years) => {
    const periods = [];
    const now = new Date();
    const periodsCount = mode === 'monthly' ? years * 12 : years * 4;

    for (let i = periodsCount - 1; i >= 0; i--) {
      const date = new Date(now);
      
      if (mode === 'monthly') {
        date.setMonth(date.getMonth() - i);
        periods.push({
          label: date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
          fullLabel: date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
          date: new Date(date),
          year: date.getFullYear(),
          month: date.getMonth()
        });
      } else {
        const quarter = Math.floor(i / 3);
        date.setMonth(date.getMonth() - (quarter * 3));
        const q = Math.floor(date.getMonth() / 3) + 1;
        periods.push({
          label: `Q${q} ${date.getFullYear().toString().slice(-2)}`,
          fullLabel: `Q${q} ${date.getFullYear()}`,
          date: new Date(date),
          year: date.getFullYear(),
          quarter: q
        });
      }
    }

    return periods.reverse();
  };

  const getValueForPeriod = (indicator, period) => {
    if (!indicator.observations || indicator.observations.length === 0) return null;

    const frequency = detectDataFrequency(indicator.observations);
    
    let targetDates = [];
    
    if (frequency === 'quarterly') {
      const monthNum = period.month + 1;
      const isQuarterEndMonth = monthNum % 3 === 0;
      if (!isQuarterEndMonth) return null;
      
      const quarter = Math.ceil(monthNum / 3);
      targetDates = [`${period.year}-Q${quarter}`];
    } else {
      const monthStr = String(period.month + 1).padStart(2, '0');
      targetDates = [
        `${period.year}-${monthStr}-01`,
        `${period.year}-${monthStr}`,
        `${period.year}-Q${Math.ceil((period.month + 1) / 3)}`
      ];
    }

    for (const targetDate of targetDates) {
      const idx = indicator.observations.findIndex(obs => obs === targetDate);
      if (idx !== -1 && indicator.values[idx] != null) {
        return indicator.values[idx];
      }
    }

    return null;
  };

  const getCellColor = (currentValue, previousValue) => {
    if (currentValue === null || previousValue === null) return '#2a2a2a';
    
    const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
    
    if (Math.abs(change) < 0.1) return '#3a3a3a';
    
    const intensity = Math.min(Math.abs(change) / 5, 1);
    
    if (change > 0) {
      const r = Math.round(76 + (163 * intensity));
      const g = Math.round(175 + (80 * intensity));
      const b = Math.round(80 + (75 * intensity));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.round(239 + (16 * intensity));
      const g = Math.round(83 + (172 * intensity));
      const b = Math.round(80 + (175 * intensity));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const processHeatmapData = () => {
    if (!heatmapData?.indicators) return [];

    const periods = generatePeriods(viewMode, yearsToShow);
    const rows = [];

    Object.entries(heatmapData.indicators).forEach(([categoryKey, indicators]) => {
      if (!indicators || indicators.length === 0) return;

      indicators.forEach(indicator => {
        const rowData = {
          id: indicator.id,
          name: indicator.name,
          category: categoryKey,
          categoryLabel: categoryKey,
          units: indicator.units || '',
          link: indicator.link || null,
          cells: []
        };

        let previousValue = null;
        periods.forEach(period => {
          const currentValue = getValueForPeriod(indicator, period);
          const color = previousValue !== null ? getCellColor(currentValue, previousValue) : '#2a2a2a';
          
          rowData.cells.push({
            value: currentValue,
            color: color,
            period: period.fullLabel
          });

          if (currentValue !== null) {
            previousValue = currentValue;
          }
        });

        rows.push(rowData);
      });
    });

    return rows.filter(row => {
      if (!searchFilter.trim()) return true;
      const search = searchFilter.toLowerCase();
      return row.name.toLowerCase().includes(search) || 
             row.id.toLowerCase().includes(search);
    });
  };

  const filteredHeatmapRows = processHeatmapData();
  const periods = generatePeriods(viewMode, yearsToShow);

  // ====================
  // ANALYSIS LOGIC
  // ====================

  // (Copio tutta la logica da AnalysisPage - search, custom indicators, compare, etc.)
  // Per brevità mostro solo la struttura principale

  const allAvailableIndicators = React.useMemo(() => {
    if (!macroData?.indicators) return [];
    
    const indicators = Object.entries(macroData.indicators).flatMap(([categoryKey, categoryIndicators]) =>
      (categoryIndicators || []).map(indicator => ({
        ...indicator,
        category: categoryKey
      }))
    );
    
    return indicators;
  }, [macroData]);

  const searchExternalIndicators = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      let results = [];
      
      if (region === 'USA') {
        const fredSearch = await macroService.searchFredSeries(searchText);
        results = fredSearch.results;
      } else {
        const [ecbSearch, eurostatSearch] = await Promise.all([
          ecbService.searchEcbSeries(searchText),
          eurostatService.searchEurostatSeries(searchText)
        ]);
        
        results = [
          ...(ecbSearch.results || []),
          ...(eurostatSearch.results || [])
        ];
      }

      setSearchResults(results || []);
    } catch (error) {
      console.error('Errore ricerca:', error);
      setSearchError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => searchExternalIndicators(searchTerm), 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, region]);

  const filteredCategories = React.useMemo(() => {
    if (!macroData?.indicators) return {};

    const filtered = {};
    
    Object.entries(macroData.indicators).forEach(([categoryKey, indicators]) => {
      if (!indicators || indicators.length === 0) return;
      
      if (selectedCategory !== 'all' && categoryKey !== selectedCategory) return;

      const filteredIndicators = indicators.filter(ind => {
        if (!searchTerm.trim()) return true;
        const search = searchTerm.toLowerCase();
        return ind.name.toLowerCase().includes(search) || 
               ind.id.toLowerCase().includes(search);
      });

      if (filteredIndicators.length > 0) {
        filtered[categoryKey] = filteredIndicators;
      }
    });

    return filtered;
  }, [macroData, searchTerm, selectedCategory]);

  const totalIndicatorsCount = React.useMemo(() => {
    if (!macroData?.indicators) return 0;
    return Object.values(macroData.indicators).reduce((total, indicators) => 
      total + (indicators?.length || 0), 0
    );
  }, [macroData]);

  // ====================
  // RENDER
  // ====================

  const centerContent = (
    <div className="heatmap-page">
      {/* ========================
          SEZIONE 1: HEATMAP
          ======================== */}
      <div className="panel" style={{ marginBottom: '30px' }}>
        {/* Header Compatto */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '0 0 auto' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
              📊 Heatmap Indicatori Economici
            </h2>
          </div>
          
          {/* Toggle Regione */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            background: 'rgba(255,255,255,0.05)',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Button 
              onClick={() => setRegion('USA')}
              style={{
                padding: '8px 16px',
                background: region === 'USA' ? 'rgba(33, 150, 243, 0.3)' : 'transparent',
                border: region === 'USA' ? '1px solid rgba(33, 150, 243, 0.5)' : '1px solid transparent',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              🇺🇸 USA
            </Button>
            <Button 
              onClick={() => setRegion('EU')}
              style={{
                padding: '8px 16px',
                background: region === 'EU' ? 'rgba(255, 193, 7, 0.3)' : 'transparent',
                border: region === 'EU' ? '1px solid rgba(255, 193, 7, 0.5)' : '1px solid transparent',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              🇪🇺 EU
            </Button>
          </div>

          {/* Badge Info */}
          {!heatmapLoading && heatmapData && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: region === 'USA' 
                ? 'rgba(33, 150, 243, 0.15)'
                : 'rgba(255, 193, 7, 0.15)',
              borderRadius: '6px',
              border: region === 'USA' 
                ? '1px solid rgba(33, 150, 243, 0.3)'
                : '1px solid rgba(255, 193, 7, 0.3)',
              fontSize: '12px',
              color: '#fff',
              fontWeight: '500'
            }}>
              <span>{region === 'USA' ? '📊' : '✅'}</span>
              <span>
                {region === 'USA' ? '30 indicatori' : '23 indicatori'}
              </span>
            </div>
          )}
        </div>

        {/* Controlli */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          flexWrap: 'wrap',
          marginBottom: '15px'
        }}>
          <input
            type="text"
            placeholder="🔍 Cerca indicatore..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px'
            }}
          />

          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="monthly">📅 Mensile</option>
            <option value="quarterly">📊 Trimestrale</option>
          </select>

          <select 
            value={yearsToShow} 
            onChange={(e) => setYearsToShow(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="1">1 anno</option>
            <option value="2">2 anni</option>
            <option value="3">3 anni</option>
            <option value="5">5 anni</option>
          </select>

          <Button onClick={loadHeatmapData} style={{ padding: '8px 16px', fontSize: '13px' }}>
            🔄 Aggiorna
          </Button>
        </div>

        {/* Tabella Heatmap */}
        {heatmapLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spinner />
            <p style={{ color: '#999', marginTop: '10px' }}>Caricamento heatmap...</p>
          </div>
        ) : heatmapError ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#ef5350' }}>❌ {heatmapError}</p>
          </div>
        ) : (
          <div className="heatmap-container" style={{
            maxWidth: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}>
            <div className="heatmap-scroll" style={{
              overflowX: 'auto',
              overflowY: 'auto',
              maxHeight: '70vh',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th className="indicator-column sticky-col">Indicatore</th>
                    {periods.map((period, idx) => (
                      <th key={idx} title={period.fullLabel}>
                        {period.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHeatmapRows.length === 0 ? (
                    <tr>
                      <td colSpan={periods.length + 1} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        Nessun indicatore trovato
                      </td>
                    </tr>
                  ) : (
                    filteredHeatmapRows.map((row) => (
                      <tr key={row.id}>
                        <td className="sticky-col" style={{ 
                          minWidth: '200px',
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}>
                          <div>
                            {row.link ? (
                              <a href={row.link} target="_blank" rel="noopener noreferrer" 
                                 style={{ color: '#667eea', textDecoration: 'none' }}>
                                {row.name}
                              </a>
                            ) : (
                              <span>{row.name}</span>
                            )}
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
                              {row.units}
                            </div>
                          </div>
                        </td>
                        {row.cells.map((cell, idx) => (
                          <td 
                            key={idx} 
                            className="value-cell"
                            style={{ 
                              backgroundColor: cell.color,
                              color: '#fff',
                              fontWeight: '600'
                            }}
                            title={`${cell.period}: ${cell.value !== null ? cell.value.toFixed(2) : 'N/A'}`}
                          >
                            {cell.value !== null ? cell.value.toFixed(2) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================
          SEZIONE 2: ANALISI
          ======================== */}
      <div className="panel">
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
          📈 Analisi Dettagliata Indicatori
        </h2>

        {analysisLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spinner />
            <h3 style={{ color: '#fff', marginTop: '20px' }}>
              📊 Caricamento Analisi Economica
            </h3>
            <p style={{ color: '#999', fontSize: '16px', marginTop: '10px' }}>
              Connessione a Google Cloud Run API...
            </p>
            
            {loadingLogs.length > 0 && (
              <div className="card" style={{ marginTop: '20px', textAlign: 'left' }}>
                <div className="card-header">🔄 Log di Sistema</div>
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
            )}
          </div>
        ) : analysisError ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ color: '#ef5350', marginBottom: '20px' }}>Errore del Sistema</h3>
            <div className="card" style={{ 
              background: 'rgba(239, 83, 80, 0.1)', 
              border: '1px solid rgba(239, 83, 80, 0.3)',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#ef5350', fontFamily: 'monospace', fontSize: '13px' }}>
                {analysisError}
              </p>
            </div>
            <Button onClick={loadAnalysisData}>
              🔄 Riprova
            </Button>
          </div>
        ) : (
          <>
            {/* Ricerca & Confronto */}
            <AnalysisSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              region={region}
              macroData={macroData}
              totalIndicatorsCount={totalIndicatorsCount}
              searchResults={searchResults}
              isSearching={isSearching}
              searchError={searchError}
              customIndicators={customIndicators}
              setCustomIndicators={setCustomIndicators}
            />

            {/* Sezione Confronto */}
            {showCompareChart && (
              <CompareSection
                primaryIndicator={primaryIndicator}
                compareIndicator={compareIndicator}
                setPrimaryIndicator={setPrimaryIndicator}
                setCompareIndicator={setCompareIndicator}
                setShowCompareChart={setShowCompareChart}
                allAvailableIndicators={allAvailableIndicators}
                customIndicators={customIndicators}
                region={region}
              />
            )}

            {/* Custom Indicators */}
            {Object.keys(customIndicators).length > 0 && (
              <CustomIndicators
                customIndicators={customIndicators}
                setCustomIndicators={setCustomIndicators}
                expandedIndicators={expandedIndicators}
                setExpandedIndicators={setExpandedIndicators}
                setPrimaryIndicator={setPrimaryIndicator}
                setCompareIndicator={setCompareIndicator}
                setShowCompareChart={setShowCompareChart}
              />
            )}

            {/* Categorie Standard */}
            {Object.entries(filteredCategories).map(([categoryKey, indicators]) => (
              <CategorySection
                key={categoryKey}
                categoryKey={categoryKey}
                indicators={indicators}
                expandedCategories={expandedCategories}
                setExpandedCategories={setExpandedCategories}
                expandedIndicators={expandedIndicators}
                setExpandedIndicators={setExpandedIndicators}
                setPrimaryIndicator={setPrimaryIndicator}
                setCompareIndicator={setCompareIndicator}
                setShowCompareChart={setShowCompareChart}
                region={region}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );

  return <MainLayout center={centerContent} />;
}
