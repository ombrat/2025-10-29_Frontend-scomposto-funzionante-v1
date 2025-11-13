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
import '../styles/HeatmapPage-dark.css';

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
        // EU: Carica BCE + Eurostat e merge categorie
        const [ecbData, eurostatData] = await Promise.all([
          ecbService.fetchMacroDataComplete(),
          eurostatService.fetchMacroDataComplete()
        ]);
        
        // Merge categorie: combina indicatori da BCE e Eurostat per ogni categoria
        const mergedIndicators = {};
        
        // Prima aggiungi tutti gli indicatori BCE
        if (ecbData.indicators) {
          Object.entries(ecbData.indicators).forEach(([category, indicators]) => {
            if (!mergedIndicators[category]) {
              mergedIndicators[category] = [];
            }
            mergedIndicators[category].push(...indicators);
          });
        }
        
        // Poi aggiungi gli indicatori Eurostat
        if (eurostatData.indicators) {
          Object.entries(eurostatData.indicators).forEach(([category, indicators]) => {
            if (!mergedIndicators[category]) {
              mergedIndicators[category] = [];
            }
            mergedIndicators[category].push(...indicators);
          });
        }
        
        result = {
          indicators: mergedIndicators,
          metadata: {
            lastUpdate: new Date().toISOString(),
            sources: ['BCE', 'Eurostat']
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
          ecbService.fetchMacroDataComplete(),
          eurostatService.fetchMacroDataComplete()
        ]);
        
        // Merge categorie: combina indicatori da BCE e Eurostat per ogni categoria
        const mergedIndicators = {};
        
        // Prima aggiungi tutti gli indicatori BCE
        if (ecbData.indicators) {
          Object.entries(ecbData.indicators).forEach(([category, indicators]) => {
            if (!mergedIndicators[category]) {
              mergedIndicators[category] = [];
            }
            mergedIndicators[category].push(...indicators);
          });
        }
        
        // Poi aggiungi gli indicatori Eurostat
        if (eurostatData.indicators) {
          Object.entries(eurostatData.indicators).forEach(([category, indicators]) => {
            if (!mergedIndicators[category]) {
              mergedIndicators[category] = [];
            }
            mergedIndicators[category].push(...indicators);
          });
        }
        
        result = {
          indicators: mergedIndicators,
          metadata: {
            lastUpdate: new Date().toISOString(),
            sources: ['BCE', 'Eurostat']
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
    const hasQuarterly = observations.some(obs => obs && obs.date && obs.date.includes('-Q'));
    return hasQuarterly ? 'quarterly' : 'monthly';
  };

  const calculateValueForPeriod = (indicator, period) => {
    const observations = indicator.observations;
    if (!observations || observations.length === 0) return null;

    const frequency = detectDataFrequency(observations);
    let targetDates = [];
    
    if (period.month !== undefined) {
      const monthStr = String(period.month + 1).padStart(2, '0');
      
      if (frequency === 'quarterly') {
        const monthNum = period.month + 1;
        const isQuarterEndMonth = monthNum % 3 === 0;
        if (!isQuarterEndMonth) return null;
        
        const quarter = Math.ceil(monthNum / 3);
        targetDates = [`${period.year}-Q${quarter}`];
      } else {
        targetDates = [
          `${period.year}-${monthStr}-01`,
          `${period.year}-${monthStr}`
        ];
      }
    } else if (period.quarter !== undefined) {
      const firstMonthOfQuarter = (period.quarter - 1) * 3 + 1;
      targetDates = [
        `${period.year}-Q${period.quarter}`,
        `${period.year}-${String(firstMonthOfQuarter).padStart(2, '0')}-01`
      ];
    }
    
    let matchingObs = null;
    for (const targetDate of targetDates) {
      matchingObs = observations.find(obs => obs && obs.date && obs.date.trim() === targetDate);
      if (matchingObs) break;
    }

    if (!matchingObs || matchingObs.value === '.' || matchingObs.value === null) {
      return null;
    }

    const value = parseFloat(matchingObs.value);
    if (isNaN(value)) return null;

    const currentIndex = observations.findIndex(obs => obs.date === matchingObs.date);
    let previousValue = null;
    let changePercent = null;
    
    if (currentIndex > 0) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const prevObs = observations[i];
        if (prevObs.value && prevObs.value !== '.') {
          previousValue = parseFloat(prevObs.value);
          if (!isNaN(previousValue) && previousValue !== 0) {
            const change = value - previousValue;
            changePercent = (change / previousValue) * 100;
            break;
          }
        }
      }
    }

    return { value, previousValue, changePercent, date: matchingObs.date };
  };

  const getCellColor = (cellData, indicator) => {
    if (!cellData || cellData.changePercent === null || cellData.changePercent === undefined) {
      return 'rgba(100, 116, 139, 0.1)';
    }

    const change = cellData.changePercent;
    
    const inverseIndicatorsUSA = [
      'UNRATE', 'ICSA', 'CPIAUCSL', 'CPILFESL', 'PPIACO', 'DRCCLACBS'
    ];
    
    const inverseIndicatorsEU = [
      'UNEMPLOYMENT_EA', 'HICP_EA', 'HICP_CORE', 'HICP_ENERGY', 'HICP_FOOD',
      'PPI_EA', 'HICP_ENERGY_EA', 'HICP_FOOD_EA', 'HICP_CORE_EA'
    ];
    
    const isInverse = region === 'USA' 
      ? inverseIndicatorsUSA.includes(indicator.id)
      : inverseIndicatorsEU.includes(indicator.id);
    
    const isGoodChange = isInverse ? change < 0 : change > 0;
    
    const absChange = Math.abs(change);
    let intensity;
    
    if (absChange < 0.5) intensity = 0.2;
    else if (absChange < 1) intensity = 0.35;
    else if (absChange < 2) intensity = 0.5;
    else if (absChange < 5) intensity = 0.7;
    else intensity = 0.9;
    
    if (isGoodChange) {
      return `rgba(34, 197, 94, ${intensity})`;
    } else {
      return `rgba(239, 68, 68, ${intensity})`;
    }
  };

  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  // Funzione per navigare all'indicatore nella sezione analisi
  const navigateToIndicator = (indicatorId, categoryKey) => {
    // Scrolla alla sezione analisi
    const analysisSection = document.querySelector('.panel:nth-child(2)'); // Seconda sezione panel
    if (analysisSection) {
      analysisSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Chiudi tutti gli indicatori prima
    setExpandedIndicators({});
    
    // Espandi solo la categoria selezionata (chiudi le altre)
    setTimeout(() => {
      setExpandedCategories({
        [categoryKey]: true
      });
      
      // Dopo aver espanso la categoria, espandi SOLO l'indicatore specifico
      setTimeout(() => {
        const key = `${categoryKey}_${indicatorId}`;
        setExpandedIndicators({
          [key]: true
        });
        
        // Evidenzia l'indicatore
        setTimeout(() => {
          const indicatorElement = document.getElementById(`indicator-${categoryKey}-${indicatorId}`);
          if (indicatorElement) {
            indicatorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            indicatorElement.style.transition = 'background-color 0.3s';
            indicatorElement.style.backgroundColor = 'rgba(102, 187, 106, 0.2)';
            setTimeout(() => {
              indicatorElement.style.backgroundColor = '';
            }, 2000);
          }
        }, 100);
      }, 400);
    }, 500);
  };

  // ====================

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

  const heatmapProcessedData = React.useMemo(() => {
    if (!heatmapData || !heatmapData.indicators) return null;

    const allIndicators = [];
    const categories = heatmapData.indicators;

    Object.keys(categories).forEach(categoryKey => {
      categories[categoryKey].forEach(indicator => {
        if (indicator.observations && indicator.observations.length > 0) {
          allIndicators.push({
            ...indicator,
            categoryKey
          });
        }
      });
    });

    const periods = generatePeriods(viewMode, yearsToShow);

    const rows = allIndicators.map(indicator => {
      const values = periods.map(period => {
        return calculateValueForPeriod(indicator, period);
      });

      return {
        id: indicator.id,
        name: indicator.name,
        description: indicator.description,
        category: indicator.categoryKey,
        categoryLabel: indicator.categoryKey === 'employment' ? 'Mondo del Lavoro' :
                       indicator.categoryKey === 'growth' ? 'Crescita Economica' :
                       indicator.categoryKey === 'stability' ? 'Solidità Economica' : indicator.categoryKey,
        values,
        units: indicator.units
      };
    });

    const categoryOrder = ['employment', 'growth', 'stability'];
    rows.sort((a, b) => {
      const orderA = categoryOrder.indexOf(a.category);
      const orderB = categoryOrder.indexOf(b.category);
      return orderA - orderB;
    });

    const filteredRows = rows.filter(row => {
      if (!searchFilter.trim()) return true;
      const search = searchFilter.toLowerCase();
      return row.name.toLowerCase().includes(search) || 
             row.id.toLowerCase().includes(search) ||
             row.categoryLabel.toLowerCase().includes(search);
    });

    return {
      periods,
      rows: filteredRows
    };
  }, [heatmapData, viewMode, yearsToShow, searchFilter, region]);

  // ====================
  // ANALYSIS LOGIC
  // ====================

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
      let error = null;
      
      if (region === 'USA') {
        const fredSearch = await macroService.searchFredSeries(searchText);
        results = fredSearch.results;
        error = fredSearch.error;
      } else {
        const [ecbSearch, eurostatSearch] = await Promise.all([
          ecbService.searchEcbSeries(searchText),
          eurostatService.searchEurostatSeries(searchText)
        ]);
        
        results = [
          ...(ecbSearch.results || []),
          ...(eurostatSearch.results || [])
        ];
        error = ecbSearch.error || eurostatSearch.error;
      }

      if (error) {
        setSearchError(error);
        setSearchResults([]);
        return;
      }
      
      if (results && results.length > 0) {
        const existingIds = allAvailableIndicators.map(ind => ind.id);
        const newResults = results.filter(series => 
          !existingIds.includes(series.id) && !customIndicators[series.id]
        );
        
        setSearchResults(newResults);
        
        if (newResults.length === 0 && results.length > 0) {
          setSearchError('Tutti i risultati sono già presenti nella pagina');
        }
      } else {
        setSearchResults([]);
        setSearchError('Nessun risultato trovato');
      }
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

  // ====================
  // HELPER FUNCTIONS
  // ====================

  const addCustomIndicator = async (series) => {
    try {
      setLoadingLogs(prev => [...prev.slice(-8), `⏳ Caricamento ${series.id}: ${series.title}...`]);
      
      const { default: backendService } = await import('../services/backendService.js');
      const data = await backendService.getFredSeriesObservations(series.id, {
        limit: 70 * 12,
        sort_order: 'desc'
      });
      
      if (data && data.observations) {
        const customIndicator = {
          id: series.id,
          name: series.title,
          title: series.title,
          description: series.notes || '',
          observations: data.observations,
          category: 'custom',
          isCustom: true,
          addedAt: Date.now()
        };
        
        setCustomIndicators(prev => ({
          ...prev,
          [series.id]: customIndicator
        }));
        
        setSearchResults(prev => prev.filter(r => r.id !== series.id));
        setLoadingLogs(prev => [...prev.slice(-8), `✅ ${series.id} aggiunto con successo`]);
        
        if (searchResults.length <= 1) {
          setSearchTerm('');
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error('Errore aggiunta indicatore:', error);
      setLoadingLogs(prev => [...prev.slice(-8), `❌ Errore caricando ${series.id}: ${error.message}`]);
    }
  };

  const removeCustomIndicator = (seriesId) => {
    setCustomIndicators(prev => {
      const newCustom = { ...prev };
      delete newCustom[seriesId];
      return newCustom;
    });
    setLoadingLogs(prev => [...prev.slice(-8), `🗑️ ${seriesId} rimosso`]);
  };

  const getTotalFilteredResults = () => {
    let total = 0;
    Object.values(filteredCategories).forEach(indicators => {
      total += indicators.length;
    });
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const filteredCustom = Object.values(customIndicators).filter(indicator =>
        indicator.name.toLowerCase().includes(searchLower) ||
        indicator.id.toLowerCase().includes(searchLower)
      );
      total += filteredCustom.length;
    } else {
      total += Object.keys(customIndicators).length;
    }
    
    return total;
  };

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
                {region === 'USA' ? '30 indicatori' : '21 indicatori (BCE + Eurostat)'}
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
        ) : !heatmapProcessedData ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#999' }}>Nessun dato disponibile</p>
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
                    {heatmapProcessedData.periods.map((period, idx) => (
                      <th key={idx} title={period.fullLabel}>
                        {period.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapProcessedData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={heatmapProcessedData.periods.length + 1} className="no-results">
                        {searchFilter.trim() ? (
                          <>
                            🔍 Nessun risultato trovato per "<strong>{searchFilter}</strong>"
                            <br />
                            <button 
                              className="clear-search-btn"
                              onClick={() => setSearchFilter('')}
                            >
                              ✕ Cancella ricerca
                            </button>
                          </>
                        ) : (
                          'Nessun dato disponibile'
                        )}
                      </td>
                    </tr>
                  ) : (
                    heatmapProcessedData.rows.map((row, rowIdx) => {
                      const isFirstInCategory = rowIdx === 0 || heatmapProcessedData.rows[rowIdx - 1].category !== row.category;
                    
                      return (
                        <React.Fragment key={row.id}>
                          {/* Header categoria */}
                          {isFirstInCategory && (
                            <tr className="category-header-row">
                              <td colSpan={heatmapProcessedData.periods.length + 1} className="category-header">
                                <span className="category-icon">
                                  {row.category === 'employment' ? '👥' : 
                                   row.category === 'growth' ? '📈' : 
                                   row.category === 'stability' ? '🛡️' : '📊'}
                                </span>
                                {row.categoryLabel}
                              </td>
                            </tr>
                          )}
                          
                          {/* Riga principale */}
                          <tr 
                            className={expandedRows.has(row.id) ? 'expanded-row' : ''}
                            onClick={() => toggleRowExpansion(row.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="indicator-column sticky-col" title={row.name}>
                              <div className="indicator-cell">
                                <span className="expand-icon">
                                  {expandedRows.has(row.id) ? '▼' : '▶'}
                                </span>
                                <span
                                  className="indicator-name-link"
                                  style={{ cursor: 'pointer' }}
                                  title={`Vai a ${row.name} nella sezione Analisi`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToIndicator(row.id, row.category);
                                  }}
                                >
                                  {row.name}
                                </span>
                                {row.units && <span className="indicator-units">{row.units}</span>}
                                {/* Info tooltip */}
                                <div className="info-tooltip-wrapper" onClick={(e) => e.stopPropagation()}>
                                  <span className="info-icon">i</span>
                                  <div className="info-tooltip">
                                    <strong>{row.name}</strong>
                                    <p>{row.description || 'Nessuna descrizione disponibile'}</p>
                                    <small>Serie {region === 'USA' ? 'FRED' : 'ECB/Eurostat'}: {row.id}</small>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {row.values.map((cellData, colIdx) => (
                              <td
                                key={colIdx}
                                className="value-cell"
                                style={{ 
                                  backgroundColor: getCellColor(cellData, row),
                                  color: cellData && cellData.changePercent !== null ? '#000' : '#999'
                                }}
                                title={cellData ? `${row.name}: ${cellData.value?.toFixed(2)} (${cellData.date})` : 'N/A'}
                              >
                                {cellData ? cellData.value?.toFixed(2) : '—'}
                              </td>
                            ))}
                          </tr>
                          
                          {/* Riga secondaria con variazioni percentuali */}
                          {expandedRows.has(row.id) && (
                            <tr className="detail-row">
                              <td className="indicator-column sticky-col detail-label">
                                <span className="variation-label">Δ% vs precedente</span>
                              </td>
                              {row.values.map((cellData, colIdx) => (
                                <td
                                  key={colIdx}
                                  className="value-cell detail-cell"
                                  style={{ 
                                    backgroundColor: getCellColor(cellData, row),
                                    color: cellData && cellData.changePercent !== null ? '#000' : '#999'
                                  }}
                                >
                                  {cellData && cellData.changePercent !== null ? (
                                    <>
                                      {cellData.changePercent > 0 ? '↑' : cellData.changePercent < 0 ? '↓' : '→'}
                                      {cellData.changePercent >= 0 ? '+' : ''}
                                      {cellData.changePercent.toFixed(2)}%
                                    </>
                                  ) : '—'}
                                </td>
                              ))}
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer informativo */}
        {!heatmapLoading && !heatmapError && heatmapProcessedData && (
          <div style={{ 
            marginTop: '15px', 
            padding: '12px', 
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#999'
          }}>
            <p>
              <strong>Fonte dati:</strong> {region === 'USA' 
                ? 'Federal Reserve Economic Data (FRED) via Google Cloud Run'
                : 'ECB Statistical Data Warehouse + Eurostat via Google Cloud Run'}
            </p>
            <p style={{ marginTop: '6px' }}>
              <strong>Nota:</strong> I colori rappresentano la variazione percentuale rispetto al periodo precedente.
              Verde = crescita, Rosso = decrescita. Per indicatori come disoccupazione, inflazione e volatilità, i colori sono invertiti.
            </p>
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
            {/* Banner informativo disponibilità dati */}
            {!analysisLoading && macroData && (
              <div style={{
                background: region === 'USA' 
                  ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))'
                  : 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))',
                border: region === 'USA' 
                  ? '1px solid rgba(33, 150, 243, 0.3)'
                  : '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>
                  {region === 'USA' ? '📊' : 'ℹ️'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    color: '#fff', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    marginBottom: '3px'
                  }}>
                    {region === 'USA' 
                      ? '🇺🇸 Database USA Completo'
                      : '🇪🇺 Database Eurozona'}
                  </div>
                  <div style={{ color: '#bbb', fontSize: '12px', lineHeight: '1.4' }}>
                    {region === 'USA' 
                      ? `30 indicatori con 70 anni di storia | ${Object.values(macroData.indicators || {}).flat().length} serie disponibili`
                      : `21 indicatori verificati disponibili (6 BCE + 15 Eurostat) | Dati storici completi da fonti ufficiali`}
                  </div>
                </div>
              </div>
            )}

            {/* Ricerca & Confronto */}
            <AnalysisSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={Object.keys(macroData?.indicators || {})}
              totalResults={getTotalFilteredResults()}
              onRefresh={loadAnalysisData}
              isSearching={isSearching}
              searchResults={searchResults}
              searchError={searchError}
              onAddCustomIndicator={addCustomIndicator}
              customIndicators={customIndicators}
            />

            {/* Sezione Confronto */}
            {showCompareChart && primaryIndicator && (
              <CompareSection
                primary={primaryIndicator}
                compareIndicator={compareIndicator}
                onSelectCompareIndicator={(indicator) => setCompareIndicator(indicator)}
                onClose={() => {
                  setShowCompareChart(false);
                  setPrimaryIndicator(null);
                  setCompareIndicator(null);
                }}
                allIndicators={allAvailableIndicators.filter(ind => ind.id !== primaryIndicator.id)}
                macroData={macroData}
                macroService={region === 'USA' ? macroService : ecbService}
              />
            )}

            {/* Custom Indicators */}
            {Object.keys(customIndicators).length > 0 && (
              <CustomIndicators
                customIndicators={customIndicators}
                searchTerm={searchTerm}
                onRemoveIndicator={removeCustomIndicator}
                onStartCompare={(indicator) => {
                  setPrimaryIndicator(indicator);
                  setShowCompareChart(true);
                  setCompareIndicator(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                expandedIndicators={expandedIndicators}
                onToggleIndicator={(categoryKey, indicatorId) => {
                  const key = `${categoryKey}_${indicatorId}`;
                  setExpandedIndicators(prev => ({
                    ...prev,
                    [key]: !prev[key]
                  }));
                }}
                macroData={macroData}
                macroService={region === 'USA' ? macroService : ecbService}
              />
            )}

            {/* Categorie Standard */}
            {Object.entries(filteredCategories).map(([categoryKey, indicators]) => (
              <CategorySection
                key={categoryKey}
                categoryKey={categoryKey}
                indicators={indicators}
                isExpanded={expandedCategories[categoryKey]}
                onToggleCategory={(key) => {
                  setExpandedCategories(prev => ({
                    ...prev,
                    [key]: !prev[key]
                  }));
                }}
                expandedIndicators={expandedIndicators}
                onToggleIndicator={(catKey, indicatorId) => {
                  const key = `${catKey}_${indicatorId}`;
                  setExpandedIndicators(prev => ({
                    ...prev,
                    [key]: !prev[key]
                  }));
                }}
                onStartCompare={(indicator) => {
                  setPrimaryIndicator(indicator);
                  setShowCompareChart(true);
                  setCompareIndicator(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                macroData={macroData}
                macroService={region === 'USA' ? macroService : ecbService}
              />
            ))}

            {/* Log panel sempre visibile */}
            {loadingLogs.length > 0 && (
              <div className="panel" style={{ marginTop: '20px' }}>
                <div className="panel-title">🔄 Log di Sistema</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', maxHeight: '150px', overflowY: 'auto' }}>
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
          </>
        )}
      </div>
    </div>
  );

  return <MainLayout center={centerContent} />;
}
