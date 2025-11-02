/**
 * Monte Carlo Portfolio Generator - Genera portafogli basati su dati reali
 * 
 * Utilizza i dati di backtest reali degli asset per generare simulazioni
 * Monte Carlo intelligenti invece delle simulazioni sintetiche del backend
 */

/**
 * Genera pesi casuali normalizzati per un portafoglio
 * @param {number} numAssets - Numero di asset nel portafoglio
 * @param {Object} constraints - Vincoli sui pesi (min, max per asset)
 * @returns {Array} Array di pesi che sommano a 1
 */
export function generateRandomWeights(numAssets, constraints = {}) {
  const { minWeight = 0.02, maxWeight = 0.6 } = constraints;
  
  let weights = new Array(numAssets);
  let sum = 0;
  
  // Genera pesi casuali iniziali
  for (let i = 0; i < numAssets; i++) {
    weights[i] = Math.random() * (maxWeight - minWeight) + minWeight;
    sum += weights[i];
  }
  
  // Normalizza per sommare a 1
  weights = weights.map(w => w / sum);
  
  // Verifica vincoli finali
  weights = weights.map(w => Math.max(minWeight, Math.min(maxWeight, w)));
  
  // Ri-normalizza dopo applicazione vincoli
  sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / sum);
}

/**
 * Calcola le metriche di performance per un portafoglio dato
 * @param {Array} assetData - Dati storici degli asset
 * @param {Array} weights - Pesi del portafoglio
 * @returns {Object} Metriche calcolate
 */
export function calculatePortfolioMetrics(assetData, weights) {
  if (!assetData || assetData.length === 0 || !weights) {
    return { annualReturn: 0, volatility: 0, sharpeRatio: 0, maxDrawdown: 0 };
  }

  try {
    // Calcola rendimenti giornalieri del portafoglio
    const portfolioDailyReturns = calculatePortfolioDailyReturns(assetData, weights);
    
    // Calcola metriche
    const annualReturn = calculateAnnualReturn(portfolioDailyReturns);
    const volatility = calculateVolatility(portfolioDailyReturns);
    const sharpeRatio = volatility > 0 ? (annualReturn - 2.0) / volatility : 0; // Risk-free = 2%
    const maxDrawdown = calculateMaxDrawdown(portfolioDailyReturns);
    
    return {
      annualReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      portfolioDailyReturns
    };
  } catch (error) {
    console.warn('Errore nel calcolo metriche portafoglio:', error);
    return { annualReturn: 0, volatility: 0, sharpeRatio: 0, maxDrawdown: 0 };
  }
}

/**
 * Calcola i rendimenti giornalieri del portafoglio
 */
function calculatePortfolioDailyReturns(assetData, weights) {
  const numDays = assetData[0]?.daily?.length || 0;
  if (numDays === 0) return [];
  
  const portfolioReturns = [];
  
  for (let day = 1; day < numDays; day++) {
    let dailyReturn = 0;
    
    for (let assetIndex = 0; assetIndex < assetData.length; assetIndex++) {
      const asset = assetData[assetIndex];
      const weight = weights[assetIndex] || 0;
      
      if (asset.daily && asset.daily[day] && asset.daily[day-1]) {
        const prevValue = asset.daily[day-1].Value || asset.daily[day-1].value || 0;
        const currValue = asset.daily[day].Value || asset.daily[day].value || 0;
        
        if (prevValue > 0) {
          const assetReturn = (currValue - prevValue) / prevValue;
          dailyReturn += weight * assetReturn;
        }
      }
    }
    
    portfolioReturns.push(dailyReturn);
  }
  
  return portfolioReturns;
}

/**
 * Calcola il rendimento annualizzato
 */
function calculateAnnualReturn(dailyReturns) {
  if (dailyReturns.length === 0) return 0;
  
  const totalReturn = dailyReturns.reduce((total, dailyReturn) => {
    return total * (1 + dailyReturn);
  }, 1);
  
  const years = dailyReturns.length / 252; // 252 giorni lavorativi per anno
  return years > 0 ? (Math.pow(totalReturn, 1/years) - 1) * 100 : 0;
}

/**
 * Calcola la volatilità annualizzata
 */
function calculateVolatility(dailyReturns) {
  if (dailyReturns.length < 2) return 0;
  
  const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (dailyReturns.length - 1);
  
  return Math.sqrt(variance * 252) * 100; // Annualizzata
}

/**
 * Calcola il massimo drawdown
 */
