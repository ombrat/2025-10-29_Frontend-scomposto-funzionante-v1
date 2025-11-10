import { useState, useEffect, useMemo } from 'react';
import macroService from '../services/macroService';
import '../styles/HeatmapPage.css';

/**
 * HeatmapPage - Visualizzazione heatmap degli indicatori economici
 * Simile a Bloomberg/Reuters con colori che indicano performance
 */
const HeatmapPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' o 'quarterly'
  const [yearsToShow, setYearsToShow] = useState(2); // Ultimi 2 anni

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
   * Calcola valore/variazione per un periodo specifico
   */
  const calculateValueForPeriod = (indicator, period) => {
    const observations = indicator.observations;
    if (!observations || observations.length === 0) return null;

    // FORZA ordinamento decrescente (più recenti prima)
    // Il backend potrebbe non rispettare sort_order=desc
    const sortedObs = [...observations].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Decrescente
    });

    // DEBUG: Verifica primi 3 elementi ordinati
    if ((indicator.id === 'UNRATE' || indicator.id === 'PAYEMS') && period.label === 'nov 24') {
      console.log(`🔍 ${indicator.id} after sort:`, {
        first3: sortedObs.slice(0, 3).map(o => o.date),
        total: sortedObs.length
      });
    }

    // Trova osservazione più vicina al periodo target (con tolleranza di 3 mesi)
    let currentObs = null;
    let previousObs = null;
    let bestMatch = null;
    let minDistance = Infinity;

    const targetDate = new Date(period.year, period.month || (period.quarter - 1) * 3, 15);

    // DEBUG: Target date
    if ((indicator.id === 'UNRATE' || indicator.id === 'PAYEMS') && period.label === 'nov 24') {
      console.log(`🎯 ${indicator.id} target:`, {
        label: period.label,
        targetDate: targetDate.toISOString(),
        year: period.year,
        month: period.month
      });
    }

    for (let i = 0; i < sortedObs.length; i++) {
      const obsDate = new Date(sortedObs[i].date);
      const distance = Math.abs(obsDate - targetDate);
      
      // Cerca match entro 90 giorni (3 mesi)
      if (distance < minDistance && distance < 90 * 24 * 60 * 60 * 1000) {
        minDistance = distance;
        bestMatch = i;
      }
    }

    // DEBUG: Risultato matching
    if ((indicator.id === 'UNRATE' || indicator.id === 'PAYEMS') && period.label === 'nov 24') {
      console.log(`✅ ${indicator.id} match:`, {
        bestMatch,
        minDistance: minDistance / (24 * 60 * 60 * 1000), // giorni
        matchedDate: sortedObs[bestMatch]?.date,
        value: sortedObs[bestMatch]?.value
      });
    }

    if (bestMatch !== null) {
      currentObs = sortedObs[bestMatch];
      
      // Trova osservazione precedente (cerca l'osservazione più vecchia disponibile)
      if (period.month !== undefined) {
        // Modalità mensile: cerca 1 mese prima
        previousObs = sortedObs[bestMatch + 1] || null;
      } else {
        // Modalità trimestrale: cerca 3 mesi prima
        for (let i = bestMatch + 1; i < sortedObs.length; i++) {
          const prevDate = new Date(sortedObs[i].date);
          const currDate = new Date(currentObs.date);
          const monthsDiff = (currDate.getFullYear() - prevDate.getFullYear()) * 12 + 
                            (currDate.getMonth() - prevDate.getMonth());
          
          if (monthsDiff >= 2 && monthsDiff <= 4) {
            previousObs = sortedObs[i];
            break;
          }
        }
      }
    }

    if (!currentObs || currentObs.value === '.') return null;

    const currentValue = parseFloat(currentObs.value);
    if (isNaN(currentValue)) return null;

    // Calcola variazione percentuale se abbiamo valore precedente
    let change = null;
    let changePercent = null;

    if (previousObs && previousObs.value !== '.') {
      const previousValue = parseFloat(previousObs.value);
      if (!isNaN(previousValue) && previousValue !== 0) {
        change = currentValue - previousValue;
        changePercent = (change / previousValue) * 100;
      }
    }

    return {
      value: currentValue,
      change,
      changePercent,
      date: currentObs.date
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
        category: indicator.categoryKey,
        values,
        units: indicator.units
      };
    });

    return {
      periods,
      rows
    };
  }, [data, viewMode, yearsToShow]);

  /**
   * Determina il colore della cella in base al valore
   */
  const getCellColor = (cellData, indicator) => {
    if (!cellData || cellData.changePercent === null) return 'transparent';

    const change = cellData.changePercent;
    
    // Per alcuni indicatori, valori alti sono negativi (es. disoccupazione)
    const isInverse = ['UNRATE', 'VIXCLS', 'MORTGAGE30US', 'FEDFUNDS'].includes(indicator.id);
    const effectiveChange = isInverse ? -change : change;

    // Scala di colore basata su magnitude
    const absChange = Math.abs(effectiveChange);
    let intensity;

    if (absChange < 0.5) intensity = 0.2;
    else if (absChange < 1) intensity = 0.4;
    else if (absChange < 2) intensity = 0.6;
    else if (absChange < 5) intensity = 0.8;
    else intensity = 1.0;

    if (effectiveChange > 0) {
      // Verde per positivo
      return `rgba(34, 197, 94, ${intensity})`;
    } else {
      // Rosso per negativo
      return `rgba(239, 68, 68, ${intensity})`;
    }
  };

  /**
   * Formatta il valore per display
   */
  const formatCellValue = (cellData, indicator) => {
    if (!cellData) return '—';
    
    const { changePercent } = cellData;
    
    if (changePercent === null || changePercent === undefined) {
      return '—';
    }

    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
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
          <div className="legend-color" style={{ background: 'rgba(239, 68, 68, 0.8)' }}></div>
          <span>Forte negativo</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(239, 68, 68, 0.3)' }}></div>
          <span>Lieve negativo</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'transparent', border: '1px solid #ccc' }}></div>
          <span>Neutro</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(34, 197, 94, 0.3)' }}></div>
          <span>Lieve positivo</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(34, 197, 94, 0.8)' }}></div>
          <span>Forte positivo</span>
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
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="indicator-column sticky-col" title={row.name}>
                    <div className="indicator-cell">
                      <span className="indicator-id">{row.id}</span>
                      <span className="indicator-name">{row.name}</span>
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
                      title={cellData ? `${row.name}: ${formatCellValue(cellData, row)} (${cellData.date})` : 'N/A'}
                    >
                      {formatCellValue(cellData, row)}
                    </td>
                  ))}
                </tr>
              ))}
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
