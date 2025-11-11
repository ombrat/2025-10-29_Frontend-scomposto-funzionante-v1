import React, { useState, useEffect, useMemo } from 'react';
import macroService from '../services/macroService';
import '../styles/HeatmapPage-modern.css';

/**
 * HeatmapPage - Visualizzazione heatmap degli indicatori economici
 * Design moderno ed elegante
 */
const HeatmapPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' o 'quarterly'
  const [yearsToShow, setYearsToShow] = useState(2); // Ultimi 2 anni
  const [expandedRows, setExpandedRows] = useState(new Set()); // Righe espanse

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carica tutti gli indicatori FRED
      const result = await macroService.fetchMacroDataComplete();
      console.log('📊 Dati caricati per heatmap:', result);
      
      setData(result);
    } catch (err) {
      console.error('❌ Errore caricamento dati heatmap:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
   * SEMPLICE: cerca solo la data esatta, niente calcoli complicati
   */
  const calculateValueForPeriod = (indicator, period) => {
    const observations = indicator.observations;
    if (!observations || observations.length === 0) return null;

    // Costruisci la data target esatta
    let targetYear = period.year;
    let targetMonth;
    
    if (period.month !== undefined) {
      // Modalità mensile: usa il mese esatto
      targetMonth = period.month;
    } else {
      // Modalità trimestrale: primo mese del trimestre
      targetMonth = (period.quarter - 1) * 3;
    }

    // Cerca l'osservazione con data esatta (formato YYYY-MM-DD)
    const targetDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
    
    const matchingObs = observations.find(obs => obs.date === targetDateStr);

    if (!matchingObs || matchingObs.value === '.' || matchingObs.value === null) {
      return null;
    }

    const value = parseFloat(matchingObs.value);
    if (isNaN(value)) return null;

    // Trova osservazione precedente per calcolare variazione
    const currentIndex = observations.findIndex(obs => obs.date === targetDateStr);
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
  }, [data, viewMode, yearsToShow]);

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
    
    // Indicatori INVERSI: aumento = negativo (rosso), diminuzione = positivo (verde)
    const inverseIndicators = [
      'UNRATE',        // Disoccupazione
      'ICSA',          // Richieste sussidi disoccupazione
      'CPIAUCSL',      // Inflazione CPI
      'CPILFESL',      // Inflazione core
      'PPIACO',        // Inflazione produttori
      'DRCCLACBS',     // Insolvenza carte credito
    ];
    
    const isInverse = inverseIndicators.includes(indicator.id);
    
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
      const arrow = changePercent > 0 ? '↑' : changePercent < 0 ? '↓' : '';
      return `${formattedValue} ${arrow}${sign}${changePercent.toFixed(1)}%`;
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

  if (loading) {
    return (
      <div className="heatmap-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Caricamento dati economici...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="heatmap-page">
        <div className="error-container">
          <h2>❌ Errore</h2>
          <p>{error}</p>
          <button onClick={loadData}>Riprova</button>
        </div>
      </div>
    );
  }

  if (!heatmapData) {
    return (
      <div className="heatmap-page">
        <div className="error-container">
          <p>Nessun dato disponibile</p>
        </div>
      </div>
    );
  }

  const { periods, rows } = heatmapData;

  return (
    <div className="heatmap-page">
      <div className="heatmap-header">
        <div className="header-content">
          <h1>📊 Heatmap Indicatori Economici</h1>
          <p className="subtitle">
            Variazioni percentuali degli indicatori economici USA
          </p>
        </div>

        <div className="controls">
          <div className="control-group">
            <label>Visualizzazione:</label>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="monthly">Mensile</option>
              <option value="quarterly">Trimestrale</option>
            </select>
          </div>

          <div className="control-group">
            <label>Periodo:</label>
            <select 
              value={yearsToShow} 
              onChange={(e) => setYearsToShow(parseInt(e.target.value))}
            >
              <option value="1">Ultimo anno</option>
              <option value="2">Ultimi 2 anni</option>
              <option value="3">Ultimi 3 anni</option>
              <option value="5">Ultimi 5 anni</option>
            </select>
          </div>

          <button className="refresh-btn" onClick={loadData}>
            🔄 Aggiorna
          </button>
        </div>
      </div>

      <div className="heatmap-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(239, 68, 68, 0.9)' }}></div>
          <span>Forte peggioramento</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(239, 68, 68, 0.35)' }}></div>
          <span>Lieve peggioramento</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(100, 116, 139, 0.1)', border: '1px solid #ccc' }}></div>
          <span>Stabile / Primo valore</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(34, 197, 94, 0.35)' }}></div>
          <span>Lieve miglioramento</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(34, 197, 94, 0.9)' }}></div>
          <span>Forte miglioramento</span>
        </div>
      </div>

      <div className="heatmap-container">
        <div className="heatmap-scroll">
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
              {rows.map((row, rowIdx) => {
                // Controlla se è la prima riga di una nuova categoria
                const isFirstInCategory = rowIdx === 0 || rows[rowIdx - 1].category !== row.category;
                
                return (
                  <React.Fragment key={row.id}>
                    {/* Header categoria */}
                    {isFirstInCategory && (
                      <tr className="category-header-row">
                        <td colSpan={periods.length + 1} className="category-header">
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
                          <a
                            href={`https://fred.stlouisfed.org/series/${row.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="indicator-name-link"
                            title={`Apri ${row.id} su FRED`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {row.name}
                          </a>
                          {row.units && <span className="indicator-units">{row.units}</span>}
                          {/* Info tooltip */}
                          <div className="info-tooltip-wrapper" onClick={(e) => e.stopPropagation()}>
                            <span className="info-icon">i</span>
                            <div className="info-tooltip">
                              <strong>{row.name}</strong>
                              <p>{row.description || 'Nessuna descrizione disponibile'}</p>
                              <small>Serie FRED: {row.id}</small>
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="heatmap-footer">
        <p>
          <strong>Fonte dati:</strong> Federal Reserve Economic Data (FRED) via Google Cloud Run
        </p>
        <p>
          <strong>Nota:</strong> I colori rappresentano la variazione percentuale rispetto al periodo precedente.
          Verde = crescita, Rosso = decrescita. Per indicatori come disoccupazione e volatilità, i colori sono invertiti.
        </p>
      </div>
    </div>
  );
};

export default HeatmapPage;
