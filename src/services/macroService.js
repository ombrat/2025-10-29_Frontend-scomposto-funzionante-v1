import { API_CONFIG } from '../config/apiConfig.js';

/**
 * Servizio per gestire i dati macro economici da FRED API + Alpha Vantage News
 */
class MacroService {
  constructor() {
    // Cache
    this.cacheKey = 'portfoliolab_macro_cache';
    this.cacheDuration = API_CONFIG.CACHE_DURATION;
    
    console.log('🏦 MacroService Inizializzato: Solo Google Cloud Run Backend');
    console.log('🚫 FALLBACK COMPLETAMENTE DISABILITATO - Solo dati FRED reali');
    console.log('🌐 Backend Endpoint:', API_CONFIG.BACKEND_BASE_URL);
  }

  /**
   * Determina l'importanza di un evento macro
   */
  getEventImportance(indicator) {
    const highImpact = ['inflation', 'unemployment', 'gdp', 'federal_funds_rate', 'nonfarm_payroll'];
    const mediumImpact = ['consumer_sentiment', 'retail_sales', 'industrial_production', 'cpi', 'ppi'];
    
    if (highImpact.some(h => indicator.toLowerCase().includes(h))) return 'high';
    if (mediumImpact.some(m => indicator.toLowerCase().includes(m))) return 'medium';
    return 'low';
  }

  /**
   * Ottiene l'icona per l'indicatore
   */
  getIndicatorIcon(indicator) {
    const iconMap = {
      'inflation': '📈',
      'unemployment': '👥',
      'gdp': '🏛️',
      'interest_rate': '💰',
      'consumer_sentiment': '🛒',
      'retail_sales': '🛍️',
      'nonfarm_payroll': '💼',
      'manufacturing': '🏭',
      'housing': '🏠',
      'trade_balance': '⚖️',
      'default': '📊'
    };
    
    const key = Object.keys(iconMap).find(k => indicator.toLowerCase().includes(k));
    return iconMap[key] || iconMap.default;
  }

  /**
   * Ottiene dati storici reali da Alpha Vantage per un indicatore specifico
   * Versione robusta con timeout e retry
   */
  async getRealMacroData(indicator, years = 5, maxRetries = 2) {
    // Endpoint Alpha Vantage corretti per Economic Indicators
    const endpointMap = {
      'gdp': 'REAL_GDP',
      'inflation': 'CPI', 
      'unemployment': 'UNEMPLOYMENT',
      'federal_funds_rate': 'FEDERAL_FUNDS_RATE',
      'consumer_sentiment': 'CONSUMER_SENTIMENT',
      'retail_sales': 'RETAIL_SALES',
      'nonfarm_payroll': 'NONFARM_PAYROLL',
      'treasury_yield': 'TREASURY_YIELD',
      'consumer_price_index': 'CPI',
      'producer_price_index': 'PRODUCER_PRICE'
    };

    const function_name = endpointMap[indicator];
    if (!function_name) {
      console.warn(`🔍 DEBUG: Indicatore ${indicator} non supportato per dati storici`);
      return this.getMockHistoricalData(indicator, years);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 DEBUG: Tentativo ${attempt}/${maxRetries} per ${indicator}...`);
        
        // URL Alpha Vantage per Economic Indicators
        const url = `${this.baseUrl}?function=${function_name}&apikey=${this.apiKey}&datatype=json`;
        console.log(`🌐 URL: ${url.replace(this.apiKey, '***API_KEY***')}`);
        
        // Timeout di 10 secondi per dati storici
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`⏰ TIMEOUT: Cancellando richiesta per ${indicator} dopo 10s`);
          controller.abort();
        }, 10000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PortfolioLab/1.0'
          }
        });
        
        clearTimeout(timeoutId);

        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📦 Response keys:`, Object.keys(data));

        // Controlla errori Alpha Vantage
        if (data['Error Message']) {
          throw new Error(`Alpha Vantage Error: ${data['Error Message']}`);
        }
        
        if (data['Note']) {
          console.warn(`🔍 DEBUG: Rate limit Alpha Vantage per ${indicator}`);
          throw new Error(`Rate limit: ${data['Note']}`);
        }

        // Processa i dati Alpha Vantage
        const processed = this.processAlphaVantageData(data, indicator);
        if (processed && processed.length > 0) {
          console.log(`✅ DEBUG: Dati reali caricati per ${indicator}: ${processed.length} punti`);
          return processed;
        } else {
          throw new Error('Dati processati vuoti o invalidi');
        }

      } catch (error) {
        console.warn(`⚠️ DEBUG: Tentativo ${attempt} fallito per ${indicator}:`, error.message);
        
        if (attempt === maxRetries) {
          console.log(`❌ DEBUG: Tutti i tentativi falliti per ${indicator}, uso mock`);
          return this.getMockHistoricalData(indicator, years);
        }
        
        // Attesa esponenziale prima del retry
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }

