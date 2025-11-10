import React, { useState, useEffect, useMemo, useRef } from 'react';
import macroService from '../services/macroService.js';
import useResizeObserver from '../hooks/useResizeObserver.js';

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
 * MIGLIORAMENTI v5.0:
 * - Layout più scorrevole con filtri in alto
 * - 20 dati per indicatore (5 visibili + scroll per 15)  
 * - UX eventi identici al backtest
 * - Interazioni smooth e responsive
 * - Animazioni CSS per smooth transitions
 * - Hover effects e micro-interactions
 **/

// CompareSection component
const CompareSection = ({ 
  primary, 
  compareIndicator, 
  onIndicatorSelect, 
  onClose, 
  availableIndicators 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const svgRef = useRef();
  const WIDTH = 700;
  const HEIGHT = 400;
  
  // Filtra gli indicatori in base alla ricerca
  const filteredIndicators = availableIndicators.filter(indicator => 
    indicator.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ 
      background: 'rgba(0, 0, 0, 0.6)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '30px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '20px', margin: 0 }}>
          📊 Confronto Indicatori
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(239, 83, 80, 0.1)',
            border: '1px solid rgba(239, 83, 80, 0.3)',
            color: '#ef5350',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ✕ Chiudi
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ color: '#fff', fontSize: '16px', marginBottom: '10px' }}>
          📈 Indicatore Primario: <strong>{primary.title}</strong>
        </div>
        
        {/* Barra di ricerca */}
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="🔍 Cerca indicatore da confrontare..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Lista indicatori filtrati */}
        <div style={{ 
          maxHeight: '150px', 
          overflowY: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          {filteredIndicators.slice(0, 10).map((indicator) => (
            <div
              key={indicator.key}
              onClick={() => onIndicatorSelect(indicator)}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#fff',
                transition: 'background 0.2s',
                ':hover': {
                  background: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {indicator.title}
            </div>
          ))}
        </div>
      </div>

      {/* Grafico di confronto */}
      {compareIndicator && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '15px' }}>
            ⚖️ Confronto: {primary.title} vs {compareIndicator.title}
          </h3>
          <CompareChart primary={primary} secondary={compareIndicator} />
        </div>
      )}
    </div>
  );
};

