import React, { useState, useEffect, useMemo } from 'react';
import macroService from '../services/macroService.js';
import Spinner from '../components/ui/Spinner.jsx';

/**
 * 📊 AnalysisPage v3.0 - UX Ottimizzata
 * 
 * MIGLIORAMENTI UX:
 * - Design moderno con gradients e shadows
 * - Filtri e ricerca real-time
 * - Sparkline charts per trend visivi
 * - Layout responsive e grid system
 * - Colori e icone per categorie
 * - Animazioni e transizioni smooth
 * - States management ottimizzato
 */
export default function AnalysisPage() {
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [loadingLogs, setLoadingLogs] = useState([]);
  
  // Filtri UX
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // cards | compact | detailed

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
      addLog('🚀 Inizializzazione sistema di analisi...');
      addLog('🌐 Connessione Google Cloud Run FRED API...');
      
      const data = await macroService.fetchMacroDataComplete(70);
      
      addLog(`✅ Sistema pronto: ${data.metadata?.totalIndicators || 0} indicatori attivi`);
      addLog(`📊 Database: ${data.metadata?.totalDataPoints?.toLocaleString() || 0} punti dati caricati`);
      
      setMacroData(data);
      setLoading(false);
      
    } catch (err) {
      console.error('❌ ERRORE FATALE:', err);
      addLog(`❌ ERRORE: ${err.message}`);
      setError(err.message);
      setLoading(false);
    }
  };

  // Configurazione categorie con colori e design
  const getCategoryConfig = (categoryKey) => {
    const configs = {
      'gdp_growth': {
        name: 'PIL e Crescita',
        icon: '🏛️',
        gradient: 'from-blue-500 to-blue-700',
        color: 'blue',
        description: 'Indicatori di crescita economica e prodotto interno lordo'
      },
      'employment': {
        name: 'Occupazione',
        icon: '👥',
        gradient: 'from-green-500 to-green-700',
        color: 'green',
        description: 'Mercato del lavoro, disoccupazione e forza lavoro'
      },
      'inflation': {
        name: 'Inflazione',
        icon: '📈',
        gradient: 'from-red-500 to-red-700',
        color: 'red',
        description: 'Prezzi al consumo, inflazione core e aspettative'
      },
      'monetary_policy': {
        name: 'Politica Monetaria',
        icon: '💰',
        gradient: 'from-yellow-500 to-yellow-700',
        color: 'yellow',
        description: 'Tassi di interesse e politiche della Federal Reserve'
      },
      'consumer': {
        name: 'Consumi',
        icon: '🛒',
        gradient: 'from-purple-500 to-purple-700',
        color: 'purple',
        description: 'Spese dei consumatori, vendite retail e fiducia'
      },
      'housing': {
        name: 'Immobiliare',
        icon: '🏠',
        gradient: 'from-indigo-500 to-indigo-700',
        color: 'indigo',
        description: 'Mercato immobiliare, costruzioni e mutui'
      },
      'manufacturing': {
        name: 'Manifatturiero',
        icon: '🏭',
        gradient: 'from-gray-500 to-gray-700',
        color: 'gray',
        description: 'Produzione industriale e settore manifatturiero'
      },
      'trade': {
        name: 'Commercio',
        icon: '⚖️',
        gradient: 'from-teal-500 to-teal-700',
        color: 'teal',
        description: 'Commercio internazionale e tassi di cambio'
      },
      'financial': {
        name: 'Mercati',
        icon: '💹',
        gradient: 'from-pink-500 to-pink-700',
        color: 'pink',
        description: 'Mercati finanziari, indici azionari e volatilità'
      },
      'fiscal': {
        name: 'Politica Fiscale',
        icon: '🏛️',
        gradient: 'from-orange-500 to-orange-700',
        color: 'orange',
        description: 'Debito pubblico, deficit e politiche fiscali'
      }
    };
    
    return configs[categoryKey] || {
      name: categoryKey,
      icon: '📊',
      gradient: 'from-gray-400 to-gray-600',
      color: 'gray',
      description: 'Categoria economica'
    };
  };

  const toggleIndicatorExpansion = (categoryKey, indicatorId) => {
    const key = `${categoryKey}_${indicatorId}`;
    setExpandedIndicators(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Formattazione valori intelligente
  const formatValue = (value, indicator) => {
    if (value === null || value === undefined || value === '.') return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    
    // Formattazione basata sul tipo di indicatore
    if (indicator?.id?.includes('RATE') || indicator?.id?.includes('DGS')) {
      return `${num.toFixed(2)}%`;
    }
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1 && num > 0) return num.toFixed(3);
    return num.toFixed(2);
  };

  // Mini sparkline component
  const Sparkline = ({ data, color = 'blue' }) => {
    if (!data || data.length < 2) return null;
    
    const values = data.map(d => parseFloat(d.value)).filter(v => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    if (range === 0) return <div className="h-8 flex items-center text-gray-400 text-xs">Costante</div>;
    
    const points = values.slice(0, 10).map((value, index) => {
      const x = (index / (Math.min(values.length - 1, 9))) * 60;
      const y = 24 - ((value - min) / range) * 20;
      return `${x},${y}`;
    }).join(' ');

    const trend = values[0] > values[values.length - 1] ? 'down' : 'up';
    const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500';
    
    return (
      <div className="flex items-center gap-2">
        <svg width="64" height="28" className="flex-shrink-0">
          <polyline
            points={points}
            fill="none"
            stroke={trend === 'up' ? '#10b981' : '#ef4444'}
            strokeWidth="1.5"
            className="opacity-70"
          />
        </svg>
        <span className={`text-xs ${trendColor} font-medium`}>
          {trend === 'up' ? '↗️' : '↘️'}
        </span>
      </div>
    );
  };

  // Filtri e ricerca
  const filteredData = useMemo(() => {
    if (!macroData?.indicators) return {};
    
    let filtered = { ...macroData.indicators };
    
    // Filtro per categoria
    if (selectedCategory !== 'all') {
      filtered = { [selectedCategory]: filtered[selectedCategory] };
    }
    
    // Filtro per ricerca
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

  const renderIndicatorCard = (indicator, categoryKey) => {
    const key = `${categoryKey}_${indicator.id}`;
    const isExpanded = expandedIndicators[key];
    const observations = indicator.observations || [];
    const config = getCategoryConfig(categoryKey);
    
    const recentData = observations.slice(0, 5);
    const displayData = isExpanded ? observations.slice(0, 50) : recentData;
    
    if (observations.length === 0) {
      return (
        <div key={indicator.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${config.gradient} flex items-center justify-center text-white font-bold`}>
              {indicator.id.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{indicator.name}</h3>
              <p className="text-sm text-gray-500">{indicator.id}</p>
            </div>
          </div>
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">📊</div>
            <p>Nessun dato disponibile</p>
          </div>
        </div>
      );
    }
    
    const latestValue = recentData[0];
    const prevValue = recentData[1];
    const change = prevValue ? parseFloat(latestValue.value) - parseFloat(prevValue.value) : null;
    const changePercent = prevValue && parseFloat(prevValue.value) !== 0 ? 
      ((parseFloat(latestValue.value) - parseFloat(prevValue.value)) / parseFloat(prevValue.value) * 100) : null;
    
    return (
      <div key={indicator.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 overflow-hidden">
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${config.gradient} p-4 text-white`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{indicator.name}</h3>
              <p className="text-xs opacity-90">{indicator.id}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatValue(latestValue?.value, indicator)}
              </div>
              <div className="text-xs opacity-75">
                {latestValue?.date}
              </div>
            </div>
          </div>
        </div>
        
        {/* Contenuto principale */}
        <div className="p-4">
          {/* Trend e sparkline */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              {change !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  change > 0 ? 'bg-green-100 text-green-800' : change < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  <span>{change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️'}</span>
                  <span>
                    {change > 0 ? '+' : ''}{formatValue(change, indicator)}
                    {changePercent !== null && ` (${changePercent.toFixed(1)}%)`}
                  </span>
                </div>
              )}
            </div>
            <Sparkline data={recentData} color={config.color} />
          </div>
          
          {/* Descrizione */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {indicator.description}
          </p>
          
          {/* Dati recenti */}
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-gray-700 text-sm mb-2">
              {isExpanded ? `Ultimi ${Math.min(50, observations.length)} dati` : 'Ultimi 5 movimenti'}
            </h4>
            
            <div className={`space-y-1 ${isExpanded ? 'max-h-60 overflow-y-auto' : ''}`}>
              {displayData.map((obs, index) => (
                <div 
                  key={`${obs.date}_${index}`} 
                  className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                >
                  <span className="font-mono text-gray-600">{obs.date}</span>
                  <span className="font-semibold">{formatValue(obs.value, indicator)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Controlli */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              {observations.length} osservazioni totali
            </div>
            
            {observations.length > 5 && (
              <button
                onClick={() => toggleIndicatorExpansion(categoryKey, indicator.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  isExpanded 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : `bg-${config.color}-100 text-${config.color}-700 hover:bg-${config.color}-200`
                }`}
              >
                {isExpanded ? '🔼 Comprimi' : '🔽 Espandi tutto'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
              <Spinner size="large" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Sistema di Analisi Economica
            </h1>
            <p className="text-gray-600">
              Caricamento indicatori FRED da Google Cloud Run...
            </p>
          </div>
          
          {/* Log di caricamento con design migliorato */}
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-gray-800">Stato del sistema</h3>
            </div>
            <div className="space-y-2">
              {loadingLogs.map((log, index) => (
                <div key={index} className="flex items-center gap-3 py-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-mono text-sm text-gray-700">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-red-800 mb-4">
              Errore del Sistema
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 font-mono text-sm">{error}</p>
            </div>
            <button
              onClick={loadMacroData}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              🔄 Riprova Connessione
            </button>
          </div>
        </div>
      </div>
    );
  }

  const indicators = macroData?.indicators || {};
  const metadata = macroData?.metadata || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header fisso */}
      <div className="sticky top-0 bg-white shadow-lg border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 Analisi Economica FRED
              </h1>
              <p className="text-gray-600">
                Sistema di monitoraggio indicatori Federal Reserve
              </p>
            </div>
            
            {/* Controlli */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Ricerca */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Cerca indicatori..."
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filtro categoria */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">🌐 Tutte le Categorie</option>
                {Object.keys(indicators).map(categoryKey => (
                  <option key={categoryKey} value={categoryKey}>
                    {getCategoryConfig(categoryKey).icon} {getCategoryConfig(categoryKey).name}
                  </option>
                ))}
              </select>
              
              {/* Refresh */}
              <button
                onClick={loadMacroData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap"
              >
                🔄 Aggiorna
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Dashboard stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {metadata.totalIndicators || 0}
            </div>
            <div className="text-sm text-gray-600">Indicatori Attivi</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {metadata.totalDataPoints?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Punti Dati</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {metadata.yearsRequested || 0}
            </div>
            <div className="text-sm text-gray-600">Anni Storia</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              ✅
            </div>
            <div className="text-sm text-gray-600">Google Cloud Run</div>
          </div>
        </div>

        {/* Categorie di indicatori */}
        <div className="space-y-8">
          {Object.keys(filteredData).map((categoryKey) => {
            const categoryIndicators = filteredData[categoryKey];
            const config = getCategoryConfig(categoryKey);
            
            if (categoryIndicators.length === 0) return null;
            
            return (
              <div key={categoryKey} className="mb-8">
                {/* Header categoria */}
                <div className={`bg-gradient-to-r ${config.gradient} rounded-xl p-6 mb-6 text-white`}>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{config.icon}</div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-1">
                        {config.name}
                      </h2>
                      <p className="opacity-90 text-sm">
                        {config.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                        <span>📊 {categoryIndicators.length} indicatori</span>
                        <span>🔄 Aggiornato in tempo reale</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Grid di indicatori */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {categoryIndicators.map((indicator) => 
                    renderIndicatorCard(indicator, categoryKey)
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Dati forniti da Federal Reserve Economic Data (FRED) via Google Cloud Run</p>
          <p className="mt-1">Ultimo aggiornamento: {new Date(metadata.lastUpdate).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}