import React from 'react';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { getCategoryConfig } from '../../utils/analysis/indicatorConfig.js';

/**
 * Componente per la barra di ricerca e filtri della pagina analisi
 */
const AnalysisSearch = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalResults,
  onRefresh,
  isSearching,
  searchResults,
  searchError,
  onAddCustomIndicator,
  customIndicators
}) => {
  return (
    <div className="panel" style={{ marginBottom: '20px' }}>
      <div className="panel-title" style={{ marginBottom: '16px' }}>
        📊 Indicatori Economici FRED
      </div>
      
      {/* Controlli filtri in linea */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 200px auto auto', 
        gap: '12px', 
        alignItems: 'end' 
      }}>
        {/* Search */}
        <div>
          <label style={{ 
            color: '#cfcfcf', 
            fontSize: '13px', 
            fontWeight: '600', 
            display: 'block', 
            marginBottom: '4px' 
          }}>
            🔍 Ricerca
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              type="text"
              placeholder="Cerca indicatori esistenti o nuovi..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ 
                width: '100%',
                fontSize: '14px',
                padding: '8px 12px'
              }}
            />
            
            {/* Indicatore di ricerca */}
            {isSearching && (
              <div style={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid #66bb6a',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
            
            {/* Risultati ricerca esterna */}
            {(searchResults.length > 0 || searchError) && searchTerm && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'linear-gradient(180deg, #1a1a1a, #0f0f0f)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 8px 25px rgba(0,0,0,0.4)'
              }}>
                
                {searchError ? (
                  <div style={{
                    padding: '12px',
                    color: '#ffa726',
                    fontSize: '13px',
                    textAlign: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    ⚠️ {searchError}
                  </div>
                ) : (
                  <div style={{
                    padding: '8px',
                    color: '#66bb6a',
                    fontSize: '11px',
                    fontWeight: '600',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    🆕 {searchResults.length} nuovi indicatori trovati
                  </div>
                )}
                
                {searchResults.map(series => (
                  <div 
                    key={series.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => onAddCustomIndicator(series)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 187, 106, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#000',
                      flexShrink: 0
                    }}>
                      +
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        color: '#fff', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {series.title}
                      </div>
                      <div style={{ 
                        color: '#999', 
                        fontSize: '10px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {series.id} • Clicca per aggiungere
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Category filter */}
        <div>
          <label style={{ 
            color: '#cfcfcf', 
            fontSize: '13px', 
            fontWeight: '600', 
            display: 'block', 
            marginBottom: '4px' 
          }}>
            🏷️ Categoria
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px'
            }}
          >
            <option value="all">Tutte</option>
            {categories.map(categoryKey => {
              const config = getCategoryConfig(categoryKey);
              return (
                <option key={categoryKey} value={categoryKey}>
                  {config.icon} {config.name}
                </option>
              );
            })}
          </select>
        </div>
        
        {/* Refresh button */}
        <div>
          <Button 
            onClick={onRefresh} 
            style={{ 
              fontSize: '13px', 
              padding: '8px 12px',
              background: 'rgba(102, 187, 106, 0.1)',
              border: '1px solid rgba(102, 187, 106, 0.3)',
              color: '#66bb6a'
            }}
          >
            🔄 Refresh
          </Button>
        </div>
        
        {/* Quick stats */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#cfcfcf', fontSize: '13px', marginBottom: '2px' }}>
            Risultati
          </div>
          <div style={{ color: '#66bb6a', fontSize: '16px', fontWeight: '700' }}>
            {totalResults}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSearch;