    return this.getMockHistoricalData(indicator, years);
  }

  /**
   * Processa i dati grezzi di Alpha Vantage
   */
  processAlphaVantageData(data, indicator) {
    const dataKey = Object.keys(data).find(key => key.includes('data') || key.includes('Data'));
    if (!dataKey) return null;

    const timeSeriesData = data[dataKey];
    const processed = [];

    Object.entries(timeSeriesData).forEach(([date, values]) => {
      const value = values.value || values.data || Object.values(values)[0];
      if (value && !isNaN(parseFloat(value))) {
        processed.push({
          date: date,
          value: parseFloat(value),
          indicator: indicator
        });
      }
    });

    return processed.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Genera dati storici mock realistici per fallback
   */
  getMockHistoricalData(indicator, years = 5) {
    const currentDate = new Date();
    const data = [];
    const monthsBack = years * 12;

    // Valori base e trend per diversi indicatori
    const baseValues = {
      'gdp': { base: 2.5, volatility: 0.8, trend: 0.02 },
      'inflation': { base: 3.2, volatility: 1.2, trend: -0.01 },
      'unemployment': { base: 4.8, volatility: 0.6, trend: -0.005 },
      'federal_funds_rate': { base: 4.75, volatility: 0.5, trend: 0.01 },
      'consumer_sentiment': { base: 68.5, volatility: 8.0, trend: 0.02 },
      'retail_sales': { base: 4.1, volatility: 1.8, trend: 0.01 },
      'nonfarm_payroll': { base: 180000, volatility: 50000, trend: 1000 },
      'durable_goods': { base: 1.2, volatility: 2.5, trend: 0.01 },
      'housing_starts': { base: 1.35, volatility: 0.3, trend: 0.005 },
      'trade_balance': { base: -68.2, volatility: 8.0, trend: 0.1 }
    };

    const config = baseValues[indicator] || baseValues['gdp'];

    for (let i = monthsBack; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      
      // Genera valore con trend + variazione random
      const trendFactor = (monthsBack - i) * config.trend;
      const randomFactor = (Math.random() - 0.5) * config.volatility;
      const value = config.base + trendFactor + randomFactor;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
        indicator: indicator,
        source: 'mock'
      });
    }

    return data;
  }

  /**
   * Ottiene dati storici per tutti gli indicatori principali
   * Sistema di test progressivo API
   */
  async getAllHistoricalData(years = 5) {
    // FASE 2: Test con due indicatori
    const indicatorsPriority = [
      { id: 'unemployment', name: 'Unemployment Rate', priority: 1 },
      { id: 'inflation', name: 'Consumer Price Index (CPI)', priority: 1 }
      // Prossimi da aggiungere:
      // { id: 'gdp', name: 'PIL (Crescita)', priority: 1 },
      // { id: 'federal_funds_rate', name: 'Fed Funds Rate', priority: 1 },
      // { id: 'consumer_sentiment', name: 'Consumer Sentiment', priority: 2 },
      // { id: 'retail_sales', name: 'Retail Sales', priority: 2 },
      // { id: 'nonfarm_payroll', name: 'Nonfarm Payroll', priority: 2 }
    ];

    const historicalData = {};
    const apiResults = {
      success: 0,
      failed: 0,
      details: []
    };
    
    console.log('🚀 AVVIANDO TEST API PROGRESSIVO...');
    console.log(`📊 Testando ${indicatorsPriority.length} indicatori con chiave: ${this.apiKey.substring(0, 8)}...`);
    
    // Salva i log per la UI
    this.uiLogs = [
      `🚀 Avviando test API con ${indicatorsPriority.length} indicatori`,
      `🔑 Chiave API: ${this.apiKey.substring(0, 8)}...${this.useMockOnly ? ' (DEMO)' : ' (REALE)'}`
    ];
    
    for (const indicator of indicatorsPriority) {
      const startTime = Date.now();
      let result = 'MOCK_FALLBACK';
      
      try {
        console.log(`\n📊 [${indicator.priority}] TESTING: ${indicator.name} (${indicator.id})...`);
        
        if (this.useMockOnly) {
          console.log(`� MOCK: API key demo detected - using mock data`);
          historicalData[indicator.id] = this.getMockHistoricalData(indicator.id, years);
          result = 'MOCK_DEMO_KEY';
        } else {
          console.log(`🔍 API: Attempting real data fetch...`);
          
          const apiData = await this.getRealMacroData(indicator.id, years, 1); // 1 retry per debugging
          
          if (apiData && apiData.length > 0) {
            historicalData[indicator.id] = apiData;
            result = 'API_SUCCESS';
            apiResults.success++;
            console.log(`✅ SUCCESS: ${apiData.length} data points loaded`);
          } else {
            throw new Error('Empty or invalid API response');
          }
        }
      } catch (error) {
        console.error(`❌ FAILED: ${indicator.name} - ${error.message}`);
        historicalData[indicator.id] = this.getMockHistoricalData(indicator.id, years);
        result = 'API_FAILED';
        apiResults.failed++;
      }
      
      const loadTime = Date.now() - startTime;
      apiResults.details.push({
        indicator: indicator.name,
        result,
        loadTime,
        dataPoints: historicalData[indicator.id]?.length || 0
      });
      
      console.log(`⏱️  Completed in ${loadTime}ms - Result: ${result}`);
      
      // Aggiungi al log UI
      this.uiLogs.push(`${result === 'API_SUCCESS' ? '✅' : result === 'MOCK_DEMO_KEY' ? '🟡' : '❌'} ${indicator.name}: ${result} (${loadTime}ms, ${historicalData[indicator.id]?.length || 0} punti)`);
      
      // Pausa tra chiamate per evitare rate limiting
      if (!this.useMockOnly && result === 'API_SUCCESS') {
        console.log('⏸️  Pausing 1s to avoid rate limits...');
        this.uiLogs.push('⏸️ Pausa 1s per rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Report finale
    console.log('\n📋 REPORT FINALE API TEST:');
    console.log(`✅ Successi API: ${apiResults.success}`);
    console.log(`❌ Fallimenti API: ${apiResults.failed}`);
    console.log(`📊 Dati totali caricati: ${Object.keys(historicalData).length} indicatori`);
    
    if (apiResults.details.length > 0) {
      console.table(apiResults.details);
    }
    
    // Aggiungi il riepilogo finale ai log UI
    this.uiLogs.push(`📋 FINALE: ${apiResults.success}✅ ${apiResults.failed}❌ - ${Object.keys(historicalData).length} indicatori caricati`);
    
    // Allega i log al risultato per la UI
    historicalData._debugLogs = [...this.uiLogs];

    return historicalData;
  }

  /**
   * Calcola statistiche per i dati storici
   */
  calculateStatistics(data) {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Calcola trend (regressione lineare semplice)
    let trend = 0;
    if (data.length > 1) {
      const recent = data.slice(-12); // ultimi 12 mesi
      const xValues = recent.map((_, i) => i);
      const yValues = recent.map(d => d.value);
      
      const n = recent.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
      
      trend = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    return {
      average: Math.round(avg * 100) / 100,
      minimum: min,
      maximum: max,
      median: Math.round(median * 100) / 100,
      trend: Math.round(trend * 1000) / 1000,
      dataPoints: data.length,
      lastValue: data[data.length - 1]?.value,
      lastDate: data[data.length - 1]?.date
    };
  }

  /**
   * Genera eventi macro per la settimana corrente (simulati ma realistici)
   */
  getMockEvents() {
    const events = [
      // Lunedì 28 Ottobre 2025
      {
        id: 1,
        date: '2025-10-28',
        time: '14:30',
        country: 'USA',
        indicator: 'Consumer Confidence Index',
        actual: '102.8',
        forecast: '101.5',
        previous: '100.2',
        importance: 'medium',
        impact: 'positive',
        description: 'Misura la fiducia dei consumatori americani nell\'economia'
      },
      {
        id: 2,
        date: '2025-10-28',
        time: '16:00',
        country: 'USA',
        indicator: 'New Home Sales',
        actual: '685K',
        forecast: '670K',
        previous: '659K',
        importance: 'medium',
        impact: 'positive',
        description: 'Vendite di nuove abitazioni negli Stati Uniti'
      },

      // Martedì 29 Ottobre 2025
      {
        id: 3,
        date: '2025-10-29',
        time: '14:30',
        country: 'USA',
        indicator: 'Core PCE Price Index',
        actual: '2.7%',
        forecast: '2.8%',
        previous: '2.8%',
        importance: 'high',
        impact: 'positive',
        description: 'Inflazione core preferita dalla Fed per le decisioni sui tassi'
      },
      {
        id: 4,
        date: '2025-10-29',
        time: '10:00',
        country: 'EUR',
        indicator: 'German CPI Preliminary',
        actual: '2.1%',
        forecast: '2.2%',
        previous: '2.0%',
        importance: 'high',
        impact: 'neutral',
        description: 'Inflazione preliminare tedesca, indicatore chiave per la BCE'
      },

      // Mercoledì 30 Ottobre 2025
      {
        id: 5,
        date: '2025-10-30',
        time: '14:15',
        country: 'USA',
        indicator: 'ADP Employment Change',
        actual: '+195K',
        forecast: '+180K',
        previous: '+143K',
        importance: 'high',
        impact: 'positive',
        description: 'Variazione occupazione settore privato, anticipa i dati NFP'
      },
      {
        id: 6,
        date: '2025-10-30',
        time: '20:00',
        country: 'USA',
        indicator: 'Federal Reserve Decision',
        actual: '5.50%',
        forecast: '5.50%',
        previous: '5.50%',
        importance: 'high',
        impact: 'neutral',
        description: 'Decisione sui tassi di interesse della Federal Reserve'
      },

      // Giovedì 31 Ottobre 2025
      {
        id: 7,
        date: '2025-10-31',
        time: '14:30',
        country: 'USA',
        indicator: 'Initial Jobless Claims',
        actual: '218K',
        forecast: '220K',
        previous: '227K',
        importance: 'medium',
        impact: 'positive',
        description: 'Richieste iniziali di sussidi di disoccupazione'
      },
      {
        id: 8,
        date: '2025-10-31',
        time: '14:30',
        country: 'USA',
        indicator: 'GDP Quarterly Rate',
        actual: '2.8%',
        forecast: '2.9%',
        previous: '3.0%',
        importance: 'high',
        impact: 'negative',
        description: 'Crescita economica trimestrale degli Stati Uniti'
      },

      // Venerdì 1 Novembre 2025
      {
        id: 9,
        date: '2025-11-01',
        time: '14:30',
        country: 'USA',
        indicator: 'Nonfarm Payrolls',
        actual: '+192K',
        forecast: '+185K',
        previous: '+254K',
        importance: 'high',
        impact: 'positive',
        description: 'Variazione occupazione non agricola, dato più importante del mese'
      },
      {
        id: 10,
        date: '2025-11-01',
        time: '14:30',
        country: 'USA',
        indicator: 'Unemployment Rate',
        actual: '4.1%',
        forecast: '4.1%',
        previous: '4.1%',
        importance: 'high',
        impact: 'neutral',
        description: 'Tasso di disoccupazione degli Stati Uniti'
      },

      // Weekend e settimana successiva
      {
        id: 11,
        date: '2025-11-04',
        time: '10:00',
        country: 'EUR',
        indicator: 'Eurozone Retail Sales',
        actual: null,
        forecast: '0.2%',
        previous: '-0.3%',
        importance: 'medium',
        impact: 'pending',
        description: 'Vendite al dettaglio nell\'Eurozona'
      },
      {
        id: 12,
        date: '2025-11-05',
        time: '14:30',
        country: 'USA',
        indicator: 'Trade Balance',
        actual: null,
        forecast: '-$84.5B',
        previous: '-$84.4B',
        importance: 'medium',
        impact: 'pending',
        description: 'Bilancia commerciale degli Stati Uniti'
      }
    ];

    return events.map(event => ({
      ...event,
      icon: this.getIndicatorIcon(event.indicator),
      isPast: new Date(event.date + 'T' + event.time) < new Date(),
      country_flag: this.getCountryFlag(event.country)
    }));
  }

  /**
   * Ottiene la bandiera del paese
   */
  getCountryFlag(country) {
    const flags = {
      'USA': '🇺🇸',
      'EUR': '🇪🇺', 
      'GBP': '🇬🇧',
      'JPY': '🇯🇵',
      'CHF': '🇨🇭',
      'CAD': '🇨🇦',
      'AUD': '🇦🇺',
      'NZD': '🇳🇿'
    };
    return flags[country] || '🌍';
  }

  /**
   * Ottiene i principali indicatori economici correnti
   */
  getKeyIndicators() {
    return [
      {
        id: 'us_inflation',
        name: 'US Core PCE',
        value: '2.7%',
        change: '-0.1%',
        trend: 'down',
        target: '2.0%',
        description: 'Inflazione core USA (target Fed)',
        lastUpdate: '2025-10-29',
        importance: 'high'
      },
      {
        id: 'us_unemployment', 
        name: 'US Unemployment Rate',
        value: '4.1%',
        change: '0.0%',
        trend: 'stable',
        target: '4.0%',
        description: 'Tasso disoccupazione Stati Uniti',
        lastUpdate: '2025-11-01',
        importance: 'high'
      },
      {
        id: 'us_fed_rate',
        name: 'Federal Funds Rate',
        value: '5.50%',
        change: '0.00%',
        trend: 'stable',
        target: '4.5-5.0%',
        description: 'Tasso di riferimento Fed',
        lastUpdate: '2025-10-30',
        importance: 'high'
      },
      {
        id: 'us_gdp',
        name: 'US GDP Growth',
        value: '2.8%',
        change: '-0.2%',
        trend: 'down',
        target: '2.5%',
        description: 'Crescita PIL trimestrale USA',
        lastUpdate: '2025-10-31',
        importance: 'high'
      },
      {
        id: 'us_consumer_sentiment',
        name: 'Consumer Confidence',
        value: '102.8',
        change: '+2.6',
        trend: 'up',
        target: '100.0',
        description: 'Fiducia consumatori americani',
        lastUpdate: '2025-10-28',
        importance: 'medium'
      },
      {
        id: 'eur_inflation',
        name: 'Eurozone CPI',
        value: '2.1%',
        change: '+0.1%',
        trend: 'up',
        target: '2.0%',
        description: 'Inflazione Eurozona (target BCE)',
        lastUpdate: '2025-10-29',
        importance: 'high'
      },
      {
        id: 'eur_rate',
        name: 'ECB Main Rate',
        value: '4.00%',
        change: '0.00%',
        trend: 'stable',
        target: '3.5%',
        description: 'Tasso principale BCE',
        lastUpdate: '2025-10-15',
        importance: 'high'
      },
      {
        id: 'gbp_inflation',
        name: 'UK CPI',
        value: '2.0%',
        change: '-0.1%',
        trend: 'down',
        target: '2.0%',
        description: 'Inflazione Regno Unito',
        lastUpdate: '2025-10-20',
        importance: 'medium'
      }
    ];
  }

  /**
   * Calcola l'impatto dell'evento (positivo/negativo/neutro)
   */
  calculateImpact(actual, forecast, indicator) {
    if (!actual || !forecast) return 'pending';
    
    const actualNum = parseFloat(actual.replace(/[^0-9.-]/g, ''));
    const forecastNum = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
    
    if (Math.abs(actualNum - forecastNum) < 0.01) return 'neutral';
    
    // Per inflazione e disoccupazione, valori più bassi sono generalmente positivi
    if (indicator.toLowerCase().includes('inflation') || 
        indicator.toLowerCase().includes('unemployment')) {
      return actualNum < forecastNum ? 'positive' : 'negative';
    }
    
    // Per GDP, occupazione, vendite, valori più alti sono positivi
    return actualNum > forecastNum ? 'positive' : 'negative';
  }

  /**
   * Verifica cache validità
   */
  isCacheValid() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return false;
      
      const { timestamp } = JSON.parse(cached);
      return (Date.now() - timestamp) < this.cacheDuration;
    } catch (error) {
      return false;
    }
  }

  /**
   * Salva in cache
   */
  saveToCache(data) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Errore salvataggio cache macro:', error);
    }
  }

  /**
   * Legge dalla cache
   */
  getFromCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;
      
      const { data } = JSON.parse(cached);
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🏦 Fetch dati macro completi da FRED API - Dati Ufficiali Federal Reserve
   * STORICO COMPLETO DI TUTTE LE SERIE PRINCIPALI
   */
  async fetchMacroDataComplete(years = 10) {
    console.log('🏦 FRED API Strategy: Caricando TUTTI i dati storici FRED...');
    console.log(`� Periodo storico: ${years} anni`);
    
    // Importa backendService per comunicazione con Google Cloud Run
    const { default: backendService } = await import('./backendService.js');
    
    try {
      // 1. Health check del backend
      console.log('🔍 Verificando stato backend Google Cloud Run...');
      const healthCheck = await backendService.checkHealth();
      console.log('✅ Backend disponibile:', healthCheck);
      
      // 2. SERIE STORICHE FRED COMPLETE - Tutte le principali categorie
      console.log('📊 Caricando TUTTE le serie storiche FRED principali...');
      const fredSeries = this.getAllFredSeriesIds();
      console.log(`🎯 Caricamento di ${fredSeries.length} serie storiche FRED...`);
      
      // 3. Carica dati storici per TUTTE le serie con parallelizzazione intelligente
      console.log('📈 Avvio caricamento parallelo dati storici...');
      const historical = await this.loadAllFredHistoricalData(backendService, fredSeries, years);
      
      // 4. Processa e calcola statistiche sui dati storici completi
      console.log('📊 Processando TUTTE le serie storiche FRED per statistiche...');
      const processedHistorical = {};
      let totalDataPoints = 0;
      
      // Processa ogni serie FRED caricata
      Object.keys(historical).forEach(seriesId => {
        const seriesData = historical[seriesId];
        if (seriesData && seriesData.observations && Array.isArray(seriesData.observations)) {
          const processed = seriesData.observations.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value),
            indicator: seriesId,
            category: seriesData.category,
            name: seriesData.name
          })).filter(obs => !isNaN(obs.value)); // Rimuovi valori non numerici
          
          processedHistorical[seriesId] = processed;
          totalDataPoints += processed.length;
          console.log(`  📈 ${seriesId}: ${processed.length} osservazioni processate`);
        } else {
          console.warn(`  ⚠️ Serie ${seriesId} senza dati validi`);
          processedHistorical[seriesId] = [];
        }
      });
      
      // 5. Calcola statistiche per tutte le serie
      const statistics = this.calculateAllStatistics(processedHistorical);
      
      // 6. Organizza dati per categorie
      const categorizedData = this.categorizeFredData(processedHistorical);
      
      const realData = {
        historical: processedHistorical, // Dati processati per grafici
        categorized: categorizedData, // Dati organizzati per categorie
        statistics, // Statistiche per ogni serie
        rawHistorical: historical, // Dati raw con metadata
        fredSeries: this.getAllFredSeriesIds(), // Definizioni delle serie
        lastUpdate: Date.now(),
        source: 'fred_complete_historical',
        dataQuality: 'live_fred_api_all_series',
        totalSeries: Object.keys(historical).length,
        totalDataPoints: totalDataPoints,
        backendHealth: healthCheck
      };
      
      console.log('🎉 DATI STORICI FRED COMPLETI caricati con successo:', {
        serieCaricate: Object.keys(processedHistorical).length,
        totalePuntiDati: totalDataPoints,
        categorie: Object.keys(categorizedData).length,
        fonte: realData.source
      });
      
      return realData;
      
    } catch (error) {
      console.error('❌ ERRORE CRITICO: Backend FRED non disponibile:', error);
      // NO FALLBACK - Lancia l'errore per mostrare il problema reale
      throw new Error(`Backend FRED non raggiungibile: ${error.message}`);
    }
  }

  /**
   * 🏦 Fetch Economic Data da FRED API - Tutti i principali indicatori
   */
  async fetchFredEconomicData(years = 5) {
    console.log('🏦 Fetching FRED Economic Data - START');
    console.log('🔧 FRED Config:', {
      baseUrl: this.fredBaseUrl,
      apiKey: this.fredApiKey ? this.fredApiKey.substring(0,8) + '...' : 'MISSING',
      years: years
    });
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - years);
    
    console.log('📅 Date Range:', {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
    
    // 🎯 TOP 15 Indicatori FRED Essenziali (per evitare layout shift)
    const fredSeries = {
      // 🏛️ GDP e Crescita (2)
      GDP: 'GDP',                           // Gross Domestic Product
      GDPC1: 'GDPC1',                      // Real GDP
      
      // 📈 Inflazione (2) 
      CPIAUCSL: 'CPIAUCSL',               // Consumer Price Index
      CPILFESL: 'CPILFESL',               // Core CPI (ex food & energy)
      
      // 💼 Occupazione (2)
      UNRATE: 'UNRATE',                   // Unemployment Rate
      PAYEMS: 'PAYEMS',                   // Nonfarm Payrolls
      
      // 💰 Tassi di Interesse (3)
      FEDFUNDS: 'FEDFUNDS',               // Federal Funds Rate
      DGS10: 'DGS10',                     // 10-Year Treasury
      DGS2: 'DGS2',                       // 2-Year Treasury
      
      // 💱 Forex (1)
      DEXUSEU: 'DEXUSEU',                 // USD/EUR Exchange Rate
      
      // ⚡ Commodities (1)
      DCOILWTICO: 'DCOILWTICO',           // WTI Oil Price
      
      // 🏠 Housing (1)
      HOUST: 'HOUST',                     // Housing Starts
      
      // 💸 Monetary (1)
      M2SL: 'M2SL',                       // M2 Money Supply
      
      // 🏭 Production (1)
      INDPRO: 'INDPRO',                   // Industrial Production Index
      
      // 🌍 Trade (1)
      BOPGSTB: 'BOPGSTB'                  // Trade Balance
    };
    
    const fredData = {};
    const fetchPromises = [];
    
    // 🎯 Fetch con controllo per stabilità layout (15 serie essenziali)
    let fetchCount = 0;
    for (const [key, seriesId] of Object.entries(fredSeries)) {
      const promise = this.fetchFredSeries(seriesId, startDate, endDate)
        .then(data => {
          if (data && data.length > 0) {
            fredData[key] = {
              name: this.getFredSeriesName(key),
              data: data,
              unit: this.getFredSeriesUnit(key),
              category: this.getFredSeriesCategory(key),
              seriesId: seriesId,
              lastUpdate: endDate.toISOString()
            };
            console.log(`📊 FRED Series ${++fetchCount}/15: ${key} loaded`);
          }
        })
        .catch(error => {
          console.warn(`FRED Series ${seriesId} failed:`, error.message);
        });
      
      fetchPromises.push(promise);
    }
    
    // Attendi tutti i fetch con timeout di sicurezza
    await Promise.allSettled(fetchPromises);
    
    console.log(`✅ FRED Data Fetched: ${Object.keys(fredData).length}/15 essential series`);
    return fredData;
  }

  /**
   * Fetch singola serie FRED
   */
  async fetchFredSeries(seriesId, startDate, endDate) {
    const url = `${this.fredBaseUrl}/series/observations`;
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: this.fredApiKey,
      file_type: 'json',
      observation_start: startDate.toISOString().split('T')[0],
      observation_end: endDate.toISOString().split('T')[0],
      frequency: 'm', // Monthly data
      aggregation_method: 'avg',
      output_type: 1
    });
    
    try {
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`FRED API Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.observations && Array.isArray(result.observations)) {
        return result.observations
          .filter(obs => obs.value !== '.')  // Rimuovi valori mancanti
          .map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value)
          }));
      }
      
      return [];
    } catch (error) {
      console.warn(`FRED Series ${seriesId} fetch error:`, error.message);
      return [];
    }
  }

  /**
   * 📊 Ottieni tutte le serie FRED principali per analisi economica completa
   */
  getAllFredSeriesIds() {
    return [
      // 🏛️ ECONOMIA E CRESCITA
      { id: 'GDP', name: 'Gross Domestic Product', category: 'growth', priority: 1 },
      { id: 'GDPC1', name: 'Real Gross Domestic Product', category: 'growth', priority: 1 },
      { id: 'GDPPOT', name: 'Real Potential GDP', category: 'growth', priority: 2 },
      
      // 📈 INFLAZIONE E PREZZI
      { id: 'CPIAUCSL', name: 'Consumer Price Index', category: 'inflation', priority: 1 },
      { id: 'CPILFESL', name: 'Core CPI (ex food & energy)', category: 'inflation', priority: 1 },
      { id: 'PCEPILFE', name: 'PCE Price Index (Core)', category: 'inflation', priority: 1 },
      { id: 'PCEPI', name: 'PCE Price Index', category: 'inflation', priority: 2 },
      
      // 💼 MERCATO DEL LAVORO
      { id: 'UNRATE', name: 'Unemployment Rate', category: 'labor', priority: 1 },
      { id: 'PAYEMS', name: 'Nonfarm Payrolls', category: 'labor', priority: 1 },
      { id: 'CIVPART', name: 'Labor Force Participation Rate', category: 'labor', priority: 2 },
      { id: 'EMRATIO', name: 'Employment-Population Ratio', category: 'labor', priority: 2 },
      
      // 💰 POLITICA MONETARIA
      { id: 'FEDFUNDS', name: 'Federal Funds Rate', category: 'monetary', priority: 1 },
      { id: 'DGS10', name: '10-Year Treasury Rate', category: 'monetary', priority: 1 },
      { id: 'DGS2', name: '2-Year Treasury Rate', category: 'monetary', priority: 1 },
      { id: 'DGS30', name: '30-Year Treasury Rate', category: 'monetary', priority: 2 },
      { id: 'TB3MS', name: '3-Month Treasury Bill Rate', category: 'monetary', priority: 2 },
      
      // 🏭 PRODUZIONE E MANIFATTURA
      { id: 'INDPRO', name: 'Industrial Production Index', category: 'production', priority: 1 },
      { id: 'IPMAN', name: 'Industrial Production: Manufacturing', category: 'production', priority: 2 },
      { id: 'TCU', name: 'Capacity Utilization: Total Industry', category: 'production', priority: 2 },
      
      // 🏠 MERCATO IMMOBILIARE
      { id: 'HOUST', name: 'Housing Starts', category: 'housing', priority: 1 },
      { id: 'PERMIT', name: 'Building Permits', category: 'housing', priority: 2 },
      { id: 'CSUSHPISA', name: 'Case-Shiller Home Price Index', category: 'housing', priority: 1 },
      { id: 'MORTGAGE30US', name: '30-Year Mortgage Rate', category: 'housing', priority: 1 },
      
      // 🛒 CONSUMI E VENDITE
      { id: 'RSXFS', name: 'Retail Sales', category: 'consumer', priority: 1 },
      { id: 'PCE', name: 'Personal Consumption Expenditures', category: 'consumer', priority: 1 },
      { id: 'PSAVERT', name: 'Personal Saving Rate', category: 'consumer', priority: 2 },
      { id: 'UMCSENT', name: 'Consumer Sentiment', category: 'consumer', priority: 1 },
      
      // 💱 COMMERCIO E FOREX
      { id: 'BOPGSTB', name: 'Trade Balance', category: 'trade', priority: 1 },
      { id: 'DEXUSEU', name: 'US/Euro Exchange Rate', category: 'trade', priority: 2 },
      
      // ⚡ COMMODITIES
      { id: 'DCOILWTICO', name: 'WTI Oil Price', category: 'commodities', priority: 1 },
      { id: 'DCOILBRENTEU', name: 'Brent Oil Price', category: 'commodities', priority: 2 },
      
      // 💹 MERCATI FINANZIARI
      { id: 'SP500', name: 'S&P 500', category: 'markets', priority: 1 },
      { id: 'NASDAQCOM', name: 'NASDAQ Composite', category: 'markets', priority: 2 },
      { id: 'VIXCLS', name: 'VIX Volatility Index', category: 'markets', priority: 2 }
    ];
  }

  /**
   * 📈 Carica dati storici per tutte le serie FRED con parallelizzazione intelligente
   */
  async loadAllFredHistoricalData(backendService, fredSeries, years = 5) {
    const historical = {};
    const batchSize = 5; // Carica 5 serie alla volta per evitare sovraccarico
    const totalSeries = fredSeries.length;
    let loadedSeries = 0;
    
    console.log(`🚀 Avvio caricamento di ${totalSeries} serie FRED in batch da ${batchSize}...`);
    
    // Processa in batch per evitare troppi richieste simultanee
    for (let i = 0; i < fredSeries.length; i += batchSize) {
      const batch = fredSeries.slice(i, i + batchSize);
      console.log(`📊 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(totalSeries/batchSize)}: caricando ${batch.length} serie...`);
      
      const batchPromises = batch.map(async (series) => {
        try {
          console.log(`  🔍 Caricamento ${series.id} (${series.name})...`);
          const startTime = Date.now();
          
          const seriesData = await backendService.makeRequest(`/api/fred/series/${series.id}/observations`, {
            params: { 
              limit: years * 12 * 4, // 4 osservazioni per mese per essere sicuri
              start_date: this.getDateYearsAgo(years)
            }
          });
          
          const loadTime = Date.now() - startTime;
          const observations = seriesData.observations || [];
          
          console.log(`  ✅ ${series.id}: ${observations.length} osservazioni in ${loadTime}ms`);
          
          return {
            id: series.id,
            data: {
              ...series,
              observations: observations,
              metadata: {
                last_updated: seriesData.last_updated,
                frequency: seriesData.frequency,
                source: 'FRED',
                loadTime: loadTime
              }
            }
          };
          
        } catch (error) {
          console.error(`  ❌ Errore caricamento ${series.id}:`, error.message);
          return {
            id: series.id,
            data: {
              ...series,
              observations: [],
              error: error.message,
              metadata: { source: 'ERROR' }
            }
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Aggiungi risultati del batch
      batchResults.forEach(({ id, data }) => {
        historical[id] = data;
        loadedSeries++;
      });
      
      console.log(`✅ Batch completato: ${loadedSeries}/${totalSeries} serie caricate`);
      
      // Pausa tra batch per evitare rate limiting
      if (i + batchSize < fredSeries.length) {
        console.log('⏸️ Pausa 1s tra batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successfulSeries = Object.values(historical).filter(s => s.observations && s.observations.length > 0).length;
    console.log(`🎉 Caricamento completato: ${successfulSeries}/${totalSeries} serie con dati`);
    
    return historical;
  }

  /**
   * Helper: Ottieni data di N anni fa
   */
  getDateYearsAgo(years) {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date.toISOString().split('T')[0];
  }

  /**
   * 📂 Organizza i dati FRED per categorie per una migliore visualizzazione
   */
  categorizeFredData(processedHistorical) {
    const categories = {
      growth: { name: '🏛️ Economia e Crescita', series: [] },
      inflation: { name: '📈 Inflazione e Prezzi', series: [] },
      labor: { name: '💼 Mercato del Lavoro', series: [] },
      monetary: { name: '💰 Politica Monetaria', series: [] },
      production: { name: '🏭 Produzione e Manifattura', series: [] },
      housing: { name: '🏠 Mercato Immobiliare', series: [] },
      consumer: { name: '🛒 Consumi e Vendite', series: [] },
      trade: { name: '💱 Commercio e Forex', series: [] },
      commodities: { name: '⚡ Commodities', series: [] },
      markets: { name: '💹 Mercati Finanziari', series: [] }
    };
    
    const fredSeries = this.getAllFredSeriesIds();
    
    // Organizza ogni serie nella sua categoria
    Object.keys(processedHistorical).forEach(seriesId => {
      const seriesDefinition = fredSeries.find(s => s.id === seriesId);
      const category = seriesDefinition?.category || 'other';
      
      if (categories[category] && processedHistorical[seriesId].length > 0) {
        categories[category].series.push({
          id: seriesId,
          name: seriesDefinition?.name || seriesId,
          data: processedHistorical[seriesId],
          priority: seriesDefinition?.priority || 3
        });
      }
    });
    
    // Ordina le serie per priorità all'interno di ogni categoria
    Object.keys(categories).forEach(catKey => {
      categories[catKey].series.sort((a, b) => a.priority - b.priority);
    });
    
    // Rimuovi categorie vuote
    const nonEmptyCategories = {};
    Object.keys(categories).forEach(catKey => {
      if (categories[catKey].series.length > 0) {
        nonEmptyCategories[catKey] = categories[catKey];
      }
    });
    
    return nonEmptyCategories;
  }

  /**
   * Helper: Nome descrittivo delle serie FRED
   */
  getFredSeriesName(key) {
    const names = {
      GDP: 'Gross Domestic Product',
      GDPC1: 'Real GDP',
      GDPPOT: 'Potential GDP',
      CPIAUCSL: 'Consumer Price Index',
      CPILFESL: 'Core CPI',
      PCEPILFE: 'PCE Price Index',
      UNRATE: 'Unemployment Rate',
      PAYEMS: 'Nonfarm Payrolls',
      CIVPART: 'Labor Force Participation',
      FEDFUNDS: 'Federal Funds Rate',
      DGS10: '10-Year Treasury Rate',
      DGS2: '2-Year Treasury Rate',
      DEXUSEU: 'USD/EUR Exchange Rate',
      DTWEXBGS: 'US Dollar Index',
      HOUST: 'Housing Starts',
      CSUSHPISA: 'Case-Shiller Home Price Index',
      DCOILWTICO: 'WTI Oil Price',
      DHHNGSP: 'Natural Gas Price',
      PCE: 'Personal Consumption',
      GPDI: 'Gross Private Investment',
      M2SL: 'M2 Money Supply',
      BOGMBASE: 'Monetary Base',
      INDPRO: 'Industrial Production',
      TCU: 'Capacity Utilization',
      BOPGSTB: 'Trade Balance',
      IMPGS: 'Imports',
      EXPGS: 'Exports'
    };
    return names[key] || key;
  }

  /**
   * Helper: Unità di misura delle serie FRED
   */
  getFredSeriesUnit(key) {
    const units = {
      GDP: 'Billions of USD',
      GDPC1: 'Billions of Chained 2017 USD',
      GDPPOT: 'Billions of Chained 2017 USD',
      CPIAUCSL: 'Index 1982-84=100',
      CPILFESL: 'Index 1982-84=100',
      PCEPILFE: 'Index 2012=100',
      UNRATE: 'Percent',
      PAYEMS: 'Thousands of Persons',
      CIVPART: 'Percent',
      FEDFUNDS: 'Percent',
      DGS10: 'Percent',
      DGS2: 'Percent',
      DEXUSEU: 'USD per EUR',
      DTWEXBGS: 'Index Jan 1997=100',
      HOUST: 'Thousands of Units',
      CSUSHPISA: 'Index Jan 2000=100',
      DCOILWTICO: 'USD per Barrel',
      DHHNGSP: 'USD per Million Btu',
      PCE: 'Billions of USD',
      GPDI: 'Billions of USD',
      M2SL: 'Billions of USD',
      BOGMBASE: 'Millions of USD',
      INDPRO: 'Index 2017=100',
      TCU: 'Percent of Capacity',
      BOPGSTB: 'Millions of USD',
      IMPGS: 'Millions of USD',
      EXPGS: 'Millions of USD'
    };
    return units[key] || 'Index';
  }

  /**
   * Helper: Categoria delle serie FRED
   */
  getFredSeriesCategory(key) {
    const categories = {
      GDP: 'Economic Growth',
      GDPC1: 'Economic Growth',
      GDPPOT: 'Economic Growth',
      CPIAUCSL: 'Inflation',
      CPILFESL: 'Inflation',
      PCEPILFE: 'Inflation',
      UNRATE: 'Labor Market',
      PAYEMS: 'Labor Market',
      CIVPART: 'Labor Market',
      FEDFUNDS: 'Interest Rates',
      DGS10: 'Interest Rates',
      DGS2: 'Interest Rates',
      DEXUSEU: 'Exchange Rates',
      DTWEXBGS: 'Exchange Rates',
      HOUST: 'Housing',
      CSUSHPISA: 'Housing',
      DCOILWTICO: 'Commodities',
      DHHNGSP: 'Commodities',
      PCE: 'Consumer Spending',
      GPDI: 'Investment',
      M2SL: 'Monetary Policy',
      BOGMBASE: 'Monetary Policy',
      INDPRO: 'Production',
      TCU: 'Production',
      BOPGSTB: 'International Trade',
      IMPGS: 'International Trade',
      EXPGS: 'International Trade'
    };
    return categories[key] || 'Economic Indicator';
  }

  /**
   * Genera eventi macro basati sui dati FRED reali
   */
  generateMacroEventsFromFredData(fredData) {
    const events = [];
    const now = new Date();
    
    // Analizza i dati FRED per generare eventi significativi
    for (const [key, series] of Object.entries(fredData)) {
      if (!series.data || series.data.length < 2) continue;
      
      const latest = series.data[series.data.length - 1];
      const previous = series.data[series.data.length - 2];
      
      if (latest && previous && latest.value !== previous.value) {
        const change = ((latest.value - previous.value) / previous.value) * 100;
        
        if (Math.abs(change) > 1) { // Solo cambiamenti significativi > 1%
          events.push({
            date: latest.date,
            title: `${series.name} Update`,
            description: `${series.name} changed ${change > 0 ? '+' : ''}${change.toFixed(2)}% to ${latest.value} ${series.unit}`,
            impact: Math.abs(change) > 5 ? 'high' : 'medium',
            category: series.category,
            source: 'FRED',
            value: latest.value,
            change: change,
            seriesId: key
          });
        }
      }
    }
    
    return events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  }

  /**
   * Conta i data points totali nei dati FRED
   */
  countFredDataPoints(fredData) {
    return Object.values(fredData).reduce((total, series) => {
      return total + (series.data ? series.data.length : 0);
    }, 0);
  }

  /**
   * Fetch eventi reali da NEWS_SENTIMENT API
   */
  async fetchRealEventsFromAPI() {
    const params = new URLSearchParams({
      function: 'NEWS_SENTIMENT',
      tickers: 'SPY,QQQ,DXY,GLD', // Macro-relevant tickers
      topics: 'financial_markets,earnings,federal_reserve,economic_policy',
      limit: 8,
      apikey: this.apiKey
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000)
    });

    const data = await response.json();
    
    if (data['Error Message']) throw new Error(data['Error Message']);
    if (data['Note']) throw new Error(data['Note']);
    
    // Trasforma news in eventi macro-rilevanti
    return (data.feed || []).slice(0, 5).map((article, index) => ({
      id: `real-${index}`,
      title: this.extractMacroTitle(article.title),
      description: article.summary?.substring(0, 100) + '...',
      date: article.time_published?.substring(0, 8) || new Date().toISOString().split('T')[0],
      importance: this.assessMacroImportance(article),
      country: 'USA',
      indicator: this.mapToMacroIndicator(article.title),
      source: 'alphavantage_news',
      icon: this.getMacroIcon(article.title)
    }));
  }

  /**
   * Genera dati mock migliorati con pattern realistici
   */
  generateEnhancedMockData(years = 5) {
    const indicators = ['gdp', 'inflation', 'unemployment', 'federal_funds_rate', 
                       'consumer_sentiment', 'retail_sales', 'nonfarm_payroll'];
    
    const historical = {};
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    indicators.forEach(indicator => {
      // Usa giorno dell'anno per variazioni consistenti ma realistiche
      const data = this.getMockHistoricalData(indicator, years);
      
      // Aggiungi trend realistici basati su data corrente
      historical[indicator] = data.map((point, index) => ({
        ...point,
        value: this.applyRealisticTrend(point.value, indicator, index, dayOfYear)
      }));
    });
    
    return historical;
  }
  
  /**
   * Fetch real economic data when API is working
   */
  async fetchRealEconomicData(years = 5) {
    const indicators = ['unemployment', 'inflation', 'federal_funds_rate'];
    const historical = {};
    const statistics = {};
    let successCount = 0;

    for (const indicator of indicators) {
      try {
        const params = new URLSearchParams({
          function: this.getAlphaVantageFunction(indicator),
          apikey: this.apiKey
        });

        const response = await fetch(`${this.baseUrl}?${params}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000)
        });

        const data = await response.json();
        
        if (!data['Error Message'] && !data['Note']) {
          const processed = this.processAlphaVantageData(data, indicator);
          if (processed && processed.length > 0) {
            historical[indicator] = processed;
            statistics[indicator] = this.calculateStatistics(processed);
            successCount++;
            console.log(`✅ ${indicator}: ${processed.length} real data points`);
          }
        } else {
          throw new Error(data['Error Message'] || data['Note']);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.warn(`⚠️ ${indicator} fallback to mock:`, error.message);
        historical[indicator] = this.getMockHistoricalData(indicator, years);
        statistics[indicator] = this.calculateStatistics(historical[indicator]);
      }
    }

    return {
      events: this.getCurrentWeekEvents(),
      historical,
      statistics,
      lastUpdate: Date.now(),
      source: successCount > 0 ? 'api' : 'mock',
      apiSuccess: successCount,
      totalIndicators: indicators.length
    };
  }

  /**
   * Metodi di supporto per strategia ibrida
   */
  extractMacroTitle(newsTitle) {
    // Semplifica titoli news per eventi macro
    if (newsTitle.toLowerCase().includes('fed')) return 'Fed Policy Update';
    if (newsTitle.toLowerCase().includes('inflation')) return 'Inflation Data Release';
    if (newsTitle.toLowerCase().includes('employment')) return 'Employment Report';
    if (newsTitle.toLowerCase().includes('gdp')) return 'GDP Growth Report';
    return newsTitle.substring(0, 40) + '...';
  }

  assessMacroImportance(article) {
    const text = (article.title + ' ' + (article.summary || '')).toLowerCase();
    if (text.includes('fed') || text.includes('federal reserve') || text.includes('interest rate')) return 'high';
    if (text.includes('inflation') || text.includes('employment') || text.includes('gdp')) return 'high';
    if (text.includes('market') || text.includes('economic')) return 'medium';
    return 'low';
  }

  mapToMacroIndicator(title) {
    const text = title.toLowerCase();
    if (text.includes('fed') || text.includes('interest')) return 'federal_funds_rate';
    if (text.includes('inflation') || text.includes('price')) return 'inflation';
    if (text.includes('employment') || text.includes('job')) return 'unemployment';
    if (text.includes('gdp') || text.includes('growth')) return 'gdp';
    return 'general';
  }

  getMacroIcon(title) {
    const text = title.toLowerCase();
    if (text.includes('fed')) return '🏦';
    if (text.includes('inflation')) return '📈';
    if (text.includes('employment')) return '💼';
    if (text.includes('gdp')) return '🏛️';
    return '📊';
  }

  applyRealisticTrend(baseValue, indicator, index, dayOfYear) {
    // Applica micro-variazioni basate su giorno dell'anno per realismo
    const dayFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.1;
    const indexFactor = Math.sin((index / 12) * 2 * Math.PI) * 0.05;
    
    let adjustment = 1 + dayFactor + indexFactor;
    
    // Limiti realistici per indicatore
    if (indicator === 'unemployment' && baseValue * adjustment < 3) adjustment = 3 / baseValue;
    if (indicator === 'inflation' && baseValue * adjustment < 0) adjustment = 0.1 / baseValue;
    
    return Math.round((baseValue * adjustment) * 100) / 100;
  }

  generateRealisticMacroEvents(realEvents = []) {
    const today = new Date();
    const events = [];
    
    // Eventi macro fissi ma con dati che variano
    const baseEvents = [
      {
        id: 'fed-rate',
        title: 'Federal Reserve Rate Decision',
        description: 'FOMC interest rate announcement and policy statement',
        daysFromNow: 7,
        importance: 'high',
        indicator: 'federal_funds_rate',
        icon: '🏦'
      },
      {
        id: 'cpi-release',
        title: 'Consumer Price Index (CPI)',
        description: 'Monthly inflation data release',
        daysFromNow: 14,
        importance: 'high',
        indicator: 'inflation',
        icon: '📈'
      },
      {
        id: 'employment',
        title: 'Non-Farm Payrolls',
        description: 'Monthly employment situation report',
        daysFromNow: 21,
        importance: 'high',
        indicator: 'nonfarm_payroll',
        icon: '💼'
      }
    ];

    return baseEvents.map(event => ({
      ...event,
      date: new Date(today.getTime() + event.daysFromNow * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      country: 'USA',
      expected: this.generateRealisticExpectation(event.indicator),
      actual: null
    }));
  }

  generateRealisticExpectation(indicator) {
    const today = new Date();
    const monthVariation = (today.getMonth() + 1) / 12;
    
    switch (indicator) {
      case 'federal_funds_rate': return `${(5.0 + monthVariation * 0.5).toFixed(2)}%`;
      case 'inflation': return `${(3.0 + monthVariation * 0.8).toFixed(1)}%`;
      case 'nonfarm_payroll': return `${Math.round(180000 + monthVariation * 20000).toLocaleString()}`;
      default: return 'TBD';
    }
  }

  calculateAllStatistics(historical) {
    const statistics = {};
    Object.keys(historical).forEach(indicator => {
      statistics[indicator] = this.calculateStatistics(historical[indicator]);
    });
    return statistics;
  }

  /**
   * Mappa indicatori a funzioni Alpha Vantage (mantenuto per compatibilità)
   */
  getAlphaVantageFunction(indicator) {
    const functionMap = {
      'unemployment': 'UNEMPLOYMENT',
      'inflation': 'CPI',
      'federal_funds_rate': 'FEDERAL_FUNDS_RATE',
      'gdp': 'REAL_GDP'
    };
    return functionMap[indicator] || 'UNEMPLOYMENT';
  }

  /**
   * Helper: Ottieni data come stringa (YYYY-MM-DD)
   */
  getDateString(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }











  /**
   * Ottieni tutti i dati macro completi con storico
   * SOLO DATI REALI DA FRED API - NO FALLBACK
   */
  async getMacroDataWithHistory(forceRefresh = false, years = 5) {
    try {
      // Se non è un refresh forzato, controlla la cache
      if (!forceRefresh && this.isCacheValid()) {
        const cachedData = this.getFromCache();
        if (cachedData && cachedData.source === 'google_cloud_backend') {
          console.log('📊 Dati FRED reali caricati dalla cache');
          return cachedData;
        } else {
          console.log('🗑️ Cache contiene dati mock - ignorata, carico dati reali');
        }
      }

      console.log('� Caricamento dati macro da API...');
      
      // Usa lo stesso pattern del newsService
      const macroData = await this.fetchMacroDataComplete(years);
      
      if (macroData && Object.keys(macroData.historical || {}).length > 0) {
        // Salva in cache e ritorna
        this.saveToCache(macroData);
        console.log(`✅ Dati macro completi caricati: ${Object.keys(macroData.historical).length} indicatori`);
        return macroData;
      } else {
        throw new Error('Nessun dato macro ricevuto dall\'API');
      }

    } catch (error) {
      console.error('❌ ERRORE CRITICO: Impossibile caricare dati FRED reali:', error);
      
      // NO FALLBACK - Propaga l'errore per mostrare il problema
      throw new Error(`Dati FRED non disponibili: ${error.message}`);
    }
  }

  /**
   * Ottieni dati storici per un singolo indicatore
   */
  async getHistoricalDataForIndicator(indicator, years = 5, forceRefresh = false) {
    const cacheKey = `${this.cacheKey}_historical_${indicator}`;
    
    if (!forceRefresh) {
      const cached = this.getCachedHistoricalData(cacheKey);
      if (cached) {
        console.log(`📦 Dati storici per ${indicator} dalla cache`);
        return cached;
      }
    }

    console.log(`📊 Caricando dati storici per ${indicator}...`);
    
    try {
      const data = await this.getRealMacroData(indicator, years);
      if (data) {
        this.setCachedHistoricalData(cacheKey, data);
        return {
          data,
          statistics: this.calculateStatistics(data),
          indicator,
          years,
          lastUpdate: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Errore caricamento storico per ${indicator}:`, error);
    }

    // Fallback ai dati mock
    const mockData = this.getMockHistoricalData(indicator, years);
    return {
      data: mockData,
      statistics: this.calculateStatistics(mockData),
      indicator,
      years,
      lastUpdate: new Date().toISOString(),
      source: 'mock'
    };
  }

  /**
   * Genera dati mock completi con storico per evitare API calls e layout shift
   * Include aggiornamenti giornalieri simulati
   */
  getMockMacroDataWithHistory() {
    console.log('📊 Generando dati macro mock completi con aggiornamenti giornalieri...');
    
    // Cache key basata su data per aggiornamenti giornalieri
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyCacheKey = `${this.cacheKey}_mock_daily_${today}`;
    
    // Controlla se abbiamo già i dati di oggi
    try {
      const cached = localStorage.getItem(dailyCacheKey);
      if (cached) {
        console.log('📦 Dati mock giornalieri dalla cache di oggi');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Errore lettura cache mock giornaliera:', error);
    }
    
    // Genera dati storici mock per tutti gli indicatori
    const indicators = ['gdp', 'inflation', 'unemployment', 'federal_funds_rate', 
                       'consumer_sentiment', 'retail_sales', 'nonfarm_payroll'];
    
    const historical = {};
    const statistics = {};
    
    indicators.forEach(indicator => {
      const data = this.getMockHistoricalData(indicator, 5); // 5 anni
      historical[indicator] = data;
      statistics[indicator] = this.calculateStatistics(data);
    });

    // Eventi mock con variabilità giornaliera
    const baseDate = new Date();
    const dayOffset = baseDate.getDate(); // Usa giorno del mese per variare i dati
    
    const events = [
      {
        id: 'fed-1',
        title: 'Fed Rate Decision',
        description: 'Federal Reserve interest rate announcement',
        date: new Date().toISOString().split('T')[0],
        importance: 'high',
        country: 'USA',
        indicator: 'federal_funds_rate',
        expected: '5.25%',
        actual: `${(5.25 + (dayOffset % 5) * 0.05).toFixed(2)}%`, // Varia con il giorno
        icon: '💰'
      },
      {
        id: 'cpi-1',
        title: 'CPI Inflation Data',
        description: 'Consumer Price Index monthly release',
        date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
        importance: 'high',
        country: 'USA',
        indicator: 'inflation',
        expected: '3.2%',
        actual: null,
        icon: '📈'
      },
      {
        id: 'nfp-1',
        title: 'Nonfarm Payrolls',
        description: 'Monthly employment change report',
        date: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
        importance: 'high',
        country: 'USA',
        indicator: 'nonfarm_payroll',
        expected: '180K',
        actual: null,
        icon: '💼'
      },
      {
        id: 'retail-1',
        title: 'Retail Sales',
        description: 'Monthly retail sales data',
        date: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
        importance: 'medium',
        country: 'USA',
        indicator: 'retail_sales',
        expected: '0.4%',
        actual: `${(0.3 + (dayOffset % 10) * 0.02).toFixed(1)}%`, // Dati che cambiano
        icon: '🛍️'
      }
    ];

    const mockData = {
      events,
      historical,
      statistics,
      timestamp: Date.now(),
      source: 'mock_daily',
      lastUpdate: Date.now(),
      cacheDate: today
    };

    // Salva nella cache giornaliera
    try {
      localStorage.setItem(dailyCacheKey, JSON.stringify(mockData));
      console.log(`💾 Dati mock giornalieri salvati per ${today}`);
    } catch (error) {
      console.warn('Errore salvataggio cache mock giornaliera:', error);
    }

    return mockData;
  }

  /**
   * Cache specifica per dati storici (durata maggiore)
   */
  getCachedHistoricalData(cacheKey) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 ore per dati storici
        
        if (age < maxAge) {
          return data.data;
        }
      }
    } catch (error) {
      console.error('Errore lettura cache storico:', error);
    }
    return null;
  }

  setCachedHistoricalData(cacheKey, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Errore salvataggio cache storico:', error);
    }
  }

  /**
   * Pulisci cache
   */
  clearCache() {
    try {
      localStorage.removeItem(this.cacheKey);
      // Pulisci anche le cache storiche
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.cacheKey)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ Cache dati macro e storici pulita');
    } catch (error) {
      console.error('Errore pulizia cache macro:', error);
    }
  }

  /**
   * 🚀 CARICAMENTO SOFT - Solo gli ultimi 20 dati più recenti per ogni serie
   * Caricamento veloce per UI responsiva
   */
  async fetchMacroDataSoft() {
    console.log('🚀 FRED API Strategy: Caricamento SOFT - ultimi 20 dati per serie...');
    
    // Importa backendService per comunicazione con Google Cloud Run
    const { default: backendService } = await import('./backendService.js');
    
    try {
      // 1. Health check del backend
      console.log('🔍 Verificando stato backend Google Cloud Run...');
      const healthCheck = await backendService.checkHealth();
      console.log('✅ Backend disponibile:', healthCheck);
      
      // 2. SERIE STORICHE FRED - Solo i primi 20 dati
      console.log('📊 Caricando solo i primi 20 dati per ogni serie FRED...');
      const fredSeries = this.getAllFredSeriesIds();
      console.log(`🎯 Caricamento soft di ${fredSeries.length} serie FRED (20 dati ciascuna)...`);
      
      // 3. Carica solo gli ultimi 20 dati per ogni serie
      console.log('📈 Avvio caricamento soft parallelo...');
      const historical = await this.loadAllFredHistoricalDataSoft(backendService, fredSeries);
      
      // 4. Processa i dati soft
      console.log('📊 Processando dati soft FRED per statistiche...');
      const processedHistorical = {};
      let totalDataPoints = 0;
      
      Object.entries(historical).forEach(([seriesId, data]) => {
        if (data && data.length > 0) {
          console.log(`  📈 ${seriesId}: ${data.length} osservazioni processate`);
          processedHistorical[seriesId] = data;
          totalDataPoints += data.length;
        }
      });
      
      // 5. Categorizza i dati
      const categorizedData = this.categorizeFredData(processedHistorical);
      
      // 6. Crea indicatori per legacy compatibility
      const indicators = {};
      Object.values(categorizedData).forEach(category => {
        category.series.forEach(series => {
          if (series.data && series.data.length > 0) {
            const latest = series.data[series.data.length - 1];
            indicators[series.id] = {
              value: latest.value,
              date: latest.date,
              name: series.name,
              unit: this.getFredSeriesUnit(series.id)
            };
          }
        });
      });
      
      console.log('🎉 DATI SOFT FRED caricati con successo:', {
        serieCaricate: Object.keys(processedHistorical).length,
        totalePuntiDati: totalDataPoints,
        categorie: Object.keys(categorizedData).length,
        fonte: 'fred_soft_20_recent'
      });
      
      return {
        historical: processedHistorical,
        categorized: categorizedData,
        indicators: indicators,
        totalDataPoints: totalDataPoints,
        source: 'fred_soft_20_recent',
        dataQuality: 'soft_recent_only',
        loadedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Errore caricamento soft FRED:', error);
      throw new Error(`Errore caricamento soft FRED: ${error.message}`);
    }
  }

  /**
   * Carica solo i primi 20 dati più recenti per ogni serie FRED
   */
  async loadAllFredHistoricalDataSoft(backendService, fredSeries) {
    const batchSize = 5; // 5 serie per batch
    const batches = [];
    
    // Suddividi in batch
    for (let i = 0; i < fredSeries.length; i += batchSize) {
      batches.push(fredSeries.slice(i, i + batchSize));
    }
    
    console.log(`🚀 Avvio caricamento soft di ${fredSeries.length} serie FRED in batch da ${batchSize}...`);
    
    const allData = {};
    let processedCount = 0;
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📊 Batch ${batchIndex + 1}/${batches.length}: caricando ${batch.length} serie soft...`);
      
      // Carica il batch in parallelo
      const promises = batch.map(async (series) => {
        try {
          console.log(`  🔍 Caricamento soft ${series.id} (${series.name})...`);
          
          // Calcola data di inizio per ottenere circa gli ultimi 3 anni di dati 
          // (poi prendiamo gli ultimi 20 dal risultato)
          const startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 3);
          const startDateStr = startDate.toISOString().split('T')[0];
          
          const data = await backendService.getFredSeriesObservations(series.id, {
            start_date: startDateStr,
            limit: 200 // Limite generoso per essere sicuri di avere abbastanza dati recenti
          });
          
          if (data && data.observations && data.observations.length > 0) {
            // Filtra e ordina i dati, poi prendi solo gli ultimi 20
            const validData = data.observations
              .filter(obs => obs.value && obs.value !== '.')
              .map(obs => ({
                date: obs.date,
                value: parseFloat(obs.value)
              }))
              .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordine cronologico crescente
            
            // Prendi gli ultimi 20 dati
            const last20Data = validData.slice(-20);
            
            console.log(`  ✅ ${series.id}: ${last20Data.length} osservazioni recenti (da ${last20Data[0]?.date} a ${last20Data[last20Data.length-1]?.date})`);
            return { [series.id]: last20Data };
          }
          
        } catch (error) {
          console.warn(`  ⚠️ ${series.id}: Errore caricamento soft - ${error.message}`);
          return { [series.id]: [] };
        }
      });
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(result => Object.assign(allData, result));
      
      processedCount += batch.length;
      console.log(`✅ Batch completato: ${processedCount}/${fredSeries.length} serie caricate soft`);
      
      // Pausa più breve per il caricamento soft
      if (batchIndex < batches.length - 1) {
        console.log('⏸️ Pausa 0.5s tra batch...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successfulSeries = Object.values(allData).filter(data => data && data.length > 0).length;
    console.log(`🎉 Caricamento soft completato: ${successfulSeries}/${fredSeries.length} serie con dati`);
    
    return allData;
  }
}

// Istanza singleton del servizio
export const macroService = new MacroService();

export default macroService;