export default function AnalysisPage() {
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [showCharts, setShowCharts] = useState({});
  
  // Stati per il sistema di confronto
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [primaryIndicator, setPrimaryIndicator] = useState(null);
  const [compareIndicator, setCompareIndicator] = useState(null);
  const [showCompareChart, setShowCompareChart] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState([]);
  
  // Filtri - stile backtest
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Stati per ricerca estesa
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [customIndicators, setCustomIndicators] = useState({});

  // Raccogli tutti gli indicatori disponibili per la ricerca
  const allAvailableIndicators = useMemo(() => {
    if (!macroData?.data) return [];
    return Object.entries(macroData.data).flatMap(([categoryKey, categoryData]) =>
      Object.entries(categoryData.indicators || {}).map(([indicatorKey, indicatorData]) => ({
        key: `${categoryKey}_${indicatorKey}`,
        title: indicatorData.title,
        data: indicatorData.data,
        categoryKey,
        indicatorKey
      }))
    );
  }, [macroData]);

  // Funzione per cercare indicatori esterni tramite FRED API
  const searchExternalIndicators = async (searchText) => {
    if (!searchText || searchText.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Importa backendService
      const { default: backendService } = await import('../services/backendService.js');
      
      // Cerca tramite API FRED
      const results = await backendService.searchSeries(searchText, 15);
      
      if (results && results.seriess) {
        // Filtra risultati che non sono già presenti
        const existingIds = allAvailableIndicators.map(ind => ind.key.split('_')[1]);
        const newResults = results.seriess.filter(series => 
          !existingIds.includes(series.id) && 
          !customIndicators[series.id]
        );
        
        setSearchResults(newResults);
        
        if (newResults.length === 0 && results.seriess.length > 0) {
          setSearchError('Tutti i risultati sono già presenti nella pagina');
        }
      } else {
        setSearchResults([]);
        setSearchError('Nessun risultato trovato');
      }
    } catch (error) {
      console.error('Errore ricerca esterna:', error);
      setSearchError('Errore durante la ricerca: ' + error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Funzione per aggiungere un indicatore personalizzato
  const addCustomIndicator = async (series) => {
    try {
      setLoadingLogs(prev => [...prev.slice(-8), `Caricamento ${series.id}: ${series.title}...`]);
      
      // Importa backendService
      const { default: backendService } = await import('../services/backendService.js');
      
      // Carica i dati dell'indicatore
      const data = await backendService.getFredSeriesObservations(series.id, {
        limit: 70 * 12, // 70 anni di dati
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
        
        // Rimuovi dai risultati di ricerca
        setSearchResults(prev => prev.filter(r => r.id !== series.id));
        
        setLoadingLogs(prev => [...prev.slice(-8), `✅ ${series.id} aggiunto con successo`]);
        
        // Clear search se non ci sono più risultati
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

  // Funzione per rimuovere un indicatore personalizzato
  const removeCustomIndicator = (seriesId) => {
    setCustomIndicators(prev => {
      const newCustom = { ...prev };
      delete newCustom[seriesId];
      return newCustom;
    });
    setLoadingLogs(prev => [...prev.slice(-8), `🗑️ ${seriesId} rimosso`]);
  };

  // Debounce della ricerca esterna
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchExternalIndicators(searchTerm);
    }, 800); // Attendi 800ms dopo che l'utente smette di digitare

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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

  // Configurazione per singolo indicatore (colore, nome, categoria)
  // Cerca prima nei dati caricati (`macroData`), poi nei valori ufficiali di MacroService
  const getIndicatorConfig = (indicatorId) => {
    if (!indicatorId) return { id: null, name: '', color: '#999', category: null };

    // Cerca nei dati già caricati
    if (macroData && macroData.data) {
      for (const [categoryKey, categoryData] of Object.entries(macroData.data)) {
        const found = (categoryData.indicators || []).find(i => i.id === indicatorId || i.key === indicatorId);
        if (found) {
          return {
            id: found.id || indicatorId,
            name: found.name || found.title || found.id || indicatorId,
            color: getCategoryConfig(categoryKey).color,
            category: categoryKey,
            description: found.description || ''
          };
        }
      }
    }

    // Fallback: cerca nella lista ufficiale fornita da MacroService
    try {
      const official = macroService.getOfficialFredIndicators();
      for (const [categoryKey, indicators] of Object.entries(official)) {
        const f = indicators.find(i => i.id === indicatorId);
        if (f) {
          return {
            id: f.id,
            name: f.name || f.title || f.id,
            color: getCategoryConfig(categoryKey).color,
            category: categoryKey,
            description: f.description || ''
          };
        }
      }
    } catch (e) {
      // ignore and fallback to default
    }

    // Default generico
    return { id: indicatorId, name: indicatorId, color: '#999', category: null };
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

  // Funzione per scaricare CSV di un indicatore
  const downloadIndicatorCSV = (indicator, categoryName) => {
    if (!indicator.observations || indicator.observations.length === 0) {
      alert('Nessun dato disponibile per questo indicatore');
      return;
    }

    // Header CSV
    const headers = ['Data', 'Valore', 'Indicatore', 'Nome', 'Categoria'];
    
    // Dati CSV
    const csvData = indicator.observations.map(obs => [
      obs.date,
      obs.value === '.' ? 'N/A' : obs.value,
      indicator.id,
      `"${indicator.name}"`, // Escape per nomi con virgole
      categoryName
    ]);
    
    // Combina header e dati
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    // Crea e scarica il file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${indicator.id}_${indicator.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Funzioni per gestire il confronto tra indicatori
  const startCompare = (indicator) => {
    setPrimaryIndicator(indicator);
    setShowCompareChart(true);
    setShowCompareModal(false);
    setCompareIndicator(null);
    // Scroll to top per mostrare la sezione di confronto
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectSecondIndicator = (indicator) => {
    setCompareIndicator(indicator);
  };

  const closeCompare = () => {
    setShowCompareChart(false);
    setPrimaryIndicator(null);
    setCompareIndicator(null);
  };

  // Componente per il grafico di confronto tra due indicatori
  const CompareChart = ({ primary, secondary }) => {
    const chartRef = useRef(null);
    const svgRef = useRef(null);
    const [hoverData, setHoverData] = useState(null);
    const { width: chartWidth } = useResizeObserver(chartRef);
    
    if (!primary?.observations || !secondary?.observations) return null;

    // Calcola dimensioni responsive
    const computedWidth = Math.round(chartWidth || 900);
    const WIDTH = Math.max(600, Math.min(1200, computedWidth));
    const HEIGHT = Math.round(WIDTH * 0.44);

    const RIGHT_MARGIN = 48;
    const TOP_MARGIN = 48;
    const BOTTOM_MARGIN = 70;

    // Filtra e normalizza i dati
    const primaryData = primary.observations.filter(d => d.value !== '.' && !isNaN(parseFloat(d.value)))
      .map(d => ({ date: new Date(d.date), value: parseFloat(d.value) }));
    
    const secondaryData = secondary.observations.filter(d => d.value !== '.' && !isNaN(parseFloat(d.value)))
      .map(d => ({ date: new Date(d.date), value: parseFloat(d.value) }));

    if (primaryData.length === 0 || secondaryData.length === 0) return null;

    // Trova range temporale comune
    const allDates = [...primaryData.map(d => d.date), ...secondaryData.map(d => d.date)];
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Campiona i dati per performance (max 300 punti)
    const sampleData = (data, maxPoints = 300) => {
      if (data.length <= maxPoints) return data;
      const step = (data.length - 1) / (maxPoints - 1);
      const sampled = [];
      for (let i = 0; i < maxPoints; i++) {
        const index = Math.round(i * step);
        if (index < data.length) sampled.push(data[index]);
      }
      return sampled;
    };

    const sampledPrimary = sampleData(primaryData);
    const sampledSecondary = sampleData(secondaryData);

    // Normalizza i dati per il confronto visuale (scala 0-100)
    const normalizeData = (data) => {
      const values = data.map(d => d.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      return data.map(d => ({
        ...d,
        normalizedValue: ((d.value - min) / range) * 100
      }));
    };

    const normalizedPrimary = normalizeData(sampledPrimary);
    const normalizedSecondary = normalizeData(sampledSecondary);

    // Calcola margini dinamici
    const leftGutter = 80;
    const innerWidth = WIDTH - leftGutter - RIGHT_MARGIN;
    const innerHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

    // Funzioni di mapping coordinate
    const getX = (date) => {
      const dateTime = date.getTime();
      const minTime = minDate.getTime();
      const maxTime = maxDate.getTime();
      const normalized = (dateTime - minTime) / (maxTime - minTime || 1);
      return leftGutter + normalized * innerWidth;
    };

    const getY = (normalizedValue) => {
      const normalized = normalizedValue / 100;
      return TOP_MARGIN + (1 - normalized) * innerHeight;
    };

    // Crea i path per le linee
    const primaryPath = normalizedPrimary.map((d, i) => {
      const x = getX(d.date);
      const y = getY(d.normalizedValue);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    const secondaryPath = normalizedSecondary.map((d, i) => {
      const x = getX(d.date);
      const y = getY(d.normalizedValue);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    // Gestione eventi mouse
    const handleMouseMove = (e) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      
      if (mouseX >= leftGutter && mouseX <= WIDTH - RIGHT_MARGIN) {
        const dateRatio = (mouseX - leftGutter) / innerWidth;
        const targetTime = minDate.getTime() + dateRatio * (maxDate.getTime() - minDate.getTime());
        
        // Trova i punti più vicini
        const findClosest = (data) => {
          return data.reduce((closest, current) => {
            const currentDiff = Math.abs(current.date.getTime() - targetTime);
            const closestDiff = Math.abs(closest.date.getTime() - targetTime);
            return currentDiff < closestDiff ? current : closest;
          });
        };

        const closestPrimary = findClosest(normalizedPrimary);
        const closestSecondary = findClosest(normalizedSecondary);

        setHoverData({
          date: new Date(targetTime),
          primary: closestPrimary,
          secondary: closestSecondary,
          x: mouseX,
          y: (getY(closestPrimary.normalizedValue) + getY(closestSecondary.normalizedValue)) / 2
        });
      }
    };

    const handleMouseLeave = () => setHoverData(null);

    const primaryConfig = getIndicatorConfig(primary.id);
    const secondaryConfig = getIndicatorConfig(secondary.id);

    return (
      <div 
        ref={chartRef}
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '20px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>
            📊 Confronto Indicatori
          </h3>
          <button
            onClick={closeCompare}
            style={{
              background: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              color: '#ef5350',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ✕ Chiudi
          </button>
        </div>

        <div style={{ width: '100%', display: 'block', position: 'relative' }}>
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`} 
            style={{ 
              width: '100%', 
              height: `${HEIGHT}px`, 
              display: 'block', 
              margin: '0 auto' 
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Griglia */}
            {[0, 25, 50, 75, 100].map((v) => (
              <line 
                key={v} 
                x1={leftGutter} 
                x2={WIDTH - RIGHT_MARGIN} 
                y1={getY(v)} 
                y2={getY(v)} 
                stroke="#2d2d2d" 
                strokeDasharray="3 3" 
              />
            ))}

            {/* Linee del grafico */}
            <path 
              d={primaryPath} 
              fill="none" 
              stroke={primaryConfig.color} 
              strokeWidth="3" 
              strokeLinejoin="round" 
              strokeLinecap="round" 
            />
            
            <path 
              d={secondaryPath} 
              fill="none" 
              stroke={secondaryConfig.color} 
              strokeWidth="3" 
              strokeDasharray="8 4"
              strokeLinejoin="round" 
              strokeLinecap="round" 
            />

            {/* Etichette asse Y */}
            {[0, 25, 50, 75, 100].map((v) => (
              <text 
                key={v} 
                x={leftGutter - 12} 
                y={getY(v) + 5} 
                textAnchor="end" 
                fontSize="12" 
                fill="#999"
              >
                {v}%
              </text>
            ))}

            {/* Etichette asse X */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const date = new Date(minDate.getTime() + ratio * (maxDate.getTime() - minDate.getTime()));
              const x = leftGutter + ratio * innerWidth;
              return (
                <text 
                  key={i} 
                  x={x} 
                  y={HEIGHT - BOTTOM_MARGIN + 22} 
                  textAnchor="middle" 
                  fontSize="12" 
                  fill="#999"
                >
                  {date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })}
                </text>
              );
            })}

            {/* Asse Y */}
            <line 
              x1={leftGutter} 
              x2={leftGutter} 
              y1={TOP_MARGIN - 6} 
              y2={HEIGHT - BOTTOM_MARGIN} 
              stroke="#444" 
            />

            {/* Linea di hover */}
            {hoverData && (
              <line 
                x1={hoverData.x} 
                x2={hoverData.x} 
                y1={TOP_MARGIN} 
                y2={HEIGHT - BOTTOM_MARGIN} 
                stroke="rgba(255,255,255,0.5)" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
            )}
          </svg>

          {/* Tooltip */}
          {hoverData && (
            <div style={{
              position: 'absolute',
              left: `${(hoverData.x / WIDTH) * 100}%`,
              top: '20px',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg,#151515,#1e1e1e)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '12px',
              minWidth: '200px',
              zIndex: 1000,
              pointerEvents: 'none'
            }}>
              <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}>
                {hoverData.date.toLocaleDateString('it-IT')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: primaryConfig.color }}>📈 {primary.name}</span>
                <span style={{ color: '#fff' }}>{hoverData.primary?.value?.toFixed(3)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: secondaryConfig.color }}>📊 {secondary.name}</span>
                <span style={{ color: '#fff' }}>{hoverData.secondary?.value?.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Legenda */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '30px',
          marginTop: '15px',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '20px', 
              height: '3px', 
              background: primaryConfig.color,
              borderRadius: '2px'
            }}></div>
            <span style={{ color: '#fff' }}>{primary.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '20px', 
              height: '3px', 
              background: secondaryConfig.color,
              borderRadius: '2px',
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.3) 4px, rgba(0,0,0,0.3) 8px)'
            }}></div>
            <span style={{ color: '#fff' }}>{secondary.name}</span>
          </div>
        </div>
      </div>
    );
  };

  // Componente grafico con stile PortfolioChart
  const IndicatorChart = ({ data, color, height = 280, title = "Andamento Storico" }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('MAX');
    const [hoverData, setHoverData] = useState(null);
    const chartRef = useRef(null);
    const svgRef = useRef(null);
    const pendingRef = useRef(false);
    const lastMouseRef = useRef(null);
    const { width: chartWidth } = useResizeObserver(chartRef);
    
    if (!data || data.length < 2) return null;

    // Filtra solo valori numerici validi
    const allValidData = data
      .filter(d => d.value !== '.' && !isNaN(parseFloat(d.value)))
      .map(d => ({ ...d, numValue: parseFloat(d.value) }));

    if (allValidData.length < 2) return null;

    // Filtra per periodo selezionato
    const getFilteredData = () => {
      const currentDate = new Date();
      const cutoffDate = new Date();
      
      let filteredData;
      
      switch (selectedPeriod) {
        case '1Y':
          cutoffDate.setFullYear(currentDate.getFullYear() - 1);
          filteredData = allValidData.filter(d => {
            const dataDate = new Date(d.date);
            return dataDate >= cutoffDate;
          });
          break;
        case '5Y':
          cutoffDate.setFullYear(currentDate.getFullYear() - 5);
          filteredData = allValidData.filter(d => {
            const dataDate = new Date(d.date);
            return dataDate >= cutoffDate;
          });
          break;
        default: // MAX - usa tutti i dati storici
          filteredData = allValidData;
          break;
      }
      
      // Campionamento proporzionale per limitare a 300 punti massimo
      const MAX_POINTS = 300;
      if (filteredData.length <= MAX_POINTS) {
        return filteredData;
      }
      
      // Campionamento uniforme su tutta la serie
      const sampledData = [];
      const step = (filteredData.length - 1) / (MAX_POINTS - 1);
      
      for (let i = 0; i < MAX_POINTS; i++) {
        const index = Math.round(i * step);
        if (index < filteredData.length) {
          sampledData.push(filteredData[index]);
        }
      }
      
      // Assicurati che l'ultimo punto sia incluso
      if (sampledData[sampledData.length - 1] !== filteredData[filteredData.length - 1]) {
        sampledData[sampledData.length - 1] = filteredData[filteredData.length - 1];
      }
      
      return sampledData;
    };

    const validData = getFilteredData();
    if (validData.length < 2) return null;

    // Calcola dimensioni responsive come PortfolioChart
    const computedWidth = Math.round(chartWidth || 900);
    const WIDTH = Math.max(400, Math.min(1200, computedWidth));
    const HEIGHT = height;

    // Margini come PortfolioChart
    const RIGHT_MARGIN = 48;
    const TOP_MARGIN = 48;
    const BOTTOM_MARGIN = 70;

    const values = validData.map(d => d.numValue);
    const dates = validData.map(d => new Date(d.date));
    
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
    const range = maxY - minY || 1;

    // Calcola tick per asse Y
    const desiredYTicks = 5;
    const yTicks = [];
    for (let i = 0; i < desiredYTicks; i++) {
      yTicks.push(minY + (i / (desiredYTicks - 1)) * range);
    }

    // Calcola margini dinamici per le etichette
    const yLabelStrings = yTicks.map(v => v.toFixed(v < 10 ? 3 : 2));
    const maxYLabelWidth = Math.max(...yLabelStrings.map(s => s.length * 7));
    const leftGutter = Math.max(56, maxYLabelWidth + 20);

    const innerWidth = WIDTH - leftGutter - RIGHT_MARGIN;
    const innerHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

    // Funzioni di mapping coordinate
    const getX = (index) => leftGutter + index * (innerWidth) / Math.max(1, (values.length - 1));
    const getY = (value) => {
      const normalized = (value - minY) / (range || 1);
      return TOP_MARGIN + (1 - normalized) * innerHeight;
    };

    // Gestione eventi mouse per tooltip
    const processMouseEvent = (e) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const chartLeft = leftGutter;
      const stepWidth = innerWidth / Math.max(1, (values.length - 1));
      let idxFloat = (mouseX - chartLeft) / stepWidth;
      let idx = Math.round(idxFloat);
      idx = Math.max(0, Math.min(values.length - 1, idx));
      
      const payload = { 
        index: idx, 
        date: dates[idx], 
        x: getX(idx), 
        y: getY(values[idx]), 
        value: values[idx],
        rawData: validData[idx]
      };
      
      setHoverData(payload);
    };

    const scheduleProcess = () => {
      if (!pendingRef.current) {
        pendingRef.current = true;
        requestAnimationFrame(() => {
          const e = lastMouseRef.current;
          if (e) processMouseEvent(e);
          pendingRef.current = false;
        });
      }
    };

    const handleMouseMove = (e) => {
      lastMouseRef.current = e;
      scheduleProcess();
    };

    const handleMouseLeave = () => {
      setHoverData(null);
      lastMouseRef.current = null;
      pendingRef.current = false;
    };

    // Crea il path del grafico
    const dataPath = values.map((value, index) => {
      const x = getX(index);
      const y = getY(value);
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    // Area riempita sotto la linea
    const areaPath = `M ${leftGutter},${getY(minY)} L ${dataPath.slice(2)} L ${getX(values.length - 1)},${getY(minY)} Z`;

    // Funzione per misurare dimensioni reali del testo
    const measureText = (text, fontSize = 12) => {
      // Crea un elemento temporaneo per misurare il testo
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = `${fontSize}px monospace`;
      const width = context.measureText(text).width;
      return { width, height: fontSize * 1.2 }; // altezza approssimativa con line-height
    };

    // Rendering del tooltip
    const renderTooltip = () => {
      if (!hoverData || !chartRef.current) return null;
      
      const rect = chartRef.current.getBoundingClientRect();
      const leftPxRaw = (hoverData.x / WIDTH) * rect.width;
      const topPxRaw = (hoverData.y / HEIGHT) * rect.height;
      
      const dateLabel = hoverData.date?.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }) || '';
      const valueLabel = hoverData.value?.toFixed(4) || '';
      
      // Calcola dimensioni precise del contenuto
      const fontSize = 12;
      const padding = 16; // 8px top + 8px bottom
      const dateSize = measureText(dateLabel, fontSize);
      const valueSize = measureText(`Valore: ${valueLabel}`, fontSize);
      
      // Dimensioni effettive del tooltip
      const contentWidth = Math.max(dateSize.width, valueSize.width);
      const BOX_WIDTH = Math.min(Math.max(140, contentWidth + 20), Math.min(280, rect.width * 0.7));
      const BOX_HEIGHT = padding + dateSize.height + valueSize.height + 6; // 6px gap tra righe
      
      const offsetFromPoint = 12; // Distanza minima dal punto
      const pointRadius = 5; // Raggio del punto evidenziato
      
      // Calcola posizione orizzontale (centrata sul punto)
      let left = leftPxRaw - BOX_WIDTH / 2;
      left = Math.max(8, Math.min(rect.width - BOX_WIDTH - 8, left));
      
      // Calcola posizione verticale con misurazioni precise
      let top;
      const pointTop = topPxRaw - pointRadius;
      const pointBottom = topPxRaw + pointRadius;
      
      // Spazio disponibile sopra e sotto il punto
      const spaceAbove = pointTop - (TOP_MARGIN * rect.height / HEIGHT);
      const spaceBelow = rect.height - pointBottom - (BOTTOM_MARGIN * rect.height / HEIGHT);
      
      // Decide dove posizionare il tooltip
      if (spaceAbove >= BOX_HEIGHT + offsetFromPoint) {
        // Posiziona sopra: bottom del tooltip deve essere a offsetFromPoint dal top del punto
        top = pointTop - offsetFromPoint - BOX_HEIGHT;
      }
      else if (spaceBelow >= BOX_HEIGHT + offsetFromPoint) {
        // Posiziona sotto: top del tooltip deve essere a offsetFromPoint dal bottom del punto
        top = pointBottom + offsetFromPoint;
      }
      else {
        // Posiziona dove c'è più spazio, con distanza minima
        if (spaceAbove > spaceBelow) {
          top = Math.max(8, pointTop - BOX_HEIGHT - 8);
        } else {
          top = Math.min(rect.height - BOX_HEIGHT - 8, pointBottom + 8);
        }
      }
      
      // Assicura che rimanga nei bordi
      top = Math.max(8, Math.min(rect.height - BOX_HEIGHT - 8, top));
      
      const tooltipStyle = {
        position: 'absolute',
        left: left,
        top: top,
        width: BOX_WIDTH,
        height: BOX_HEIGHT,
        background: 'linear-gradient(180deg,#151515,#1e1e1e)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        padding: '8px 10px',
        borderRadius: 8,
        color: '#e6e6e6',
        zIndex: 9999,
        pointerEvents: 'none',
        fontSize: 12,
        lineHeight: '18px'
      };
      
      return (
        <div style={tooltipStyle} role="tooltip" aria-hidden>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{dateLabel}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ color: color, fontWeight: 700 }}>Valore</div>
            <div style={{ color: '#ddd', fontWeight: 700 }}>{valueLabel}</div>
          </div>
        </div>
      );
    };

    const trend = validData.length > 1 
      ? validData[validData.length - 1].numValue > validData[0].numValue 
      : null;

    // Calcolo delle statistiche
    const latest = validData[validData.length - 1];
    const change = validData.length > 1 
      ? latest.numValue - validData[validData.length - 2].numValue 
      : 0;

    return (
      <div 
        ref={chartRef}
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
          padding: '14px',
          border: `1px solid ${color}30`,
          marginBottom: '16px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>
                📈 {title}
              </span>
              <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
                ({validData.length} punti)
              </span>
            </div>
            
            {/* Selettori periodo */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['1Y', '5Y', 'MAX'].map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    background: selectedPeriod === period 
                      ? color 
                      : 'rgba(255,255,255,0.05)',
                    color: selectedPeriod === period ? '#000' : '#ccc',
                    cursor: 'pointer',
                    fontWeight: selectedPeriod === period ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>
              {latest.numValue.toFixed(3)}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: change > 0 ? '#66bb6a' : change < 0 ? '#ef5350' : '#999',
              fontWeight: '600'
            }}>
              {change > 0 ? '+' : ''}{change.toFixed(3)} {trend !== null && (trend ? '📈' : '📉')}
            </div>
          </div>
        </div>
        
        <div style={{ width: '100%', display: 'block', position: 'relative' }}>
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`} 
            style={{ 
              width: '100%', 
              height: `${HEIGHT}px`, 
              display: 'block', 
              margin: '0 auto' 
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Griglia orizzontale */}
            {yTicks.map((v, i) => (
              <line 
                key={i} 
                x1={leftGutter} 
                x2={WIDTH - RIGHT_MARGIN} 
                y1={getY(v)} 
                y2={getY(v)} 
                stroke="#2d2d2d" 
                strokeDasharray="3 3" 
              />
            ))}
            
            {/* Area riempita con gradiente */}
            <defs>
              <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor: color, stopOpacity: 0.3}} />
                <stop offset="100%" style={{stopColor: color, stopOpacity: 0.05}} />
              </linearGradient>
            </defs>
            
            <path 
              d={areaPath} 
              fill={`url(#gradient-${color.replace('#', '')})`} 
              opacity="0.7"
            />
            
            {/* Linea principale */}
            <path 
              d={dataPath} 
              fill="none" 
              stroke={color} 
              strokeWidth="3" 
              strokeLinejoin="round" 
              strokeLinecap="round" 
            />
            
            {/* Etichette asse Y */}
            {yTicks.map((labelValue, i) => (
              <text 
                key={i} 
                x={leftGutter - 12} 
                y={getY(labelValue) + 5} 
                textAnchor="end" 
                fontSize="12" 
                fill="#999"
              >
                {labelValue.toFixed(labelValue < 10 ? 3 : 2)}
              </text>
            ))}
            
            {/* Etichette asse X */}
            {Array.from(new Set([
              0, 
              Math.floor((values.length - 1) * 0.25), 
              Math.floor((values.length - 1) * 0.5), 
              Math.floor((values.length - 1) * 0.75), 
              values.length - 1
            ])).map((idx) => (
              <text 
                key={idx} 
                x={getX(idx)} 
                y={HEIGHT - BOTTOM_MARGIN + 22} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#999"
              >
                {dates[idx]?.toLocaleDateString('it-IT', { 
                  month: 'short', 
                  year: '2-digit' 
                })}
              </text>
            ))}
            
            {/* Asse Y */}
            <line 
              x1={leftGutter} 
              x2={leftGutter} 
              y1={TOP_MARGIN - 6} 
              y2={HEIGHT - BOTTOM_MARGIN} 
              stroke="#444" 
            />
            
            {/* Linea di hover e punto attivo */}
            {hoverData && hoverData.index >= 0 && hoverData.index < values.length && (
              <>
                <line 
                  x1={getX(hoverData.index)} 
                  x2={getX(hoverData.index)} 
                  y1={TOP_MARGIN} 
                  y2={HEIGHT - BOTTOM_MARGIN} 
                  stroke={color} 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                  opacity="0.9" 
                />
                <circle 
                  cx={getX(hoverData.index)} 
                  cy={getY(values[hoverData.index])} 
                  r="5" 
                  fill={color} 
                  stroke="#fff" 
                  strokeWidth="1.4" 
                />
              </>
            )}
          </svg>
          
          {renderTooltip()}
        </div>
      </div>
    );
  };

  // Componente per la sezione di confronto interattiva
  const CompareSection = ({ primary }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    if (!primary) return null;

    const primaryConfig = getIndicatorConfig(primary.id);

    // Filtra tutti gli indicatori disponibili per il confronto
    const allIndicators = Object.entries(macroData?.data || {}).flatMap(([categoryKey, categoryData]) =>
      categoryData.indicators
        .filter(indicator => 
          indicator.id !== primary.id && 
          indicator.observations && 
          indicator.observations.length > 0
        )
        .map(indicator => ({
          ...indicator,
          category: categoryKey,
          categoryName: getCategoryConfig(categoryKey).name
        }))
    );

    // Applica filtro di ricerca
    const filteredIndicators = allIndicators.filter(indicator =>
      indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indicator.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indicator.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div style={{
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))',
        border: '2px solid rgba(255, 152, 0, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${primaryConfig.color}, ${primaryConfig.color}dd)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '700',
              color: '#000'
            }}>
              {primary.id.slice(0, 2)}
            </div>
            <div>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '20px' }}>
                ⚖️ Confronto: {primary.name}
              </h2>
              <p style={{ color: '#cfcfcf', margin: '4px 0 0 0', fontSize: '14px' }}>
                {primary.id} • Seleziona un secondo indicatore per confrontare
              </p>
            </div>
          </div>
          <button
            onClick={closeCompare}
            style={{
              background: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              color: '#ef5350',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ✕ Chiudi Confronto
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: compareIndicator ? '1fr' : '1fr 400px', gap: '24px' }}>
          {/* Grafico principale/confronto */}
          <div>
            {compareIndicator ? (
              <CompareChart primary={primary} secondary={compareIndicator} />
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <IndicatorChart 
                  data={primary.observations} 
                  color={primaryConfig.color}
                  height={320}
                  title={`${primary.name} - Grafico Esteso`}
                />
              </div>
            )}
          </div>

          {/* Pannello di selezione (solo se non c'è secondo indicatore) */}
          {!compareIndicator && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: 'fit-content'
            }}>
              <h3 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '16px' }}>
                🔍 Seleziona Secondo Indicatore
              </h3>

              {/* Barra di ricerca */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  placeholder="Cerca indicatore..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Lista indicatori filtrati */}
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {filteredIndicators.slice(0, 10).map(indicator => {
                  const config = getIndicatorConfig(indicator.id);
                  const categoryConfig = getCategoryConfig(indicator.category);
                  
                  return (
                    <div
                      key={indicator.id}
                      onClick={() => selectSecondIndicator(indicator)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = config.color + '40';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.transform = 'translateX(0px)';
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#000',
                        flexShrink: 0
                      }}>
                        {indicator.id.slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          color: '#fff', 
                          fontSize: '13px', 
                          fontWeight: '600',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {indicator.name}
                        </div>
                        <div style={{ 
                          color: '#999', 
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {categoryConfig.icon} {indicator.categoryName}
                        </div>
                      </div>
                      <div style={{
                        color: config.color,
                        fontSize: '16px'
                      }}>
                        +
                      </div>
                    </div>
                  );
                })}

                {filteredIndicators.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#999',
                    fontSize: '14px'
                  }}>
                    Nessun indicatore trovato
                  </div>
                )}

                {filteredIndicators.length > 10 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '8px',
                    color: '#ffa726',
                    fontSize: '12px'
                  }}>
                    +{filteredIndicators.length - 10} altri risultati...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Indicatore selezionato per confronto */}
        {compareIndicator && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(102, 187, 106, 0.1)',
            border: '1px solid rgba(102, 187, 106, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${getIndicatorConfig(compareIndicator.id).color}, ${getIndicatorConfig(compareIndicator.id).color}dd)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700',
                color: '#000'
              }}>
                {compareIndicator.id.slice(0, 2)}
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                  Confrontando con: {compareIndicator.name}
                </div>
                <div style={{ color: '#66bb6a', fontSize: '12px' }}>
                  {compareIndicator.id} • Confronto attivo
                </div>
              </div>
            </div>
            <button
              onClick={() => setCompareIndicator(null)}
              style={{
                background: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                color: '#ff9800',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🔄 Cambia Indicatore
            </button>
          </div>
        )}
      </div>
    );
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
    
    // Auto-mostra il grafico quando si apre un indicatore
    if (!expandedIndicators[key]) {
      setShowCharts(prev => ({
        ...prev,
        [key]: true
      }));
    }
  };

  // Funzioni per il sistema di confronto
  const openCompareModal = (categoryKey, indicatorData) => {
    setPrimaryIndicator({ categoryKey, ...indicatorData });
    setShowCompareModal(true);
  };

  const selectCompareIndicator = (categoryKey, indicatorData) => {
    setCompareIndicator({ categoryKey, ...indicatorData });
    setShowCompareModal(false);
    setShowCompareChart(true);
  };

  const closeCompareChart = () => {
    setShowCompareChart(false);
    setPrimaryIndicator(null);
    setCompareIndicator(null);
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

  // Contatore totale risultati (include indicatori personalizzati filtrati)
  const getTotalFilteredResults = () => {
    let total = Object.values(filteredData).reduce((acc, cat) => acc + cat.length, 0);
    
    // Aggiungi indicatori personalizzati se passano il filtro
    if (searchTerm) {
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

    // LEFT SIDEBAR - Vuoto per dare più spazio al centro
  const leftSidebar = null;

  // CENTER - Layout scorrevole con filtri in alto
  const centerContent = (
    <div>
      {/* Sezione di confronto (apparirà in cima quando attiva) */}
      {showCompareChart && primaryIndicator && (
        <CompareSection 
          primary={primaryIndicator}
          compareIndicator={compareIndicator}
          onIndicatorSelect={(indicator) => {
            setCompareIndicator(indicator);
          }}
          onClose={() => {
            setShowCompareChart(false);
            setPrimaryIndicator(null);
            setCompareIndicator(null);
          }}
          availableIndicators={allAvailableIndicators.filter(ind => ind.key !== primaryIndicator.key)}
        />
      )}
      {/* FILTRI IN ALTO - Layout scorrevole */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-title" style={{ marginBottom: '16px' }}>
          📊 Indicatori Economici FRED
        </div>
        
        {/* Controlli filtri in linea - stile backtest */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 200px auto auto', 
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
            <div style={{ position: 'relative' }}>
              <Input
                type="text"
                placeholder="Cerca indicatori esistenti o nuovi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%',
                  fontSize: '14px',
                  padding: '8px 12px'
                }}
              />
              
              {/* Indicatore di ricerca */}
              {isSearching && (
                <div style={{
                  position: 'absolute',
                  right: '8px',
                  top: '8px',
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid #66bb6a',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}
              
              {/* Risultati ricerca esterna */}
              {(searchResults.length > 0 || searchError) && searchTerm && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(180deg, #1a1a1a, #0f0f0f)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.4)'
                }}>
                  
                  {searchError ? (
                    <div style={{
                      padding: '12px',
                      color: '#ffa726',
                      fontSize: '13px',
                      textAlign: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      ⚠️ {searchError}
                    </div>
                  ) : (
                    <div style={{
                      padding: '8px',
                      color: '#66bb6a',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      🆕 {searchResults.length} nuovi indicatori trovati
                    </div>
                  )}
                  
                  {searchResults.map(series => (
                    <div 
                      key={series.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => addCustomIndicator(series)}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(102, 187, 106, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#000',
                        flexShrink: 0
                      }}>
                        +
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          color: '#fff', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {series.title}
                        </div>
                        <div style={{ 
                          color: '#999', 
                          fontSize: '10px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {series.id} • Clicca per aggiungere
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
          
          {/* Refresh button spostato qui */}
          <div>
            <Button 
              onClick={loadMacroData} 
              style={{ 
                fontSize: '13px', 
                padding: '8px 12px',
                background: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                color: '#66bb6a'
              }}
            >
              🔄 Refresh
            </Button>
          </div>
          
          {/* Quick stats */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#cfcfcf', fontSize: '13px', marginBottom: '2px' }}>
              Risultati
            </div>
            <div style={{ color: '#66bb6a', fontSize: '16px', fontWeight: '700' }}>
              {getTotalFilteredResults()}
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: `1px solid ${config.color}15`,
                  marginBottom: isExpanded ? '12px' : '0'
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
                    const isChartVisible = showCharts[key];
                    const observations = indicator.observations || [];
                    
                    // 20 dati più recenti di default - Intero storico se espanso
                    const defaultData = observations.slice(-20);  // Prende gli ultimi 20 (più recenti)
                    const allHistoricalData = isIndicatorExpanded 
                      ? [...observations].reverse()  // Inverti per mostrare dal più recente al meno recente
                      : [...defaultData].reverse();  // Inverti anche i dati di default per mostrare i più recenti prima
                    const hasMoreData = observations.length > 20;
                    
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
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <Button
                                disabled
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  minWidth: 'auto',
                                  background: 'rgba(171, 71, 188, 0.05)',
                                  border: '1px solid rgba(171, 71, 188, 0.1)',
                                  color: '#ab47bc',
                                  opacity: 0.5,
                                  cursor: 'not-allowed'
                                }}
                              >
                                📊 Grafico
                              </Button>
                              <Button
                                disabled
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  minWidth: 'auto',
                                  background: 'rgba(66, 165, 245, 0.05)',
                                  border: '1px solid rgba(66, 165, 245, 0.1)',
                                  color: '#42a5f5',
                                  opacity: 0.5,
                                  cursor: 'not-allowed'
                                }}
                              >
                                📥 CSV
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Usa l'ordine originale per calcoli di latest/prev value
                    const latestValue = observations[0];  // Il più recente nell'array originale
                    const prevValue = observations[1];   // Il secondo più recente nell'array originale
                    const change = prevValue ? parseFloat(latestValue.value) - parseFloat(prevValue.value) : null;
                    
                    return (
                      <div 
                        key={indicator.id} 
                        className="card series-card"
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

                        {/* Grafico storico ampio - sempre visibile quando l'indicatore è espanso */}
                        <IndicatorChart 
                          data={observations} 
                          color={config.color}
                          height={280}
                        />

                        {/* Dati con scroll - 20 di default, tutti se espanso */}
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ 
                            color: '#cfcfcf', 
                            fontSize: '12px', 
                            marginBottom: '6px',
                            fontWeight: '600'
                          }}>
                            {isIndicatorExpanded 
                              ? `Storico completo (${allHistoricalData.length} dati)`
                              : `Ultimi movimenti (${allHistoricalData.length} dati)`
                            }
                          </div>
                          
                          {/* Finestra con scroll - altezza dinamica */}
                          <div className="historical-data" style={{
                            height: isIndicatorExpanded ? '200px' : '125px', // Più alta se espanso
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            padding: '4px'
                          }}>
                            {allHistoricalData.map((obs, index) => (
                              <div 
                                key={`${obs.date}_${index}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '4px 6px',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  borderRadius: '3px',
                                  fontSize: '12px',
                                  minHeight: '24px' // Altezza minima per consistenza
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
                        </div>

                        {/* Controls con bottone per storico completo e download CSV */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingTop: '6px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                          <span style={{ color: '#cfcfcf', fontSize: '11px' }}>
                            {observations.length} tot • {allHistoricalData.length} mostrati
                          </span>
                          
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {/* Confronta */}
                            <Button
                              onClick={() => startCompare(indicator)}
                              style={{
                                padding: '3px 8px',
                                fontSize: '11px',
                                minWidth: 'auto',
                                background: 'rgba(255, 152, 0, 0.1)',
                                border: '1px solid rgba(255, 152, 0, 0.3)',
                                color: '#ff9800'
                              }}
                              title={`Confronta ${indicator.name} con altro indicatore`}
                            >
                              ⚖️ Confronta
                            </Button>
                            
                            {/* Download CSV */}
                            <Button
                              onClick={() => downloadIndicatorCSV(indicator, config.name)}
                              style={{
                                padding: '3px 8px',
                                fontSize: '11px',
                                minWidth: 'auto',
                                background: 'rgba(66, 165, 245, 0.1)',
                                border: '1px solid rgba(66, 165, 245, 0.3)',
                                color: '#42a5f5'
                              }}
                              title={`Scarica ${indicator.name} in CSV`}
                            >
                              📥 CSV
                            </Button>
                            
                            {/* Storico completo */}
                            {hasMoreData && (
                              <Button
                                onClick={() => toggleIndicator(categoryKey, indicator.id)}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  minWidth: 'auto',
                                  background: isIndicatorExpanded 
                                    ? 'rgba(239, 83, 80, 0.1)' 
                                    : 'rgba(102, 187, 106, 0.1)',
                                  border: `1px solid ${isIndicatorExpanded ? 'rgba(239, 83, 80, 0.3)' : 'rgba(102, 187, 106, 0.3)'}`,
                                  color: isIndicatorExpanded ? '#ef5350' : '#66bb6a'
                                }}
                              >
                                {isIndicatorExpanded ? '📋 Solo recenti' : `📊 Storico (${observations.length})`}
                              </Button>
                            )}
                          </div>
                          
                          {!hasMoreData && allHistoricalData.length > 5 && (
                            <span style={{ color: '#ffa726', fontSize: '11px' }}>
                              📜 Scroll per vedere tutti
                            </span>
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

        {/* SEZIONE INDICATORI PERSONALIZZATI */}
        {Object.keys(customIndicators).length > 0 && (() => {
          // Filtra indicatori personalizzati in base alla ricerca
          const filteredCustomIndicators = searchTerm 
            ? Object.values(customIndicators).filter(indicator => {
                const searchLower = searchTerm.toLowerCase();
                return indicator.name.toLowerCase().includes(searchLower) ||
                       indicator.id.toLowerCase().includes(searchLower);
              })
            : Object.values(customIndicators);
            
          // Mostra la sezione solo se ci sono indicatori che passano il filtro
          if (filteredCustomIndicators.length === 0) return null;
          
          return (
            <div className="panel" style={{ marginTop: '20px' }}>
              <div 
                className="category-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(102, 187, 106, 0.1)',
                  border: '1px solid rgba(102, 187, 106, 0.2)',
                  marginBottom: '12px'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)'
                }}>
                  🆕
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    color: '#66bb6a', 
                    fontSize: '16px', 
                    margin: '0 0 2px 0',
                    fontWeight: '700'
                  }}>
                    Indicatori Personalizzati
                  </h3>
                  <p style={{ 
                    color: '#cfcfcf', 
                    fontSize: '12px', 
                    margin: 0 
                  }}>
                    {filteredCustomIndicators.length} di {Object.keys(customIndicators).length} indicatori
                    {searchTerm && ` • Filtrato per "${searchTerm}"`}
                  </p>
                </div>
                <div style={{ 
                  color: '#66bb6a', 
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Sempre espanso
                </div>
              </div>

              {/* Lista indicatori personalizzati filtrati */}
              <div style={{ 
                display: 'grid', 
                gap: '8px'
              }}>
                {filteredCustomIndicators.map((indicator) => {
                const key = `custom_${indicator.id}`;
                const observations = indicator.observations || [];
                
                if (observations.length === 0) {
                  return (
                    <div key={indicator.id} className="card series-card" style={{ opacity: 0.6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'rgba(102, 187, 106, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#66bb6a'
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
                        <Button
                          onClick={() => removeCustomIndicator(indicator.id)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            minWidth: 'auto',
                            background: 'rgba(239, 83, 80, 0.1)',
                            border: '1px solid rgba(239, 83, 80, 0.3)',
                            color: '#ef5350'
                          }}
                        >
                          🗑️ Rimuovi
                        </Button>
                      </div>
                    </div>
                  );
                }
                
                // Dati per indicatori personalizzati (stesso formato degli indicatori standard)
                const latestValue = observations[0];
                const prevValue = observations[1];
                const change = prevValue ? parseFloat(latestValue.value) - parseFloat(prevValue.value) : null;
                
                return (
                  <div 
                    key={indicator.id} 
                    className="card series-card"
                    style={{ border: '1px solid rgba(102, 187, 106, 0.2)' }}
                  >
                    {/* Indicator header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
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
                          {indicator.name} <span style={{ color: '#66bb6a', fontSize: '10px' }}>• PERSONALIZZATO</span>
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

                    {/* Grafico */}
                    <IndicatorChart 
                      data={observations} 
                      color="#66bb6a"
                      height={280}
                    />

                    {/* Dati storici (primi 20) */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        color: '#cfcfcf', 
                        fontSize: '12px', 
                        marginBottom: '6px',
                        fontWeight: '600'
                      }}>
                        Ultimi movimenti ({Math.min(20, observations.length)} dati)
                      </div>
                      
                      <div className="historical-data" style={{
                        height: '125px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        border: '1px solid rgba(102, 187, 106, 0.1)',
                        borderRadius: '6px',
                        padding: '4px'
                      }}>
                        {observations.slice(0, 20).map((obs, index) => (
                          <div 
                            key={`${obs.date}_${index}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '4px 6px',
                              background: 'rgba(102, 187, 106, 0.05)',
                              borderRadius: '3px',
                              fontSize: '12px',
                              minHeight: '24px'
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
                    </div>

                    {/* Controls */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          onClick={() => startCompare(indicator)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            minWidth: 'auto',
                            background: 'rgba(171, 71, 188, 0.1)',
                            border: '1px solid rgba(171, 71, 188, 0.3)',
                            color: '#ab47bc'
                          }}
                        >
                          ⚖️ Confronta
                        </Button>
                        
                        <Button
                          onClick={() => downloadIndicatorCSV(indicator, 'Personalizzati')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            minWidth: 'auto',
                            background: 'rgba(66, 165, 245, 0.1)',
                            border: '1px solid rgba(66, 165, 245, 0.3)',
                            color: '#42a5f5'
                          }}
                        >
                          📥 CSV
                        </Button>
                      </div>

                      <Button
                        onClick={() => removeCustomIndicator(indicator.id)}
                        style={{
                          padding: '3px 8px',
                          fontSize: '11px',
                          minWidth: 'auto',
                          background: 'rgba(239, 83, 80, 0.1)',
                          border: '1px solid rgba(239, 83, 80, 0.3)',
                          color: '#ef5350'
                        }}
                      >
                        🗑️ Rimuovi
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}

        {/* SEZIONE SISTEMA ANALISI IN FONDO */}
      <div className="panel" style={{ marginTop: '30px' }}>
        <div className="panel-title">📈 Sistema Analisi</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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
      </div>

      {/* Grafico di confronto */}
      {showCompareChart && primaryIndicator && compareIndicator && (
        <div style={{ marginBottom: '20px' }}>
          <CompareChart 
            primary={primaryIndicator} 
            secondary={compareIndicator} 
          />
        </div>
      )}

      {/* Modal di selezione indicatore da confrontare */}
      {showCompareModal && primaryIndicator && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #1a1a1a, #0f0f0f)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#fff', margin: 0 }}>
                ⚖️ Confronta "{primaryIndicator.name}"
              </h3>
              <button
                onClick={() => setShowCompareModal(false)}
                style={{
                  background: 'rgba(239, 83, 80, 0.1)',
                  border: '1px solid rgba(239, 83, 80, 0.3)',
                  color: '#ef5350',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#cfcfcf', marginBottom: '20px' }}>
              Seleziona un altro indicatore da confrontare con <strong>{primaryIndicator.name}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(macroData?.data || {}).map(([categoryKey, categoryData]) => (
                <div key={categoryKey}>
                  <h4 style={{ 
                    color: getCategoryConfig(categoryKey).color, 
                    fontSize: '14px', 
                    margin: '16px 0 8px 0' 
                  }}>
                    {getCategoryConfig(categoryKey).icon} {getCategoryConfig(categoryKey).name}
                  </h4>
                  {categoryData.indicators
                    .filter(indicator => 
                      indicator.id !== primaryIndicator.id && 
                      indicator.observations && 
                      indicator.observations.length > 0
                    )
                    .map(indicator => {
                      const config = getIndicatorConfig(indicator.id);
                      return (
                        <div
                          key={indicator.id}
                          onClick={() => selectSecondIndicator(indicator)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.target.style.borderColor = config.color + '40';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.02)';
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
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
                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                              {indicator.name}
                            </div>
                            <div style={{ color: '#999', fontSize: '12px' }}>
                              {indicator.id} • {indicator.observations?.length || 0} dati
                            </div>
                          </div>
                          <div style={{
                            color: config.color,
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Confronta →
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <MainLayout
      center={centerContent}
    />
  );
}
