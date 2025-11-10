import React from 'react';
import Button from '../ui/Button.jsx';
import IndicatorCard from './IndicatorCard.jsx';
import { getCategoryConfig } from '../../utils/analysis/indicatorConfig.js';

/**
 * Componente per una sezione categoria con lista indicatori
 */
const CategorySection = ({
  categoryKey,
  indicators,
  isExpanded,
  onToggleCategory,
  expandedIndicators,
  onToggleIndicator,
  onStartCompare,
  macroData,
  macroService
}) => {
  const config = getCategoryConfig(categoryKey);
  
  if (indicators.length === 0) return null;

  return (
    <div className="panel">
      {/* Category header */}
      <div 
        className="category-header"
        onClick={() => onToggleCategory(categoryKey)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          cursor: 'pointer',
          borderRadius: '8px',
          background: isExpanded 
            ? `linear-gradient(135deg, ${config.color}15, ${config.color}08)`
            : 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${isExpanded ? config.color + '40' : 'rgba(255, 255, 255, 0.05)'}`,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = `linear-gradient(135deg, ${config.color}08, transparent)`;
            e.currentTarget.style.borderColor = config.color + '20';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
          }
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          boxShadow: isExpanded ? `0 4px 12px ${config.color}40` : 'none',
          transition: 'all 0.3s ease'
        }}>
          {config.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            color: config.color, 
            fontSize: '16px', 
            margin: '0 0 2px 0',
            fontWeight: '700'
          }}>
            {config.name}
          </h3>
          <p style={{ 
            color: '#cfcfcf', 
            fontSize: '12px', 
            margin: 0 
          }}>
            {indicators.length} indicatori
          </p>
        </div>
        <div style={{ 
          color: config.color, 
          fontSize: '20px',
          transition: 'transform 0.3s ease',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </div>
      </div>

      {/* Indicators list */}
      {isExpanded && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginTop: '12px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {indicators.map((indicator) => {
            const indicatorKey = `${categoryKey}_${indicator.id}`;
            const isIndicatorExpanded = expandedIndicators[indicatorKey];

            return (
              <IndicatorCard
                key={indicator.id}
                indicator={indicator}
                categoryKey={categoryKey}
                categoryName={config.name}
                isExpanded={isIndicatorExpanded}
                onToggleExpand={onToggleIndicator}
                onStartCompare={onStartCompare}
                macroData={macroData}
                macroService={macroService}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategorySection;
