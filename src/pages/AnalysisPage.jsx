import React, { useState, useEffect, useMemo } from 'react';
import macroService from '../services/macroService.js';

// Layout e UI components
import MainLayout from '../components/layout/MainLayout.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Button from '../components/ui/Button.jsx';

// Components Analysis
import AnalysisSearch from '../components/analysis/AnalysisSearch.jsx';
import CompareSection from '../components/analysis/CompareSection.jsx';
import CategorySection from '../components/analysis/CategorySection.jsx';
import CustomIndicators from '../components/analysis/CustomIndicators.jsx';

// Stili
import '../styles/index.css';
import '../styles/components.css';

/**
 * 📊 AnalysisPage v6.0 - REFACTORED & MODULAR
 * 
 * MIGLIORAMENTI v6.0:
 * - Codice scomposto in componenti riutilizzabili
 * - Utility functions separate per logica condivisa
 * - Configurazioni esternalizzate
 * - Manutenibilità e leggibilità migliorate
 * - Struttura scalabile per future estensioni
 **/

export default function AnalysisPage() {
  // Stati principali
  const [macroData, setMacroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState([]);
  
  // Stati UI
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedIndicators, setExpandedIndicators] = useState({});
  
  // Stati filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Stati ricerca estesa
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [customIndicators, setCustomIndicators] = useState({});
  
  // Stati confronto
  const [primaryIndicator, setPrimaryIndicator] = useState(null);
  const [compareIndicator, setCompareIndicator] = useState(null);
  const [showCompareChart, setShowCompareChart] = useState(false);

  // Raccogli tutti gli indicatori disponibili
  const allAvailableIndicators = useMemo(() => {
    if (!macroData?.indicators) return [];
    
    const indicators = Object.entries(macroData.indicators).flatMap(([categoryKey, categoryIndicators]) =>
      (categoryIndicators || []).map(indicator => ({
        ...indicator,
        category: categoryKey
      }))
    );
    
    return indicators;
  }, [macroData]);

  // Funzione per cercare indicatori esterni tramite FRED API
  const searchExternalIndicators = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Usa macroService per la ricerca FRED
      const { results, error } = await macroService.searchFredSeries(searchText);
      
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
    }, 800);

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

  // Carica dati iniziali
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

  // Gestione espansione categorie
  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Gestione espansione indicatori
  const toggleIndicator = (categoryKey, indicatorId) => {
    const key = `${categoryKey}_${indicatorId}`;
    setExpandedIndicators(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Gestione confronto indicatori
  const startCompare = (indicator) => {
    setPrimaryIndicator(indicator);
    setShowCompareChart(true);
    setCompareIndicator(null);
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

  // Filtra dati in base ai filtri
  const filteredData = useMemo(() => {
    if (!macroData?.indicators) return {};
    
    let filtered = { ...macroData.indicators };
    
    if (selectedCategory !== 'all') {
      filtered = { [selectedCategory]: filtered[selectedCategory] };
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      Object.keys(filtered).forEach(categoryKey => {
        const categoryIndicators = filtered[categoryKey];
        filtered[categoryKey] = (categoryIndicators || []).filter(indicator =>
          indicator.name.toLowerCase().includes(searchLower) ||
          indicator.id.toLowerCase().includes(searchLower) ||
          indicator.description?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return filtered;
  }, [macroData, selectedCategory, searchTerm]);

  // Contatore totale risultati
  const getTotalFilteredResults = () => {
    let total = Object.values(filteredData).reduce(
      (acc, categoryIndicators) => acc + (Array.isArray(categoryIndicators) ? categoryIndicators.length : 0), 
      0
    );
    
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

  // Loading state
  if (loading) {
    return (
      <MainLayout
        center={
          <div className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spinner />
            <h2 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px', fontSize: '24px' }}>
              📊 Caricamento Analisi Economica
            </h2>
            <p style={{ color: '#999', fontSize: '16px', marginBottom: '30px' }}>
              Connessione a Google Cloud Run FRED API...
            </p>
            
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
          </div>
        }
      />
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout
        center={
          <div className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ color: '#ef5350', marginBottom: '20px' }}>Errore del Sistema</h2>
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

  // Main content
  const centerContent = (
    <div>
      {/* Sezione di confronto */}
      {showCompareChart && primaryIndicator && (
        <CompareSection
          primary={primaryIndicator}
          compareIndicator={compareIndicator}
          onSelectCompareIndicator={selectSecondIndicator}
          onClose={closeCompare}
          allIndicators={allAvailableIndicators.filter(ind => ind.id !== primaryIndicator.id)}
          macroData={macroData}
          macroService={macroService}
        />
      )}

      {/* Barra di ricerca e filtri */}
      <AnalysisSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={Object.keys(macroData?.indicators || {})}
        totalResults={getTotalFilteredResults()}
        onRefresh={loadMacroData}
        isSearching={isSearching}
        searchResults={searchResults}
        searchError={searchError}
        onAddCustomIndicator={addCustomIndicator}
        customIndicators={customIndicators}
      />

      {/* Categorie con indicatori */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries(filteredData).map(([categoryKey, categoryIndicators]) => (
          <CategorySection
            key={categoryKey}
            categoryKey={categoryKey}
            indicators={Array.isArray(categoryIndicators) ? categoryIndicators : []}
            isExpanded={expandedCategories[categoryKey]}
            onToggleCategory={toggleCategory}
            expandedIndicators={expandedIndicators}
            onToggleIndicator={toggleIndicator}
            onStartCompare={startCompare}
            macroData={macroData}
            macroService={macroService}
          />
        ))}
      </div>

      {/* Indicatori personalizzati */}
      {Object.keys(customIndicators).length > 0 && (
        <CustomIndicators
          customIndicators={customIndicators}
          searchTerm={searchTerm}
          onRemoveIndicator={removeCustomIndicator}
          onStartCompare={startCompare}
          expandedIndicators={expandedIndicators}
          onToggleIndicator={toggleIndicator}
          macroData={macroData}
          macroService={macroService}
        />
      )}

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
    </div>
  );

  return <MainLayout center={centerContent} />;
}
