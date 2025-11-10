import React from 'react';
import Button from '../ui/Button.jsx';
import IndicatorCard from './IndicatorCard.jsx';

/**
 * Componente per la gestione degli indicatori personalizzati aggiunti dall'utente
 */
const CustomIndicators = ({
  customIndicators,
  searchTerm,
  onRemoveIndicator,
  onStartCompare,
  expandedIndicators,
  onToggleIndicator,
  macroData,
  macroService
}) => {
  // Filtra indicatori personalizzati in base alla ricerca
  const filteredCustomIndicators = searchTerm 
    ? Object.values(customIndicators).filter(indicator => {
        const searchLower = searchTerm.toLowerCase();
        return indicator.name.toLowerCase().includes(searchLower) ||
               indicator.id.toLowerCase().includes(searchLower);
      })
    : Object.values(customIndicators);
    
  // Non mostrare la sezione se non ci sono indicatori filtrati
  if (filteredCustomIndicators.length === 0) return null;
  
  return (
    <div className="panel" style={{ marginTop: '20px' }}>
      <div 
        className="category-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(102, 187, 106, 0.1)',
          border: '1px solid rgba(102, 187, 106, 0.2)',
          marginBottom: '12px'
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)'
        }}>
          🆕
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            color: '#66bb6a', 
            fontSize: '16px', 
            margin: '0 0 2px 0',
            fontWeight: '700'
          }}>
            Indicatori Personalizzati
          </h3>
          <p style={{ 
            color: '#cfcfcf', 
            fontSize: '12px', 
            margin: 0 
          }}>
            {filteredCustomIndicators.length} di {Object.keys(customIndicators).length} indicatori
            {searchTerm && ` • Filtrato per "${searchTerm}"`}
          </p>
        </div>
        <div style={{ 
          color: '#66bb6a', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          Sempre espanso
        </div>
      </div>

      {/* Lista indicatori personalizzati */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px'
      }}>
        {filteredCustomIndicators.map((indicator) => {
          const indicatorKey = `custom_${indicator.id}`;
          const isExpanded = expandedIndicators[indicatorKey];

          return (
            <div key={indicator.id} style={{ position: 'relative' }}>
              {/* Bottone di rimozione */}
              <button
                onClick={() => onRemoveIndicator(indicator.id)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                  background: 'rgba(239, 83, 80, 0.1)',
                  border: '1px solid rgba(239, 83, 80, 0.3)',
                  color: '#ef5350',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 83, 80, 0.2)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 83, 80, 0.1)';
                  e.target.style.transform = 'scale(1)';
                }}
                title={`Rimuovi ${indicator.name}`}
              >
                🗑️ Rimuovi
              </button>

              <IndicatorCard
                indicator={indicator}
                categoryKey="custom"
                categoryName="Personalizzati"
                isExpanded={isExpanded}
                onToggleExpand={onToggleIndicator}
                onStartCompare={onStartCompare}
                macroData={macroData}
                macroService={macroService}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomIndicators;
