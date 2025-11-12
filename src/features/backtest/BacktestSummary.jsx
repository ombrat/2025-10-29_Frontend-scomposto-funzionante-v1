import React, { useState } from 'react';
import PortfolioChart from '../../components/charts/PortfolioChart';
import DrawdownChart from '../../components/charts/DrawdownChart';
import ExtremePerformanceHistogram from '../../components/analysis/ExtremePerformanceHistogram';
import InfoBox from '../../components/ui/InfoBox';
import KeyMetricsRow from '../../components/ui/KeyMetricsRow';
import { formatMoney, formatDate } from '../../utils/formatters';
import '../../styles/components.css';

export default function BacktestSummary({ result, hideChart = false }) {
  if (!result) return null;
  const summary = result.summary || {};
  const chartData = result.chart_data || result.equity_curve || result.series || [];
  const allAnnualReturns = result.all_annual_returns || result.annual_returns || result.annual_returns_data || [];

  // Drawdown calculation con analisi dei 3 peggiori periodi
  const DrawdownSection = ({ summary, chartData }) => {
    const [selectedDrawdown, setSelectedDrawdown] = React.useState(null);
    
    let drawdown = Number(summary?.max_drawdown ?? 0);
    let drawdownDate = summary?.max_drawdown_date ?? null;
    let recoveryDate = summary?.max_recovery_end_date ?? null;
    let recoveryDays = typeof summary?.max_recovery_time_days === 'number' ? Number(summary.max_recovery_time_days) : null;
    let worstDrawdowns = [];

    if (Array.isArray(chartData) && chartData.length > 1) {
      let peak = -Infinity;
      const daily = chartData.map(d => {
        const v = Number(d.Value ?? d.value ?? 0);
        if (v > peak) peak = v;
        const dd = (v / peak - 1) * 100;
        return { Date: d.Date, Value: v, Drawdown: dd, PeakValue: peak };
      });

      // Identifica i periodi di drawdown significativi
      const drawdownPeriods = [];
      let currentDrawdown = null;
      let peakValue = daily[0]?.Value || 0;
      let peakIndex = 0;

      daily.forEach((point, index) => {
        if (point.Value > peakValue * 1.001) { // Nuovo picco (con tolleranza)
          // Chiudi il drawdown precedente se esiste
          if (currentDrawdown && currentDrawdown.maxDrawdown < -1) { // Solo drawdown > 1%
            currentDrawdown.recoveryIndex = index - 1;
            currentDrawdown.recoveryDate = daily[index - 1]?.Date;
            currentDrawdown.duration = index - 1 - currentDrawdown.peakIndex;
            drawdownPeriods.push(currentDrawdown);
          }
          
          peakValue = point.Value;
          peakIndex = index;
          currentDrawdown = null;
        } else if (point.Drawdown < -1) { // Drawdown significativo
          if (!currentDrawdown) {
            currentDrawdown = {
              peakIndex: peakIndex,
              peakDate: daily[peakIndex]?.Date,
              peakValue: peakValue,
              troughIndex: index,
              troughDate: point.Date,
              maxDrawdown: point.Drawdown,
              minValue: point.Value
            };
          } else if (point.Drawdown < currentDrawdown.maxDrawdown) {
            currentDrawdown.troughIndex = index;
            currentDrawdown.troughDate = point.Date;
            currentDrawdown.maxDrawdown = point.Drawdown;
            currentDrawdown.minValue = point.Value;
          }
        }
      });

      // Chiudi l'ultimo drawdown se ancora aperto
      if (currentDrawdown && currentDrawdown.maxDrawdown < -1) {
        currentDrawdown.recoveryIndex = daily.length - 1;
        currentDrawdown.recoveryDate = null; // Non ancora recuperato
        currentDrawdown.duration = daily.length - 1 - currentDrawdown.peakIndex;
        drawdownPeriods.push(currentDrawdown);
      }

      // Ordina per gravità e prendi i 3 peggiori
      worstDrawdowns = drawdownPeriods
        .sort((a, b) => a.maxDrawdown - b.maxDrawdown)
        .slice(0, 3)
        .map((dd, index) => ({
          ...dd,
          rank: index + 1,
          label: `${(index + 1)}° Peggiore`,
          recoveryDays: dd.recoveryIndex ? dd.recoveryIndex - dd.peakIndex : null
        }));

      // Calcolo del drawdown principale (come prima)
      let trough = daily.reduce((acc, cur) => (cur.Drawdown < (acc?.Drawdown ?? 0) ? cur : acc), null);
      if (trough) {
        drawdownDate = trough.Date || drawdownDate;
        const troughIdx = daily.findIndex(d => d.Date === trough.Date);
        let peakIndex = 0;
        for (let i = troughIdx; i >= 0; i--) {
          if (daily[i].Value >= trough.PeakValue * 0.99999) { peakIndex = i; break; }
        }

        let recoveryIndex = -1;
        for (let i = troughIdx; i < daily.length; i++) {
          if (daily[i].Drawdown >= -0.01) { recoveryIndex = i; break; }
        }

        if (recoveryIndex !== -1) {
          recoveryDate = daily[recoveryIndex].Date;
          try {
            const peakDateObj = new Date(daily[peakIndex].Date);
            const recDateObj = new Date(recoveryDate);
            const diffDays = Math.round((recDateObj - peakDateObj) / (1000 * 60 * 60 * 24));
            recoveryDays = Number.isFinite(diffDays) ? diffDays : recoveryDays;
          } catch (e) { /* ignore */ }
        } else {
          try {
            const peakDateObj = new Date(daily[peakIndex].Date);
            const lastDateObj = new Date(daily[daily.length - 1].Date);
            const diffDays = Math.round((lastDateObj - peakDateObj) / (1000 * 60 * 60 * 24));
            recoveryDays = Number.isFinite(diffDays) ? diffDays : recoveryDays;
            recoveryDate = null;
          } catch (e) { /* ignore */ }
        }

        const minDD = Math.min(...daily.map(d => d.Drawdown));
        drawdown = Math.abs(minDD);
      }
    }

    const drawdownFormatted = (typeof drawdown === 'number' && isFinite(drawdown)) ? `${drawdown.toFixed(2)}%` : '-';
    const recoveryFormatted = (typeof recoveryDays === 'number' && isFinite(recoveryDays)) ? `${recoveryDays} giorni` : '-';

    return (
      <div>
        {/* Titolo FUORI dal contenitore */}
        {worstDrawdowns.length > 0 && (
          <h3 className="panel-title" style={{ 
            color: '#ef5350', 
            margin: '0 0 15px 0', 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            📉 I 3 Peggiori Periodi di Drawdown
          </h3>
        )}
        
        {/* Contenuto nel card senza titolo */}
        <div className="card" style={{ marginTop: 6 }}>
          {/* Etichette per i 3 peggiori drawdown */}
          {worstDrawdowns.length > 0 && (
            <div style={{ 
              marginBottom: 20, 
              paddingBottom: 20, 
              borderBottom: '1px solid rgba(239, 83, 80, 0.3)'
            }}>
            
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              justifyContent: 'center', 
              flexWrap: 'wrap' 
            }}>
              {worstDrawdowns.map((dd, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedDrawdown(selectedDrawdown?.rank === dd.rank ? null : dd)}
                  style={{
                    padding: '12px 16px',
                    background: selectedDrawdown?.rank === dd.rank 
                      ? 'linear-gradient(135deg, rgba(239, 83, 80, 0.2) 0%, rgba(239, 83, 80, 0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(239, 83, 80, 0.05) 0%, rgba(239, 83, 80, 0.1) 100%)',
                    border: selectedDrawdown?.rank === dd.rank 
                      ? '2px solid #ef5350' 
                      : '1px solid rgba(239, 83, 80, 0.3)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: 120,
                    textAlign: 'center',
                    position: 'relative',
                    transform: selectedDrawdown?.rank === dd.rank ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: selectedDrawdown?.rank === dd.rank 
                      ? '0 6px 20px rgba(239, 83, 80, 0.3)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDrawdown?.rank !== dd.rank) {
                      e.target.style.transform = 'scale(1.02)';
                      e.target.style.boxShadow = '0 4px 15px rgba(239, 83, 80, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDrawdown?.rank !== dd.rank) {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <div style={{ 
                    fontSize: 11, 
                    fontWeight: 600, 
                    color: '#ef5350', 
                    textTransform: 'uppercase',
                    marginBottom: 4
                  }}>
                    {dd.label}
                  </div>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 700, 
                    color: '#fff', 
                    marginBottom: 4
                  }}>
                    {Math.abs(dd.maxDrawdown).toFixed(1)}%
                  </div>
                  <div style={{ 
                    fontSize: 10, 
                    color: '#ccc',
                    lineHeight: 1.2
                  }}>
                    {dd.recoveryDays ? `${dd.recoveryDays} giorni` : 'Non recuperato'}
                  </div>
                </div>
              ))}
            </div>

            {/* Dettagli del drawdown selezionato */}
            {selectedDrawdown && (
              <div style={{
                marginTop: 15,
                padding: 15,
                background: 'rgba(239, 83, 80, 0.1)',
                border: '1px solid rgba(239, 83, 80, 0.3)',
                borderRadius: 8,
                animation: 'slideInUp 0.3s ease-out'
              }}>
                <h5 style={{ 
                  color: '#ef5350', 
                  margin: '0 0 10px 0', 
                  fontSize: 13,
                  fontWeight: 600
                }}>
                  📊 Dettagli {selectedDrawdown.label} Drawdown ({Math.abs(selectedDrawdown.maxDrawdown).toFixed(1)}%)
                </h5>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                  gap: 10,
                  fontSize: 11,
                  color: '#ccc'
                }}>
                  <div>
                    <strong style={{ color: '#fff' }}>Inizio Picco:</strong><br/>
                    {formatDate(selectedDrawdown.peakDate)}
                  </div>
                  <div>
                    <strong style={{ color: '#fff' }}>Fondo Raggiunto:</strong><br/>
                    {formatDate(selectedDrawdown.troughDate)}
                  </div>
                  <div>
                    <strong style={{ color: '#fff' }}>Valore Perso:</strong><br/>
                    {formatMoney(selectedDrawdown.peakValue - selectedDrawdown.minValue)}
                  </div>
                  {selectedDrawdown.recoveryDate && (
                    <div>
                      <strong style={{ color: '#fff' }}>Recupero:</strong><br/>
                      {formatDate(selectedDrawdown.recoveryDate)}
                    </div>
                  )}
                  <div>
                    <strong style={{ color: '#fff' }}>Durata:</strong><br/>
                    {selectedDrawdown.recoveryDays ? `${selectedDrawdown.recoveryDays} giorni` : 'Ancora in corso'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DrawdownChart 
          chartData={chartData} 
          summary={summary} 
          selectedDrawdownPeriod={selectedDrawdown}
        />

      </div>
    </div>
    );
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3 className="panel-title" style={{ 
        color: '#1e88e5', 
        margin: '0 0 20px 0', 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textAlign: 'center',
        justifyContent: 'center'
      }}>
        📈 Risultati Backtest - Analisi Completa
      </h3>

      <div 
        className="panel summary-panel" 
        style={{ 
          padding: 20, 
          background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.05) 0%, rgba(30, 136, 229, 0.1) 100%)',
          border: '2px solid rgba(30, 136, 229, 0.3)',
          borderRadius: 12,
          animation: 'fadeIn 0.6s ease-out',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Status Badge */}
        <div style={{
          position: 'absolute',
          top: 15,
          right: 20,
          backgroundColor: '#1e88e5',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          ✓ Completato
        </div>

      {/* Statistics Summary */}


      {/* grafico storico */}
      {!hideChart && (
        chartData && chartData.length > 0 ? (
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            borderRadius: 8, 
            padding: 10, 
            marginBottom: 15,
            animation: 'slideInUp 0.5s ease-out 0.2s both'
          }}>
            <PortfolioChart data={result} title={`📈 Andamento Storico - Performance nel Tempo`} summary={summary} />
          </div>
        ) : (
          <div style={{ 
            color: '#999', 
            padding: 20, 
            textAlign: 'center',
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px dashed rgba(255, 193, 7, 0.3)',
            borderRadius: 8
          }}>
            ⚠️ Grafico storico non disponibile
          </div>
        )
      )}

      {/* Key Metrics Row - solo quando il grafico è nascosto */}
      {hideChart && <KeyMetricsRow summary={summary} />}

      {/* controls and exports (if the chart component doesn't include them) */}
      <div className="controls-row" style={{ marginTop: 12 }}>
        {/* placeholder for export buttons if PortfolioChart doesn't include them */}
      </div>

      {/* extreme histogram + drawdown section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: 24, 
        marginTop: 20,
        animation: 'slideInUp 0.5s ease-out 0.4s both'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.15)',
          borderRadius: 10,
          padding: 15,
          border: '1px solid rgba(30, 136, 229, 0.2)'
        }}>
          <ExtremePerformanceHistogram summary={summary} allAnnualReturns={allAnnualReturns} />
        </div>
        <div style={{
          background: 'rgba(0, 0, 0, 0.15)',
          borderRadius: 10,
          padding: 15,
          border: '1px solid rgba(30, 136, 229, 0.2)'
        }}>
          <DrawdownSection summary={summary} chartData={chartData} />
        </div>
      </div>
    </div>
    </div>
  );
}