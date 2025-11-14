import React, { useState, useEffect, useMemo } from 'react';
import macroService from '../services/macroService';
import ecbService from '../services/ecbService';
import eurostatService from '../services/eurostatService';

// Layout e UI components
import MainLayout from '../components/layout/MainLayout.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Button from '../components/ui/Button.jsx';

// Stili
import '../styles/index.css';
import '../styles/components.css';
import '../styles/HeatmapPage-dark.css';

/**
 * HeatmapPage - Visualizzazione heatmap degli indicatori economici
 * Design moderno ed elegante
 */
const HeatmapPage = () => {
  const [region, setRegion] = useState('USA'); // 'USA' o 'EU'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' o 'quarterly'
  const [yearsToShow, setYearsToShow] = useState(1); // Ultimi 1 anno (12 mesi = no scroll)
  const [expandedRows, setExpandedRows] = useState(new Set()); // Righe espanse
  const [searchFilter, setSearchFilter] = useState(''); // Filtro di ricerca

  useEffect(() => {
    loadData();
  }, [region]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      if (region === 'USA') {
        // Carica dati FRED per USA
        result = await macroService.fetchMacroDataComplete();
      } else {
        // Carica dati da ECB + Eurostat per EU in parallelo
        const [ecbData, eurostatData] = await Promise.all([
          ecbService.fetchMacroDataComplete(),
          eurostatService.fetchMacroDataComplete()
        ]);
        
        // Combina i dati
        result = {
          indicators: {},
          metadata: {
            totalIndicators: 0,
            totalDataPoints: 0,
            sources: ['ECB SDW', 'Eurostat'],
            lastUpdate: Date.now()
          }
        };
        
        // Unisci indicatori per categoria
        const allCategories = new Set([
          ...Object.keys(ecbData.indicators || {}),
          ...Object.keys(eurostatData.indicators || {})
        ]);
        
        allCategories.forEach(categoryKey => {
          result.indicators[categoryKey] = [
            ...(ecbData.indicators[categoryKey] || []),
            ...(eurostatData.indicators[categoryKey] || [])
          ];
        });
        
        console.log(`Heatmap EU: ECB (${Object.values(ecbData.indicators || {}).flat().length}) + Eurostat (${Object.values(eurostatData.indicators || {}).flat().length}) indicatori`);
      }
      
      console.log(`Dati ${region} caricati per heatmap:`, result);
      
      setData(result);
    } catch (err) {
      console.error(`Errore caricamento dati heatmap ${region}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abbrevia i nomi degli indicatori per la visualizzazione compatta
   */
  const abbreviateIndicatorName = (fullName) => {
    // Abbreviazioni specifiche per indicatori comuni
    const abbreviations = {
      // USA - FRED
      'Unemployment Rate': 'Disoccupaz.',
      'Consumer Price Index': 'CPI',
      'Producer Price Index': 'PPI',
      'Real Gross Domestic Product': 'PIL Reale',
      'Gross Domestic Product': 'PIL',
      'Industrial Production Index': 'Prod. Ind.',
      'Retail Sales': 'Vendite Det.',
      'Housing Starts': 'Avvio Costruz.',
      'Consumer Confidence': 'Fiducia Cons.',
      'Federal Funds Rate': 'Tasso Fed',
      'Initial Claims': 'Rich. Sussidi',
      'Nonfarm Payrolls': 'Occupati',
      'Total Vehicle Sales': 'Vendite Auto',
      'Leading Economic Indicators': 'LEI',
      'Manufacturing PMI': 'PMI Manif.',
      'Services PMI': 'PMI Servizi',
      'Personal Income': 'Reddito Pers.',
      'Personal Consumption': 'Consumo Pers.',
      'Credit Card Delinquency': 'Insolvenze CC',
      
      // EU - ECB/Eurostat
      'Harmonised Index of Consumer Prices': 'HICP',
      'Gross Domestic Product': 'PIL',
      'Industrial Production': 'Produz. Ind.',
      'Unemployment Rate': 'Disoccupaz.',
      'Producer Price Index': 'PPI',
      'Consumer Confidence': 'Fiducia Cons.',
      'Business Confidence': 'Fiducia Imprese',
      'Retail Trade': 'Commercio Det.',
      'Money Supply': 'M3',
      'Bank Interest Rate': 'Tasso BCE',
      'Current Account Balance': 'Bilancia Corr.',
      'Government Debt': 'Debito Pubb.'
    };

    // Controlla prima le abbreviazioni specifiche
    if (abbreviations[fullName]) {
      return abbreviations[fullName];
    }

    // Algoritmo di abbreviazione automatica
    let abbreviated = fullName;

    // Rimuovi tutte le emoji e simboli Unicode non alfabetici
    abbreviated = abbreviated.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

    // Rimuovi parole comuni non essenziali
    const wordsToRemove = [
      'Index', 'Rate', 'Total', 'All', 'Real', 'Nominal', 'Seasonally Adjusted',
      'Monthly', 'Annual', 'Quarterly', 'Average', 'Percent', 'Change',
      'Level', 'Number', 'Value', 'Amount', 'Volume', 'Units'
    ];
    
    wordsToRemove.forEach(word => {
      abbreviated = abbreviated.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });

    // Rimuovi spazi multipli
    abbreviated = abbreviated.replace(/\s+/g, ' ').trim();

    // Se ancora troppo lungo, usa acronimo
    if (abbreviated.length > 15) {
      const words = abbreviated.split(' ');
      if (words.length > 1) {
        abbreviated = words.map(word => word.charAt(0).toUpperCase()).join('');
      } else {
        // Tronca se è una parola singola troppo lunga
        abbreviated = abbreviated.substring(0, 12) + '...';
      }
    }

    return abbreviated;
  };

  /**
   * Genera lista di periodi (mesi o trimestri)
   */
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

    return periods;
  };

  /**
   * Trova il valore esatto per un periodo specifico
   * Gestisce formati: YYYY-MM-DD (FRED), YYYY-MM (Eurostat mensili), YYYY-QX (Eurostat trimestrali)
   */
  // Rileva se un indicatore ha dati trimestrali o mensili
  const detectDataFrequency = (observations) => {
    if (!observations || observations.length === 0) return 'monthly';
    
    // Controlla le prime date per determinare il formato
    const sampleDates = observations.slice(0, 5).map(o => o.date);
    const hasQuarterly = sampleDates.some(d => d && d.includes('-Q'));
    
    return hasQuarterly ? 'quarterly' : 'monthly';
  };

  const calculateValueForPeriod = (indicator, period) => {
    const observations = indicator.observations;
    if (!observations || observations.length === 0) return null;

    // Rileva frequenza dei dati
    const frequency = detectDataFrequency(observations);
    
    // Costruisci le possibili date target
    let targetDates = [];
    
    if (period.month !== undefined) {
      // Modalità mensile
      const monthStr = String(period.month + 1).padStart(2, '0');
      
      if (frequency === 'quarterly') {
        // Per dati trimestrali, converti il mese in trimestre
        // Mostra solo i dati nei mesi finali di ogni trimestre (marzo, giugno, settembre, dicembre)
        const monthNum = period.month + 1;
        const isQuarterEndMonth = monthNum % 3 === 0;
        
        if (!isQuarterEndMonth) {
          // Questo mese non corrisponde a fine trimestre, salta
          return null;
        }
        
        const quarter = Math.ceil(monthNum / 3);
        targetDates = [`${period.year}-Q${quarter}`];
      } else {
        // Dati mensili: cerca YYYY-MM-DD o YYYY-MM
        targetDates = [
          `${period.year}-${monthStr}-01`,  // FRED format (2024-11-01)
          `${period.year}-${monthStr}`      // Eurostat format (2024-11)
        ];
      }
    } else if (period.quarter !== undefined) {
      // Modalità trimestrale: cerca YYYY-QX o YYYY-MM-DD del primo mese
      const firstMonthOfQuarter = (period.quarter - 1) * 3 + 1;
      targetDates = [
        `${period.year}-Q${period.quarter}`,  // Eurostat format (2024-Q3)
        `${period.year}-${String(firstMonthOfQuarter).padStart(2, '0')}-01`  // FRED format
      ];
    }
    
    // Cerca la prima data che matcha
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

    // Trova osservazione precedente per calcolare variazione
    const currentIndex = observations.findIndex(obs => obs.date === matchingObs.date);
    let previousValue = null;
    let changePercent = null;
    
    if (currentIndex > 0) {
      // Cerca il valore precedente valido
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

    return {
      value,
      previousValue,
      changePercent,
      date: matchingObs.date
    };
  };

  /**
   * Prepara i dati per la heatmap
   * Calcola variazioni percentuali o valori assoluti per periodo
   */
  const heatmapData = useMemo(() => {
    if (!data || !data.indicators) return null;

    const allIndicators = [];
    const categories = data.indicators;

    // Estrai tutti gli indicatori da tutte le categorie
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

    // Filtra per gli ultimi N anni
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsToShow);

    // Genera periodi (mesi o trimestri)
    const periods = generatePeriods(viewMode, yearsToShow);

    // Calcola valori per ogni indicatore per ogni periodo
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

    // Ordina per categoria
    const categoryOrder = ['employment', 'growth', 'stability'];
    rows.sort((a, b) => {
      const orderA = categoryOrder.indexOf(a.category);
      const orderB = categoryOrder.indexOf(b.category);
      return orderA - orderB;
    });

    return {
      periods,
      rows
    };
  }, [data, viewMode, yearsToShow, searchFilter]);

  /**
   * Determina il colore della cella in base al miglioramento/peggioramento
   * Verde = miglioramento economico
   * Rosso = peggioramento economico
   * Intensità proporzionale al cambiamento
   */
  const getCellColor = (cellData, indicator) => {
    if (!cellData || cellData.changePercent === null || cellData.changePercent === undefined) {
      return 'rgba(100, 116, 139, 0.1)'; // Grigio neutro se nessun cambio
    }

    const change = cellData.changePercent;
    
    // Indicatori INVERSI USA: aumento = negativo (rosso), diminuzione = positivo (verde)
    const inverseIndicatorsUSA = [
      'UNRATE',        // Disoccupazione
      'ICSA',          // Richieste sussidi disoccupazione
      'CPIAUCSL',      // Inflazione CPI
      'CPILFESL',      // Inflazione core
      'PPIACO',        // Inflazione produttori
      'DRCCLACBS',     // Insolvenza carte credito
    ];
    
    // Indicatori INVERSI EU: aumento = negativo (rosso), diminuzione = positivo (verde)
    const inverseIndicatorsEU = [
      'UNEMPLOYMENT_EA',       // Disoccupazione
      'HICP_EA',              // Inflazione HICP
      'HICP_CORE',            // Inflazione core
      'HICP_ENERGY',          // Inflazione energia
      'HICP_FOOD',            // Inflazione alimentare
      'PPI_EA',               // Prezzi produttori
      'HICP_ENERGY_EA',       // Inflazione energia (BCE)
      'HICP_FOOD_EA',         // Inflazione alimentare (BCE)
      'HICP_CORE_EA',         // Inflazione core (BCE)
    ];
    
    const isInverse = region === 'USA' 
      ? inverseIndicatorsUSA.includes(indicator.id)
      : inverseIndicatorsEU.includes(indicator.id);
    
    // Determina se il cambiamento è positivo o negativo per l'economia
    const isGoodChange = isInverse ? change < 0 : change > 0;
    
    // Calcola intensità in base alla magnitudine del cambiamento
    const absChange = Math.abs(change);
    let intensity;
    
    if (absChange < 0.5) {
      intensity = 0.2;
    } else if (absChange < 1) {
      intensity = 0.35;
    } else if (absChange < 2) {
      intensity = 0.5;
    } else if (absChange < 5) {
      intensity = 0.7;
    } else {
      intensity = 0.9;
    }
    
    // Applica colore
    if (isGoodChange) {
      // Verde per miglioramento
      return `rgba(34, 197, 94, ${intensity})`;
    } else {
      // Rosso per peggioramento
      return `rgba(239, 68, 68, ${intensity})`;
    }
  };

  /**
   * Formatta il valore per display
   */
  const formatCellValue = (cellData, indicator) => {
    if (!cellData) return '—';
    
    const { value, changePercent } = cellData;
    
    if (value === null || value === undefined) {
      return '—';
    }

    // Mostra valore con variazione percentuale se disponibile
    const formattedValue = value.toFixed(2);
    
    if (changePercent !== null && changePercent !== undefined) {
      const sign = changePercent >= 0 ? '+' : '';
      return `${formattedValue} ${sign}${changePercent.toFixed(1)}%`;
    }
    
    return formattedValue;
  };

  /**
   * Toggle espansione riga per mostrare variazioni percentuali
   */
  const toggleRowExpansion = (indicatorId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(indicatorId)) {
        newSet.delete(indicatorId);
      } else {
        newSet.add(indicatorId);
      }
      return newSet;
    });
  };

  /**
   * Filtra le righe in base al testo di ricerca
   */
  const filterRows = (rows) => {
    if (!searchFilter.trim()) {
      return rows;
    }
    
    const searchTerm = searchFilter.toLowerCase().trim();
    return rows.filter(row => 
      row.name.toLowerCase().includes(searchTerm) ||
      row.id.toLowerCase().includes(searchTerm) ||
      row.categoryLabel.toLowerCase().includes(searchTerm)
    );
  };

  if (loading) {
    return (
      <MainLayout 
        center={
          <div className="panel">
            <div className="loading-container">
              <Spinner />
              <p>Caricamento dati economici...</p>
            </div>
          </div>
        }
      />
    );
  }

  if (error) {
    return (
      <MainLayout 
        center={
          <div className="panel">
            <div className="error-container">
              <h2>Errore</h2>
              <p>{error}</p>
              <Button onClick={loadData}>Riprova</Button>
            </div>
          </div>
        }
      />
    );
  }

  if (!heatmapData) {
    return (
      <MainLayout 
        center={
          <div className="panel">
            <div className="error-container">
              <p>Nessun dato disponibile</p>
            </div>
          </div>
        }
      />
    );
  }

  const { periods, rows } = heatmapData;
  const filteredRows = filterRows(rows);

  // Raggruppa per categoria
  const categorizedRows = useMemo(() => {
    const grouped = {};
    filteredRows.forEach(row => {
      const cat = row.category || 'other';
      if (!grouped[cat]) {
        grouped[cat] = {
          categoryKey: cat,
          categoryLabel: row.categoryLabel || 'Altro',
          rows: []
        };
      }
      grouped[cat].rows.push(row);
    });
    return Object.values(grouped);
  }, [filteredRows]);

  return (
    <MainLayout 
      center={
        <div className="heatmap-page">
          {/* Header Compatto */}
          <div className="panel" style={{ marginBottom: '15px' }}>
            {/* Prima Riga: Titolo + Toggle Regione + Info */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              marginBottom: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: '0 0 auto' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                  Heatmap Indicatori
                </h2>
              </div>
              
              {/* Toggle Regione Compatto */}
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
                  variant={region === 'USA' ? 'primary' : 'secondary'}
                  style={{ 
                    padding: '6px 16px',
                    fontSize: '13px',
                    background: region === 'USA' ? '#2196F3' : 'transparent',
                    border: 'none',
                    fontWeight: region === 'USA' ? '600' : '400'
                  }}
                >
                  USA
                </Button>
                <Button 
                  onClick={() => setRegion('EU')}
                  variant={region === 'EU' ? 'primary' : 'secondary'}
                  style={{ 
                    padding: '6px 16px',
                    fontSize: '13px',
                    background: region === 'EU' ? '#FFC107' : 'transparent',
                    border: 'none',
                    fontWeight: region === 'EU' ? '600' : '400'
                  }}
                >
                  EU
                </Button>
              </div>

              {/* Info Badge Compatto */}
              {!loading && data && (
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
                  <span>
                    {region === 'USA' ? '30 indicatori' : '23 indicatori'}
                  </span>
                </div>
              )}
            </div>

            {/* Seconda Riga: Controlli Inline + Legenda */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              {/* Ricerca */}
              <div style={{ flex: '1 1 250px', minWidth: '200px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Cerca indicatore..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
                {searchFilter.trim() && (
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '11px',
                    color: '#888',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {filteredRows.length} risultat{filteredRows.length === 1 ? 'o' : 'i'}
                  </span>
                )}
              </div>

              {/* Visualizzazione */}
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
                <option value="monthly">Mensile</option>
                <option value="quarterly">Trimestrale</option>
              </select>

              {/* Periodo */}
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

              {/* Legenda Compatta */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'center',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '11px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '14px', height: '14px', background: 'rgba(239, 68, 68, 0.9)', borderRadius: '2px' }}></div>
                  <span style={{ color: '#aaa' }}>Peggio</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '14px', height: '14px', background: 'rgba(100, 116, 139, 0.2)', borderRadius: '2px', border: '1px solid #666' }}></div>
                  <span style={{ color: '#aaa' }}>Neutro</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '14px', height: '14px', background: 'rgba(34, 197, 94, 0.9)', borderRadius: '2px' }}></div>
                  <span style={{ color: '#aaa' }}>Meglio</span>
                </div>
              </div>

              {/* Refresh Button */}
              <Button 
                onClick={loadData} 
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                Aggiorna
              </Button>
            </div>
          </div>

          {/* Sezioni Heatmap per Categoria */}
          {categorizedRows.length === 0 ? (
            <div className="panel">
              <div className="no-results" style={{padding: '2rem', textAlign: 'center'}}>
                {searchFilter.trim() ? (
                  <>
                    Nessun risultato trovato per "<strong>{searchFilter}</strong>"
                    <br />
                    <button 
                      className="clear-search-btn"
                      onClick={() => setSearchFilter('')}
                      style={{marginTop: '1rem'}}
                    >
                      ✕ Cancella ricerca
                    </button>
                  </>
                ) : (
                  'Nessun dato disponibile'
                )}
              </div>
            </div>
          ) : (
            categorizedRows.map((categoryGroup, catIdx) => (
              <div key={categoryGroup.categoryKey} className="panel" style={{ 
                maxWidth: '100%', 
                overflow: 'hidden',
                boxSizing: 'border-box',
                marginBottom: '20px'
              }}>
                {/* Header Categoria */}
                <div className="category-section-header" style={{
                  background: 'linear-gradient(135deg, rgba(102, 187, 106, 0.15), rgba(118, 75, 162, 0.15))',
                  borderTop: '2px solid rgba(102, 187, 106, 0.4)',
                  borderBottom: '2px solid rgba(102, 187, 106, 0.4)',
                  padding: '0.7rem 1.5rem',
                  marginBottom: '0',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#66bb6a'
                }}>
                  <span style={{marginRight: '0.75rem'}}>
                    {categoryGroup.categoryKey === 'employment' ? 'LAVORO' : 
                     categoryGroup.categoryKey === 'growth' ? 'CRESCITA' : 
                     categoryGroup.categoryKey === 'stability' ? 'STABILITA' : 'ALTRO'}
                  </span>
                  {categoryGroup.categoryLabel}
                </div>

                {/* Tabella per questa categoria */}
                <div className="heatmap-container" style={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}>
                  <div className="heatmap-scroll" style={{
                    overflowX: 'auto',
                    overflowY: 'visible',
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
                        {categoryGroup.rows.map((row) => (
                          <React.Fragment key={row.id}>
                    
                    {/* Riga principale */}
                    <tr 
                      className={expandedRows.has(row.id) ? 'expanded-row' : ''}
                      onClick={() => toggleRowExpansion(row.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="indicator-column sticky-col" title={`${row.name} - ${row.description || 'Clicca "i" per dettagli'}`}>
                        <div className="indicator-cell">
                          <span className="expand-icon">
                            {expandedRows.has(row.id) ? '▼' : '▶'}
                          </span>
                          {region === 'USA' ? (
                            <a
                              href={`https://fred.stlouisfed.org/series/${row.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="indicator-name-link"
                              title={`${row.name} - Apri ${row.id} su FRED`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {abbreviateIndicatorName(row.name)}
                            </a>
                          ) : (
                            // Link per indicatori EU (BCE o Eurostat)
                            row.id.includes('.') ? (
                              // Indicatore BCE (formato con punti: ICP.M.U2...)
                              <a
                                href={`https://data.ecb.europa.eu/main-figures/ecb-statistics-explorer`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="indicator-name-link"
                                title={`${row.name} - Apri ECB Statistics Explorer - Cerca: ${row.id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {abbreviateIndicatorName(row.name)}
                              </a>
                            ) : (
                              // Indicatore Eurostat (formato senza punti: UNEMPLOYMENT_EA, GDP_EA...)
                              <a
                                href={`https://ec.europa.eu/eurostat/databrowser/explore/all/all_themes`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="indicator-name-link"
                                title={`${row.name} - Apri Eurostat Database Browser`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {abbreviateIndicatorName(row.name)}
                              </a>
                            )
                          )}
                          {/* Info tooltip */}
                          <div 
                            className="info-tooltip-wrapper" 
                            onClick={(e) => {
                              e.stopPropagation();
                              const wrapper = e.currentTarget;
                              wrapper.classList.toggle('active');
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.classList.add('active');
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.classList.remove('active');
                            }}
                          >
                            <span className="info-icon">i</span>
                            <div className="info-tooltip">
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong style={{ color: '#66bb6a', fontSize: '0.9rem' }}>{row.name}</strong>
                              </div>
                              <div style={{ marginBottom: '0.5rem', color: '#ccc' }}>
                                {row.description || 'Nessuna descrizione disponibile'}
                              </div>
                              {row.units && (
                                <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
                                  <strong>Unità:</strong> {row.units}
                                </div>
                              )}
                              <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                <strong>Fonte:</strong> {region === 'USA' ? 'FRED' : 'ECB/Eurostat'}<br/>
                                <strong>Serie ID:</strong> {row.id}
                              </div>
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
                                {cellData.changePercent >= 0 ? '+' : ''}
                                {cellData.changePercent.toFixed(2)}%
                              </>
                            ) : '—'}
                          </td>
                        ))}
                      </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          )}        <div className="panel tight">
          <div className="heatmap-footer">
            <p className="text-muted">
              <strong>Fonte dati:</strong> {region === 'USA' 
                ? 'Federal Reserve Economic Data (FRED) via Google Cloud Run'
                : 'ECB Statistical Data Warehouse + Eurostat via Google Cloud Run'}
            </p>
            <p className="small-muted">
              <strong>Nota:</strong> I colori rappresentano la variazione percentuale rispetto al periodo precedente.
              Verde = crescita, Rosso = decrescita. Per indicatori come disoccupazione, inflazione e volatilità, i colori sono invertiti.
            </p>
          </div>
          </div>
          </div>
        </div>
        }
      />
    );
};

export default HeatmapPage;