function calculateMaxDrawdown(dailyReturns) {
  if (dailyReturns.length === 0) return 0;
  
  let cumulativeValue = 1;
  let peakValue = 1;
  let maxDrawdown = 0;
  
  for (const dailyReturn of dailyReturns) {
    cumulativeValue *= (1 + dailyReturn);
    peakValue = Math.max(peakValue, cumulativeValue);
    
    const drawdown = (peakValue - cumulativeValue) / peakValue;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  return maxDrawdown * 100;
}

/**
 * Genera portafogli Monte Carlo basati su dati reali
 * @param {Array} assetData - Dati di backtest degli asset
 * @param {number} numPortfolios - Numero di portafogli da generare (default: 5000)
 * @param {number} numSelected - Numero di portafogli da selezionare (default: 100)
 * @returns {Array} Array di portafogli selezionati
 */
export function generateRealMonteCarloPortfolios(assetData, numPortfolios = 5000, numSelected = 100) {
  console.log('🚀 Generazione Monte Carlo con dati reali...');
  console.log('Asset disponibili:', assetData?.length);
  console.log('Portafogli da generare:', numPortfolios);
  
  if (!assetData || assetData.length === 0) {
    console.warn('Nessun dato asset disponibile per Monte Carlo');
    return [];
  }

  const allPortfolios = [];
  const tickers = assetData.map(asset => asset.ticker || asset.symbol || `Asset${allPortfolios.length}`);
  
  // Genera tutti i portafogli
  for (let i = 0; i < numPortfolios; i++) {
    const weights = generateRandomWeights(assetData.length);
    const metrics = calculatePortfolioMetrics(assetData, weights);
    
    // Crea oggetto portafoglio compatibile con il formato esistente
    const portfolio = {
      Return: metrics.annualReturn,
      Volatility: metrics.volatility,
      Sharpe: metrics.sharpeRatio,
      MaxDrawdown: metrics.maxDrawdown,
      annual_volatility: metrics.volatility,
      cagr_approx: metrics.annualReturn,
      weights: weights.map((weight, index) => ({
        ticker: tickers[index],
        weight: weight
      })),
      _montecarlo_generated: true,
      _id: `mc_${i}`
    };
    
    allPortfolios.push(portfolio);
  }
  
  // Selezione intelligente dei migliori rappresentativi
  return selectRepresentativePortfolios(allPortfolios, numSelected);
}

/**
 * Seleziona portafogli rappresentativi secondo criteri strategici
 */
function selectRepresentativePortfolios(portfolios, numSelected = 100) {
  if (portfolios.length === 0) return [];
  
  const selected = [];
  
  // 1. Portafogli ottimali (6)
  const sortedBySharpe = [...portfolios].sort((a, b) => b.Sharpe - a.Sharpe);
  const sortedByReturn = [...portfolios].sort((a, b) => b.Return - a.Return);
  const sortedByVolatility = [...portfolios].sort((a, b) => a.Volatility - b.Volatility);
  
  // Migliori
  selected.push({ ...sortedBySharpe[0], _category: 'Max Sharpe' });
  selected.push({ ...sortedByReturn[0], _category: 'Max Return' });
  selected.push({ ...sortedByVolatility[0], _category: 'Min Volatility' });
  
  // Peggiori
  selected.push({ ...sortedBySharpe[sortedBySharpe.length - 1], _category: 'Min Sharpe' });
  selected.push({ ...sortedByReturn[sortedByReturn.length - 1], _category: 'Min Return' });
  selected.push({ ...sortedByVolatility[sortedByVolatility.length - 1], _category: 'Max Volatility' });
  
  // 2. Distribuzione uniforme per i restanti (94)
  const remaining = numSelected - 6;
  const step = Math.floor(portfolios.length / remaining);
  
  for (let i = 0; i < remaining; i++) {
    const index = Math.min(i * step, portfolios.length - 1);
    selected.push({ ...portfolios[index], _category: 'Distributed' });
  }
  
  console.log(`✅ Selezionati ${selected.length} portafogli rappresentativi`);
  return selected.slice(0, numSelected);
}

/**
 * Sostituisce le simulazioni sintetiche con quelle reali
 * @param {Object} frontierData - Dati originali dalla frontiera efficiente
 * @param {Array} assetData - Dati reali degli asset
 * @returns {Object} Dati aggiornati con simulazioni reali
 */
export function replaceWithRealSimulations(frontierData, assetData) {
  if (!frontierData || !assetData) {
    console.warn('Dati insufficienti per sostituire simulazioni');
    return frontierData;
  }
  
  console.log('🔄 Sostituzione simulazioni sintetiche con dati reali...');
  
  // Genera simulazioni reali
  const realSimulations = generateRealMonteCarloPortfolios(assetData);
  
  // Mantieni il resto dei dati originali ma sostituisci le simulazioni
  const updatedFrontierData = {
    ...frontierData,
    simulated_portfolios: realSimulations,
    simulated: realSimulations,
    simulations: realSimulations,
    _real_montecarlo: true,
    _generation_timestamp: new Date().toISOString()
  };
  
  console.log('✅ Simulazioni sostituite con successo');
  console.log('Simulazioni reali generate:', realSimulations.length);
  
  return updatedFrontierData;
}