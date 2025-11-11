import React, { useState, useEffect } from 'react';
import CompareChart from './CompareChart.jsx';
import IndicatorChart from './IndicatorChart.jsx';
import Input from '../ui/Input.jsx';
import { getIndicatorConfig, getCategoryConfig } from '../../utils/analysis/indicatorConfig.js';
import { searchTickers, getAssetHistory } from '../../api/api.js';

/**
 * Componente per la sezione di confronto interattiva tra indicatori + asset Yahoo Finance
 */
const CompareSection = ({ 
  primary, 
  compareIndicator,
  onSelectCompareIndicator,
  onClose,
  allIndicators,
  macroData,
  macroService
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [assetSearchResults, setAssetSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingIndicator, setLoadingIndicator] = useState(null);
  const [searchMode, setSearchMode] = useState('indicators'); // 'indicators' o 'assets'
  
  if (!primary) return null;

  const primaryConfig = getIndicatorConfig(primary.id, macroData, macroService);

  // Effettua la ricerca FRED o Yahoo Finance quando cambia il termine di ricerca
  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setAssetSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        if (searchMode === 'indicators') {
          // Ricerca FRED
          const response = await macroService.searchFredSeries(searchTerm);
          setSearchResults(response.results || []);
          setAssetSearchResults([]);
        } else {
          // Ricerca Yahoo Finance
          const assets = await searchTickers(searchTerm);
          setAssetSearchResults(Array.isArray(assets) ? assets : []);
          setSearchResults([]);
        }
      } catch (error) {
        console.error(`Errore nella ricerca ${searchMode}:`, error);
        setSearchResults([]);
        setAssetSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300); // Debounce di 300ms
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchMode, macroService]);

  // Filtra gli indicatori già caricati (solo se in modalità indicatori)
  const filteredLocalIndicators = searchMode === 'indicators' 
    ? allIndicators.filter(indicator =>
        indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Combina risultati locali, FRED e Yahoo Finance
  const localIds = new Set(filteredLocalIndicators.map(ind => ind.id));
  const fredResultsFiltered = Array.isArray(searchResults) 
    ? searchResults.filter(result => !localIds.has(result.id))
    : [];
  
  const allResults = searchMode === 'indicators' 
    ? [
        ...filteredLocalIndicators.map(ind => ({ ...ind, source: 'local' })),
        ...fredResultsFiltered.map(result => ({
          id: result.id,
          name: result.title,
          categoryName: 'FRED Search',
          category: 'fred_search',
          observations: [],
          source: 'fred'
        }))
      ]
    : assetSearchResults.map(asset => ({
        id: asset.ticker,
        name: asset.name,
        ticker: asset.ticker,
        categoryName: 'Yahoo Finance',
        category: 'asset',
        source: 'yahoo',
        isin: asset.isin
      }));

  // Gestisce la selezione di un indicatore o asset (carica i dati se necessario)
  const handleSelectIndicator = async (indicator) => {
    if (indicator.source === 'fred') {
      // Carica i dati dall'API FRED
      setLoadingIndicator(indicator.id);
      try {
        const data = await macroService.getSingleSeries(indicator.id);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const fullIndicator = {
          ...indicator,
          name: data.name || indicator.name,
          observations: data.observations || [],
          units: data.units || '',
          frequency: data.frequency || '',
          seasonal_adjustment: data.seasonal_adjustment || '',
          isAsset: false
        };
        onSelectCompareIndicator(fullIndicator);
      } catch (error) {
        console.error('Errore nel caricamento indicatore:', error);
        alert(`Errore nel caricamento di ${indicator.name}: ${error.message}`);
      } finally {
        setLoadingIndicator(null);
      }
    } else if (indicator.source === 'yahoo') {
      // Carica i dati storici dall'API Yahoo Finance tramite backend
      setLoadingIndicator(indicator.id);
      try {
        // Calcola range temporale basato sui dati del primary indicator
        const primaryDates = primary.observations
          .filter(obs => obs.value !== '.' && !isNaN(parseFloat(obs.value)))
          .map(obs => new Date(obs.date));
        
        const startDate = primaryDates.length > 0 
          ? new Date(Math.min(...primaryDates)).toISOString().split('T')[0]
          : new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 10 anni fa
        
        const endDate = primaryDates.length > 0
          ? new Date(Math.max(...primaryDates)).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        const backtestData = await getAssetHistory(indicator.ticker, startDate, endDate);
        
        if (!backtestData || !backtestData.chart_data || backtestData.chart_data.length === 0) {
          throw new Error('Nessun dato disponibile per questo asset');
        }

        // Estrai i dati dall'array chart_data del backtest
        // chart_data contiene: { Date, TotalInvested, Value }
        const chartData = backtestData.chart_data.filter(day => day.Value > 0);
        
        if (chartData.length === 0) {
          throw new Error('Dati storici non disponibili');
        }

        // Calcola il prezzo per azione basandosi sul valore del portafoglio
        // Poiché abbiamo investito $10000 con peso 1.0, Value rappresenta il valore totale
        // Dobbiamo calcolare il prezzo relativo normalizzando al primo valore
        const firstValue = chartData[0].Value;
        
        // Trasforma i dati in formato compatibile con CompareChart
        const observations = chartData.map(day => ({
          date: day.Date,
          value: ((day.Value / firstValue) * 100).toFixed(2) // Normalizzato a 100 al giorno di inizio
        }));

        const fullAsset = {
          ...indicator,
          name: `${indicator.ticker} - ${indicator.name}`,
          observations: observations,
          units: 'Index (Base 100)',
          frequency: 'Daily',
          isAsset: true,
          ticker: indicator.ticker,
          summary: backtestData.summary
        };
        
        onSelectCompareIndicator(fullAsset);
      } catch (error) {
        console.error('Errore nel caricamento asset:', error);
        alert(`Errore nel caricamento di ${indicator.ticker}: ${error.message}`);
      } finally {
        setLoadingIndicator(null);
      }
    } else {
      // Indicatore già caricato
      onSelectCompareIndicator({ ...indicator, isAsset: false });
    }
  };

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
          onClick={onClose}
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
            <CompareChart 
              primary={primary} 
              secondary={compareIndicator}
              onClose={() => onSelectCompareIndicator(null)}
              macroData={macroData}
              macroService={macroService}
            />
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
                indicator={primary}
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
              🔍 Seleziona Secondo Indicatore o Asset
            </h3>

            {/* Toggle modalità ricerca */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '8px'
            }}>
              <button
                onClick={() => {
                  setSearchMode('indicators');
                  setSearchTerm('');
                  setSearchResults([]);
                  setAssetSearchResults([]);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: searchMode === 'indicators' 
                    ? 'linear-gradient(135deg, #1e88e5, #1565c0)' 
                    : 'transparent',
                  border: searchMode === 'indicators'
                    ? '1px solid rgba(30, 136, 229, 0.5)'
                    : '1px solid transparent',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                📊 Indicatori Economici
              </button>
              <button
                onClick={() => {
                  setSearchMode('assets');
                  setSearchTerm('');
                  setSearchResults([]);
                  setAssetSearchResults([]);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: searchMode === 'assets' 
                    ? 'linear-gradient(135deg, #66bb6a, #43a047)' 
                    : 'transparent',
                  border: searchMode === 'assets'
                    ? '1px solid rgba(102, 187, 106, 0.5)'
                    : '1px solid transparent',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                📈 Asset Finanziari
              </button>
            </div>

            {/* Barra di ricerca */}
            <div style={{ marginBottom: '16px' }}>
              <Input
                placeholder={
                  searchMode === 'indicators' 
                    ? "Cerca indicatore (min 2 caratteri)..."
                    : "Cerca ticker (es. AAPL, SPY, TSLA)..."
                }
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
              {isSearching && (
                <div style={{ color: '#ffa726', fontSize: '11px', marginTop: '4px' }}>
                  🔍 Ricerca in corso...
                </div>
              )}
              {searchTerm.length >= 2 && !isSearching && (
                <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>
                  {searchMode === 'indicators' 
                    ? `${filteredLocalIndicators.length} locali • ${fredResultsFiltered.length} da FRED`
                    : `${assetSearchResults.length} asset trovati`
                  }
                </div>
              )}
            </div>

            {/* Lista indicatori filtrati */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {allResults.slice(0, 15).map(indicator => {
                const config = indicator.source === 'yahoo'
                  ? { color: '#66bb6a' } // Verde per asset
                  : indicator.source === 'local' 
                    ? getIndicatorConfig(indicator.id, macroData, macroService)
                    : { color: '#42a5f5' }; // Blu per FRED
                    
                const categoryConfig = indicator.source === 'yahoo'
                  ? { icon: '📈' }
                  : indicator.source === 'local'
                    ? getCategoryConfig(indicator.category)
                    : { icon: '🔍' };
                    
                const isLoading = loadingIndicator === indicator.id;
                const badgeColor = indicator.source === 'yahoo' 
                  ? 'rgba(102, 187, 106, 0.2)'
                  : indicator.source === 'fred'
                    ? 'rgba(66, 165, 245, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)';
                
                return (
                  <div
                    key={indicator.id}
                    onClick={() => !isLoading && handleSelectIndicator(indicator)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      background: indicator.source === 'yahoo'
                        ? 'rgba(102, 187, 106, 0.05)'
                        : indicator.source === 'fred' 
                          ? 'rgba(66, 165, 245, 0.05)' 
                          : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      cursor: isLoading ? 'wait' : 'pointer',
                      border: `1px solid ${badgeColor}`,
                      transition: 'all 0.2s',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = indicator.source === 'yahoo'
                          ? 'rgba(102, 187, 106, 0.1)'
                          : indicator.source === 'fred'
                            ? 'rgba(66, 165, 245, 0.1)'
                            : 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = config.color + '40';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = indicator.source === 'yahoo'
                          ? 'rgba(102, 187, 106, 0.05)'
                          : indicator.source === 'fred'
                            ? 'rgba(66, 165, 245, 0.05)'
                            : 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = badgeColor;
                        e.currentTarget.style.transform = 'translateX(0px)';
                      }
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
                      {isLoading ? '⏳' : indicator.source === 'yahoo' ? '💹' : indicator.id.slice(0, 2)}
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
                        {indicator.source === 'yahoo' ? indicator.ticker : indicator.name}
                      </div>
                      <div style={{ 
                        color: indicator.source === 'yahoo' 
                          ? '#66bb6a' 
                          : indicator.source === 'fred' 
                            ? '#42a5f5' 
                            : '#999', 
                        fontSize: '11px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {categoryConfig.icon} {indicator.categoryName || (indicator.source === 'yahoo' ? indicator.name : indicator.id)}
                        {indicator.source === 'fred' && ' • Da caricare'}
                        {indicator.source === 'yahoo' && ' • Yahoo Finance'}
                        {indicator.isin && ` • ${indicator.isin}`}
                      </div>
                    </div>
                    <div style={{
                      color: config.color,
                      fontSize: '16px'
                    }}>
                      {isLoading ? '⏳' : '+'}
                    </div>
                  </div>
                );
              })}

              {allResults.length === 0 && !isSearching && searchTerm.length >= 2 && (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  Nessun indicatore trovato
                </div>
              )}

              {searchTerm.length < 2 && allResults.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  Inserisci almeno 2 caratteri per cercare
                </div>
              )}

              {allResults.length > 15 && (
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  color: '#ffa726',
                  fontSize: '12px'
                }}>
                  +{allResults.length - 15} altri risultati...
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
              background: `linear-gradient(135deg, ${getIndicatorConfig(compareIndicator.id, macroData, macroService).color}, ${getIndicatorConfig(compareIndicator.id, macroData, macroService).color}dd)`,
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
            onClick={() => onSelectCompareIndicator(null)}
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

export default CompareSection;
