/**
 * Configurazioni per categorie e indicatori economici
 */

// Configurazione categorie - stile backtest
export const getCategoryConfig = (categoryKey) => {
  const configs = {
    'gdp_growth': { name: 'PIL e Crescita', icon: '🏛️', color: '#66bb6a' },
    'employment': { name: 'Occupazione', icon: '👥', color: '#42a5f5' },
    'inflation': { name: 'Inflazione', icon: '📈', color: '#ef5350' },
    'monetary_policy': { name: 'Politica Monetaria', icon: '💰', color: '#ffa726' },
    'consumer': { name: 'Consumi', icon: '🛒', color: '#ab47bc' },
    'housing': { name: 'Immobiliare', icon: '🏠', color: '#5c6bc0' },
    'manufacturing': { name: 'Manifatturiero', icon: '🏭', color: '#78909c' },
    'trade': { name: 'Commercio', icon: '⚖️', color: '#26a69a' },
    'financial': { name: 'Mercati', icon: '💹', color: '#ec407a' },
    'fiscal': { name: 'Politica Fiscale', icon: '🏛️', color: '#ff7043' }
  };
  
  return configs[categoryKey] || {
    name: categoryKey, icon: '📊', color: '#999'
  };
};

// Configurazione per singolo indicatore (colore, nome, categoria)
export const getIndicatorConfig = (indicatorId, macroData, macroService) => {
  if (!indicatorId) return { id: null, name: '', color: '#999', category: null };

  // Cerca nei dati già caricati
  if (macroData && macroData.data) {
    for (const [categoryKey, categoryData] of Object.entries(macroData.data)) {
      const found = (categoryData.indicators || []).find(i => i.id === indicatorId || i.key === indicatorId);
      if (found) {
        return {
          id: found.id || indicatorId,
          name: found.name || found.title || found.id || indicatorId,
          color: getCategoryConfig(categoryKey).color,
          category: categoryKey,
          description: found.description || ''
        };
      }
    }
  }

  // Fallback: cerca nella lista ufficiale fornita da MacroService
  try {
    const official = macroService.getOfficialFredIndicators();
    for (const [categoryKey, indicators] of Object.entries(official)) {
      const f = indicators.find(i => i.id === indicatorId);
      if (f) {
        return {
          id: f.id,
          name: f.name || f.title || f.id,
          color: getCategoryConfig(categoryKey).color,
          category: categoryKey,
          description: f.description || ''
        };
      }
    }
  } catch (e) {
    // ignore and fallback to default
  }

  // Default generico
  return { id: indicatorId, name: indicatorId, color: '#999', category: null };
};
