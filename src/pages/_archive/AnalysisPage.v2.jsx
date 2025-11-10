import React, { useState, useEffect } from 'react';
import macroService from '../services/macroService.js';
import Spinner from '../components/ui/Spinner.jsx';

/**
 * 📊 AnalysisPage v2.0 - 32 Indicatori FRED in 10 Categorie
 * 
 * FUNZIONALITÀ:
 * - 32 indicatori economici organizzati in 10 categorie
 * - 70 anni di dati storici per ogni indicatore
 * - SOLO dati reali da Google Cloud Run FRED API
 * - Ultimi 5 movimenti + scorrimento fino a 20 dati
 * - Bottone per espandere serie storica completa (70 anni)
 */
export default function AnalysisPage() {
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [loadingLogs, setLoadingLogs] = useState([]);

  // Carica i dati all'avvio
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
      addLog('Iniziando caricamento 32 indicatori FRED...');
      addLog('Connessione a Google Cloud Run backend...');
      
      // Carica tutti i 32 indicatori con 70 anni di storia
      const data = await macroService.fetchMacroDataComplete(70);
      
      addLog(`✅ Caricati ${data.metadata?.totalIndicators || 0} indicatori`);
      addLog(`📈 Totale: ${data.metadata?.totalDataPoints || 0} punti dati`);
      addLog(`📅 Periodo: ${data.metadata?.yearsRequested || 70} anni di storia`);
      
      setMacroData(data);
      setLoading(false);
      
    } catch (err) {
      console.error('❌ ERRORE FATALE:', err);
      addLog(`❌ ERRORE: ${err.message}`);
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleIndicatorExpansion = (categoryKey, indicatorId) => {
    const key = `${categoryKey}_${indicatorId}`;
    setExpandedIndicators(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '.') return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    
    // Formattazione intelligente basata sul valore
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1 && num > 0) return num.toFixed(3);
    return num.toFixed(2);
  };

  const getCategoryIcon = (categoryKey) => {
    const icons = {
      'gdp_growth': '🏛️',
      'employment': '👥',
      'inflation': '📈',
      'monetary_policy': '💰',
      'consumer': '🛒',
      'housing': '🏠',
      'manufacturing': '🏭',
      'trade': '⚖️',
      'financial': '💹',
      'fiscal': '🏛️'
    };
    return icons[categoryKey] || '📊';
  };

  const getCategoryName = (categoryKey) => {
    const names = {
      'gdp_growth': 'PIL e Crescita',
      'employment': 'Occupazione e Lavoro',
      'inflation': 'Inflazione e Prezzi',
      'monetary_policy': 'Politica Monetaria',
      'consumer': 'Consumatori e Retail',
      'housing': 'Mercato Immobiliare',
      'manufacturing': 'Manifatturiero',
      'trade': 'Commercio Internazionale',
      'financial': 'Mercati Finanziari',
      'fiscal': 'Politica Fiscale'
    };
    return names[categoryKey] || categoryKey;
  };

  const renderIndicatorCard = (indicator, categoryKey) => {
    const key = `${categoryKey}_${indicator.id}`;
    const isExpanded = expandedIndicators[key];
    const observations = indicator.observations || [];
    
    // Ultimi 5 movimenti per default
    const recentData = observations.slice(0, 5);
    // Fino a 20 dati per la vista scorrevole
    const scrollableData = observations.slice(0, 20);
    // Vista da mostrare
    const displayData = isExpanded ? observations : recentData;
    
    return (
      <div key={indicator.id} className="bg-white rounded-lg shadow-lg p-6 mb-4">
        {/* Header dell'indicatore */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {indicator.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {indicator.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Serie ID: {indicator.id}</span>
                <span>Dati: {observations.length} osservazioni</span>
                <span>Ultimo: {observations[0]?.date}</span>
              </div>
            </div>
            
            {/* Valore più recente */}
            {recentData[0] && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatValue(recentData[0].value)}
                </div>
                <div className="text-sm text-gray-500">
                  {recentData[0].date}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ultimi movimenti */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">
            {isExpanded ? `Tutti i ${observations.length} dati` : 'Ultimi 5 movimenti'}
          </h4>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {displayData.map((obs, index) => {
              const prevValue = displayData[index + 1]?.value;
              const change = prevValue ? parseFloat(obs.value) - parseFloat(prevValue) : null;
              const changePercent = prevValue && prevValue !== '0' ? 
                ((parseFloat(obs.value) - parseFloat(prevValue)) / parseFloat(prevValue) * 100) : null;
              
              return (
                <div 
                  key={`${obs.date}_${index}`} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded border"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-600">
                      {obs.date}
                    </span>
                    <span className="font-semibold">
                      {formatValue(obs.value)}
                    </span>
                  </div>
                  
                  {change !== null && (
                    <div className={`text-sm font-medium ${
                      change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {change > 0 ? '+' : ''}{formatValue(change)}
                      {changePercent !== null && (
                        <span className="ml-1">
                          ({change > 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controlli */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            {!isExpanded && observations.length > 5 && (
              <button
                onClick={() => toggleIndicatorExpansion(categoryKey, indicator.id)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Vedi tutti i {observations.length} dati
              </button>
            )}
            
            {isExpanded && (
              <button
                onClick={() => toggleIndicatorExpansion(categoryKey, indicator.id)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Comprimi
              </button>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {isExpanded ? '70 anni di storia completa' : `Mostrando ${Math.min(5, observations.length)}/${observations.length}`}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Spinner size="large" />
            <h1 className="text-2xl font-bold text-gray-800 mt-4">
              Caricamento Analisi Economica
            </h1>
            <p className="text-gray-600 mt-2">
              Connessione a Google Cloud Run FRED API...
            </p>
          </div>
          
          {/* Log di caricamento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Log di caricamento:</h3>
            <div className="space-y-1 font-mono text-sm">
              {loadingLogs.map((log, index) => (
                <div key={index} className="text-gray-700">
                  {log}
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              ❌ Errore Caricamento
            </h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadMacroData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  const indicators = macroData?.indicators || {};
  const metadata = macroData?.metadata || {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            📊 Analisi Economica - Dati FRED
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">
                {metadata.totalIndicators || 0}
              </div>
              <div className="text-sm text-gray-600">Indicatori Caricati</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">
                {metadata.totalDataPoints?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-600">Punti Dati Totali</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">
                {metadata.yearsRequested || 0}
              </div>
              <div className="text-sm text-gray-600">Anni di Storia</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">
                ✅
              </div>
              <div className="text-sm text-gray-600">Google Cloud Run</div>
            </div>
          </div>

          <button
            onClick={loadMacroData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Aggiorna Dati
          </button>
        </div>

        {/* Categorie di indicatori */}
        <div className="space-y-8">
          {Object.keys(indicators).map((categoryKey) => {
            const categoryIndicators = indicators[categoryKey];
            
            return (
              <div key={categoryKey} className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{getCategoryIcon(categoryKey)}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {getCategoryName(categoryKey)}
                    </h2>
                    <p className="text-gray-600">
                      {categoryIndicators.length} indicatori
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {categoryIndicators.map((indicator) => 
                    renderIndicatorCard(indicator, categoryKey)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}