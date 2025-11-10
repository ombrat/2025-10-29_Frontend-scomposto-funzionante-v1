import React, { useState, useEffect } from 'react';
import CompareChart from './CompareChart.jsx';
import IndicatorChart from './IndicatorChart.jsx';
import Input from '../ui/Input.jsx';
import { getIndicatorConfig, getCategoryConfig } from '../../utils/analysis/indicatorConfig.js';

/**
 * Componente per la sezione di confronto interattiva tra indicatori
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
  const [isSearching, setIsSearching] = useState(false);
  const [loadingIndicator, setLoadingIndicator] = useState(null);
  
  if (!primary) return null;

  const primaryConfig = getIndicatorConfig(primary.id, macroData, macroService);

  // Effettua la ricerca FRED quando cambia il termine di ricerca
  useEffect(() => {
    const searchFred = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await macroService.searchFredSeries(searchTerm);
        // searchFredSeries restituisce { results: [], error: null }
        setSearchResults(response.results || []);
      } catch (error) {
        console.error('Errore nella ricerca FRED:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchFred, 300); // Debounce di 300ms
    return () => clearTimeout(timeoutId);
  }, [searchTerm, macroService]);

  // Filtra gli indicatori già caricati
  const filteredLocalIndicators = allIndicators.filter(indicator =>
    indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indicator.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indicator.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Combina risultati locali e FRED, rimuovendo duplicati
  const localIds = new Set(filteredLocalIndicators.map(ind => ind.id));
  // Assicurati che searchResults sia un array
  const fredResultsFiltered = Array.isArray(searchResults) 
    ? searchResults.filter(result => !localIds.has(result.id))
    : [];
  
  const allResults = [
    ...filteredLocalIndicators.map(ind => ({ ...ind, source: 'local' })),
    ...fredResultsFiltered.map(result => ({
      id: result.id,
      name: result.title,
      categoryName: 'FRED Search',
      category: 'fred_search',
      observations: [],
      source: 'fred'
    }))
  ];

  // Gestisce la selezione di un indicatore (carica i dati se necessario)
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
          seasonal_adjustment: data.seasonal_adjustment || ''
        };
        onSelectCompareIndicator(fullIndicator);
      } catch (error) {
        console.error('Errore nel caricamento indicatore:', error);
        alert(`Errore nel caricamento di ${indicator.name}: ${error.message}`);
      } finally {
        setLoadingIndicator(null);
      }
    } else {
      // Indicatore già caricato
      onSelectCompareIndicator(indicator);
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
              🔍 Seleziona Secondo Indicatore
            </h3>

            {/* Barra di ricerca */}
            <div style={{ marginBottom: '16px' }}>
              <Input
                placeholder="Cerca indicatore (min 2 caratteri)..."
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
                  {filteredLocalIndicators.length} locali • {fredResultsFiltered.length} da FRED
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
                const config = indicator.source === 'local' 
                  ? getIndicatorConfig(indicator.id, macroData, macroService)
                  : { color: '#42a5f5' }; // Colore default per FRED
                const categoryConfig = indicator.source === 'local'
                  ? getCategoryConfig(indicator.category)
                  : { icon: '🔍' };
                const isLoading = loadingIndicator === indicator.id;
                
                return (
                  <div
                    key={indicator.id}
                    onClick={() => !isLoading && handleSelectIndicator(indicator)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      background: indicator.source === 'fred' 
                        ? 'rgba(66, 165, 245, 0.05)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      cursor: isLoading ? 'wait' : 'pointer',
                      border: `1px solid ${indicator.source === 'fred' ? 'rgba(66, 165, 245, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                      transition: 'all 0.2s',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = indicator.source === 'fred'
                          ? 'rgba(66, 165, 245, 0.1)'
                          : 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = config.color + '40';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = indicator.source === 'fred'
                          ? 'rgba(66, 165, 245, 0.05)'
                          : 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = indicator.source === 'fred'
                          ? 'rgba(66, 165, 245, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)';
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
                      {isLoading ? '⏳' : indicator.id.slice(0, 2)}
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
                        color: indicator.source === 'fred' ? '#42a5f5' : '#999', 
                        fontSize: '11px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {categoryConfig.icon} {indicator.categoryName || indicator.id}
                        {indicator.source === 'fred' && ' • Da caricare'}
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
