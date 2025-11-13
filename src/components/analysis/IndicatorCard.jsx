import React from 'react';
import Button from '../ui/Button.jsx';
import IndicatorChart from './IndicatorChart.jsx';
import { formatValue, downloadIndicatorCSV, getUnitDescription } from '../../utils/analysis/indicatorUtils.js';
import { getIndicatorConfig } from '../../utils/analysis/indicatorConfig.js';

/**
 * Componente per la card di un singolo indicatore
 */
const IndicatorCard = ({
  indicator,
  categoryKey,
  categoryName,
  isExpanded,
  onToggleExpand,
  onStartCompare,
  macroData,
  macroService
}) => {
  const config = getIndicatorConfig(indicator.id, macroData, macroService);
  const observations = indicator.observations || [];

  // Se non ci sono dati, mostra messaggio
  if (observations.length === 0) {
    return (
      <div className="card series-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

  // I dati arrivano dal backend in ordine cronologico ascendente (più vecchi prima)
  // Quindi l'ultimo elemento è il più recente
  const latestValue = observations[observations.length - 1];
  const prevValue = observations[observations.length - 2];
  const change = prevValue ? parseFloat(latestValue.value) - parseFloat(prevValue.value) : null;

  // Determina quanti dati mostrare
  // Se espanso, mostra tutti i dati. Altrimenti solo gli ultimi 20
  const allHistoricalData = isExpanded 
    ? [...observations].reverse() // Tutti i dati invertiti (più recente prima)
    : observations.slice(-20).reverse(); // Ultimi 20 invertiti (più recente prima)
  const hasMoreData = observations.length > 20;

  return (
    <div className="card series-card">
      {/* Indicator header compatto - SEMPRE VISIBILE */}
      <div 
        onClick={() => onToggleExpand(categoryKey, indicator.id)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          background: isExpanded ? 'rgba(102, 187, 106, 0.05)' : 'transparent',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* Icona expand/collapse */}
        <div style={{
          color: config.color,
          fontSize: '14px',
          transition: 'transform 0.3s ease',
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          width: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          ▶
        </div>
        
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
          <p style={{ color: '#cfcfcf', fontSize: '11px', margin: '0 0 2px 0' }}>
            {indicator.id}
          </p>
          {indicator.units && (
            <p style={{ color: '#999', fontSize: '10px', margin: 0, fontStyle: 'italic' }}>
              📊 {getUnitDescription(indicator.units)}
            </p>
          )}
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

      {/* CONTENUTO ESPANDIBILE - Mostra solo se isExpanded è true */}
      {isExpanded && (
        <div style={{ 
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {/* Grafico storico ampio */}
          <IndicatorChart 
            data={observations} 
            color={config.color}
            height={280}
            indicator={indicator}
          />

          {/* Dati con scroll */}
          <div style={{ marginBottom: '8px', marginTop: '12px' }}>
            <div style={{ 
              color: '#cfcfcf', 
              fontSize: '12px', 
              marginBottom: '6px',
              fontWeight: '600'
            }}>
              Storico completo ({observations.length} dati)
            </div>
            
            {/* Finestra con scroll */}
            <div className="historical-data" style={{
              height: '200px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '6px',
              padding: '4px'
            }}>
              {[...observations].reverse().map((obs, index) => (
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
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span style={{ color: '#cfcfcf', fontSize: '11px' }}>
              {observations.length} osservazioni totali
            </span>
            
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {/* Confronta */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartCompare(indicator);
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  downloadIndicatorCSV(indicator, categoryName);
                }}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorCard;
