import { API_CONFIG } from '../config/apiConfig.js';

/**
 * 🏦 Yahoo Finance Service
 * Servizio per recuperare dati finanziari completi da Yahoo Finance tramite backend proxy
 */
class YahooFinanceService {
  constructor() {
    this.backendUrl = API_CONFIG.BACKTEST_BACKEND_BASE_URL; // Usa il backend di backtest per Yahoo Finance
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minuti per dati finanziari
    
    console.log('🏦 YahooFinanceService inizializzato');
    console.log('🌐 Backend URL:', this.backendUrl);
  }

  /**
   * 🔍 Cerca ticker/ISIN su Yahoo Finance
   */
  async searchTicker(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      console.log(`🔍 Ricerca ticker per: "${query}"`);
      
      const response = await fetch(`${this.backendUrl}/api/search_tickers?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Errore ricerca ticker: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      console.log(`✅ Trovati ${results.length} risultati per "${query}"`);
      
      return results.map(item => ({
        ticker: item.ticker,
        name: item.name,
        displayName: `${item.ticker} - ${item.name}`
      }));

    } catch (error) {
      console.error('❌ Errore ricerca ticker:', error);
      throw error;
    }
  }

  /**
   * 📊 Ottieni info complete su un ticker da Yahoo Finance
   * Questo metodo farà una chiamata a yfinance.Ticker(symbol).info
   */
  async getTickerInfo(ticker) {
    if (!ticker) {
      throw new Error('Ticker non fornito');
    }

    // Controlla cache
    const cacheKey = `info_${ticker}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Dati ticker ${ticker} dalla cache`);
      return cached;
    }

    try {
      console.log(`📊 Caricamento dati completi per ${ticker}...`);
      
      const response = await fetch(`${this.backendUrl}/api/ticker_info?ticker=${encodeURIComponent(ticker)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Errore caricamento dati: ${response.status}`);
      }

      const data = await response.json();
      
      // Salva in cache
      this._saveToCache(cacheKey, data);
      
      console.log(`✅ Dati caricati per ${ticker}:`, Object.keys(data).length, 'campi');
      return data;

    } catch (error) {
      console.error(`❌ Errore caricamento dati per ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * 📈 Ottieni storico prezzi per un ticker
   */
  async getHistoricalData(ticker, period = '1y', interval = '1d') {
    if (!ticker) {
      throw new Error('Ticker non fornito');
    }

    const cacheKey = `history_${ticker}_${period}_${interval}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Storico ${ticker} dalla cache`);
      return cached;
    }

    try {
      console.log(`📈 Caricamento storico per ${ticker} (${period}, ${interval})...`);
      
      const response = await fetch(
        `${this.backendUrl}/api/ticker_history?ticker=${encodeURIComponent(ticker)}&period=${period}&interval=${interval}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Errore caricamento storico: ${response.status}`);
      }

      const data = await response.json();
      
      this._saveToCache(cacheKey, data);
      
      console.log(`✅ Storico caricato per ${ticker}:`, data.length, 'data points');
      return data;

    } catch (error) {
      console.error(`❌ Errore caricamento storico per ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * 📊 Ottieni financial statements storici (Income Statement, Balance Sheet, Cash Flow)
   * NOTA: yfinance fornisce questi dati tramite .financials, .balance_sheet, .cashflow
   * Per ora, usiamo i dati aggregati da .info. In futuro, il backend può esporre endpoint separati.
   * 
   * @param {string} ticker - Simbolo del ticker
   * @param {string} statementType - 'income', 'balance', 'cashflow'
   * @param {string} period - 'quarterly' o 'annual'
   */
  async getFinancialStatements(ticker, statementType = 'income', period = 'quarterly') {
    if (!ticker) {
      throw new Error('Ticker non fornito');
    }

    // Per ora, restituiamo i dati da .info che contengono valori TTM (Trailing Twelve Months)
    // In produzione, il backend dovrebbe esporre endpoint come:
    // /api/ticker_financials?ticker=AAPL&type=income&period=quarterly
    
    console.log(`📊 Richiesta financial statements per ${ticker} (${statementType}, ${period})`);
    console.log('⚠️  Storico trimestrale/annuale richiede endpoint backend aggiuntivi.');
    console.log('📝 Per ora, mostro dati TTM (Trailing Twelve Months) da ticker_info');
    
    try {
      // Recupera i dati base
      const info = await this.getTickerInfo(ticker);
      const metrics = this.extractKeyMetrics(info);
      
      // Simula una risposta storica con i dati TTM disponibili
      // In produzione, questi dati verranno da yfinance quarterly_financials, ecc.
      return {
        ticker: ticker,
        statementType: statementType,
        period: period,
        data: this._mockHistoricalFinancials(metrics, statementType),
        note: 'Dati TTM. Per storico completo, serve backend con endpoint .quarterly_financials'
      };
      
    } catch (error) {
      console.error(`❌ Errore recupero financial statements per ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * 🏗️ Mock dei dati storici finanziari (placeholder fino a implementazione backend)
   * In produzione, questi dati verranno da yfinance.Ticker().quarterly_financials, ecc.
   */
  _mockHistoricalFinancials(metrics, statementType) {
    const currentDate = new Date();
    const quarters = [];
    
    // Genera 8 trimestri fittizi (2 anni di storico)
    for (let i = 7; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - (i * 3));
      const quarter = `Q${Math.floor((date.getMonth() / 3) + 1)} ${date.getFullYear()}`;
      
      quarters.push({
        period: quarter,
        date: date.toISOString().split('T')[0],
        // Dati simulati - in produzione verranno dal backend
        data: this._getStatementMockData(metrics, statementType, i)
      });
    }
    
    return quarters;
  }

  _getStatementMockData(metrics, statementType, quarterIndex) {
    // Variazione casuale per simulare crescita/decrescita
    const variance = 1 + ((Math.random() - 0.5) * 0.15); // ±7.5%
    
    switch (statementType) {
      case 'income':
        return {
          revenue: metrics.totalRevenue ? (metrics.totalRevenue / 4) * variance : null,
          grossProfit: metrics.grossProfits ? (metrics.grossProfits / 4) * variance : null,
          operatingIncome: metrics.operatingIncome ? (metrics.operatingIncome / 4) * variance : null,
          netIncome: metrics.netIncome ? (metrics.netIncome / 4) * variance : null,
          eps: metrics.trailingEps ? (metrics.trailingEps / 4) * variance : null,
        };
      
      case 'balance':
        return {
          totalAssets: metrics.totalAssets ? metrics.totalAssets * variance : null,
          totalLiabilities: metrics.totalLiabilities ? metrics.totalLiabilities * variance : null,
          totalEquity: metrics.stockholdersEquity ? metrics.stockholdersEquity * variance : null,
          cash: metrics.totalCash ? metrics.totalCash * variance : null,
          totalDebt: metrics.totalDebt ? metrics.totalDebt * variance : null,
        };
      
      case 'cashflow':
        return {
          operatingCashFlow: metrics.operatingCashflow ? (metrics.operatingCashflow / 4) * variance : null,
          freeCashFlow: metrics.freeCashflow ? (metrics.freeCashflow / 4) * variance : null,
          capitalExpenditures: metrics.freeCashflow && metrics.operatingCashflow 
            ? ((metrics.operatingCashflow - metrics.freeCashflow) / 4) * variance 
            : null,
        };
      
      default:
        return {};
    }
  }

  /**
   * 💰 Formatta valori finanziari per display
   */
  formatValue(value, type = 'number') {
    if (value === null || value === undefined || value === 'N/A') {
      return 'N/A';
    }

    try {
      switch (type) {
        case 'currency':
          return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(value);

        case 'large_number':
          // Formatta grandi numeri (es. Market Cap)
          if (value >= 1e12) {
            return `$${(value / 1e12).toFixed(2)}T`;
          } else if (value >= 1e9) {
            return `$${(value / 1e9).toFixed(2)}B`;
          } else if (value >= 1e6) {
            return `$${(value / 1e6).toFixed(2)}M`;
          } else if (value >= 1e3) {
            return `$${(value / 1e3).toFixed(2)}K`;
          }
          return `$${value.toFixed(2)}`;

        case 'percent':
          return `${(value * 100).toFixed(2)}%`;

        case 'ratio':
          return value.toFixed(2);

        default:
          return value.toLocaleString('it-IT');
      }
    } catch (error) {
      return value.toString();
    }
  }

  /**
   * 📋 Estrae metriche chiave da ticker info (COMPLETO - Tutti i dati di bilancio)
   */
  extractKeyMetrics(info) {
    if (!info) return null;

    return {
      // Informazioni Base
      symbol: info.symbol || 'N/A',
      shortName: info.shortName || info.longName || 'N/A',
      longName: info.longName || info.shortName || 'N/A',
      sector: info.sector || 'N/A',
      industry: info.industry || 'N/A',
      website: info.website || null,
      country: info.country || 'N/A',
      fullTimeEmployees: info.fullTimeEmployees || null,
      
      // Prezzi
      currentPrice: info.currentPrice || info.regularMarketPrice || null,
      previousClose: info.previousClose || info.regularMarketPreviousClose || null,
      open: info.open || info.regularMarketOpen || null,
      dayLow: info.dayLow || info.regularMarketDayLow || null,
      dayHigh: info.dayHigh || info.regularMarketDayHigh || null,
      
      // Volumi
      volume: info.volume || info.regularMarketVolume || null,
      averageVolume: info.averageVolume || info.averageVolume10days || null,
      
      // Capitalizzazione
      marketCap: info.marketCap || null,
      enterpriseValue: info.enterpriseValue || null,
      
      // Metriche di Valutazione
      trailingPE: info.trailingPE || null,
      forwardPE: info.forwardPE || null,
      pegRatio: info.pegRatio || null,
      priceToBook: info.priceToBook || null,
      priceToSales: info.priceToSalesTrailing12Months || null,
      enterpriseToRevenue: info.enterpriseToRevenue || null,
      enterpriseToEbitda: info.enterpriseToEbitda || null,
      bookValue: info.bookValue || null,
      
      // Dividendi
      dividendRate: info.dividendRate || null,
      dividendYield: info.dividendYield || null,
      payoutRatio: info.payoutRatio || null,
      trailingAnnualDividendRate: info.trailingAnnualDividendRate || null,
      trailingAnnualDividendYield: info.trailingAnnualDividendYield || null,
      fiveYearAvgDividendYield: info.fiveYearAvgDividendYield || null,
      lastDividendValue: info.lastDividendValue || null,
      
      // Performance
      fiftyTwoWeekLow: info.fiftyTwoWeekLow || null,
      fiftyTwoWeekHigh: info.fiftyTwoWeekHigh || null,
      fiftyDayAverage: info.fiftyDayAverage || null,
      twoHundredDayAverage: info.twoHundredDayAverage || null,
      
      // 💼 BILANCIO - ASSETS
      totalAssets: info.totalAssets || null,
      totalCurrentAssets: info.totalCurrentAssets || null,
      totalNonCurrentAssets: info.totalNonCurrentAssets || null,
      cashAndCashEquivalents: info.cashAndCashEquivalents || null,
      cash: info.cash || null,
      totalCash: info.totalCash || null,
      totalCashPerShare: info.totalCashPerShare || null,
      
      // 💼 BILANCIO - LIABILITIES
      totalLiabilities: info.totalLiabilities || null,
      totalLiabilitiesNetMinorityInterest: info.totalLiabilitiesNetMinorityInterest || null,
      totalCurrentLiabilities: info.totalCurrentLiabilities || null,
      totalNonCurrentLiabilitiesNetMinorityInterest: info.totalNonCurrentLiabilitiesNetMinorityInterest || null,
      
      // 💼 BILANCIO - DEBT
      totalDebt: info.totalDebt || null,
      netDebt: info.netDebt || null,
      shortTermDebt: info.shortTermDebt || null,
      longTermDebt: info.longTermDebt || null,
      shortLongTermDebt: info.shortLongTermDebt || null,
      debtToEquity: info.debtToEquity || null,
      
      // 💼 BILANCIO - EQUITY
      stockholdersEquity: info.stockholdersEquity || null,
      totalEquityGross: info.totalEquityGross || null,
      tangibleBookValue: info.tangibleBookValue || null,
      netTangibleAssets: info.netTangibleAssets || null,
      
      // 💼 BILANCIO - WORKING CAPITAL
      workingCapital: info.workingCapital || null,
      investedCapital: info.investedCapital || null,
      
      // 📊 CONTO ECONOMICO - REVENUE
      totalRevenue: info.totalRevenue || null,
      revenuePerShare: info.revenuePerShare || null,
      operatingRevenue: info.operatingRevenue || null,
      revenueGrowth: info.revenueGrowth || null,
      revenueQuarterlyGrowth: info.revenueQuarterlyGrowth || null,
      
      // 📊 CONTO ECONOMICO - PROFITS
      grossProfits: info.grossProfits || null,
      grossMargins: info.grossMargins || null,
      ebitda: info.ebitda || null,
      ebitdaMargins: info.ebitdaMargins || null,
      operatingIncome: info.operatingIncome || null,
      operatingMargins: info.operatingMargins || null,
      netIncomeToCommon: info.netIncomeToCommon || null,
      netIncome: info.netIncome || null,
      
      // 📊 CONTO ECONOMICO - EPS
      trailingEps: info.trailingEps || null,
      forwardEps: info.forwardEps || null,
      epsCurrentYear: info.epsCurrentYear || null,
      epsForward: info.epsForward || null,
      epsTrailingTwelveMonths: info.epsTrailingTwelveMonths || null,
      
      // 📊 CONTO ECONOMICO - GROWTH
      earningsGrowth: info.earningsGrowth || null,
      earningsQuarterlyGrowth: info.earningsQuarterlyGrowth || null,
      
      // 💰 CASH FLOW
      operatingCashflow: info.operatingCashflow || null,
      freeCashflow: info.freeCashflow || null,
      leveredFreeCashFlow: info.leveredFreeCashFlow || null,
      
      // 📊 MARGINI E PROFITABILITÀ
      profitMargins: info.profitMargins || null,
      returnOnAssets: info.returnOnAssets || null,
      returnOnEquity: info.returnOnEquity || null,
      currentRatio: info.currentRatio || null,
      quickRatio: info.quickRatio || null,
      
      // 📊 AZIONI
      sharesOutstanding: info.sharesOutstanding || null,
      floatShares: info.floatShares || null,
      impliedSharesOutstanding: info.impliedSharesOutstanding || null,
      sharesShort: info.sharesShort || null,
      sharesShortPriorMonth: info.sharesShortPriorMonth || null,
      sharesPercentSharesOut: info.sharesPercentSharesOut || null,
      shortRatio: info.shortRatio || null,
      shortPercentOfFloat: info.shortPercentOfFloat || null,
      heldPercentInsiders: info.heldPercentInsiders || null,
      heldPercentInstitutions: info.heldPercentInstitutions || null,
      
      // Target e Raccomandazioni
      targetHighPrice: info.targetHighPrice || null,
      targetLowPrice: info.targetLowPrice || null,
      targetMeanPrice: info.targetMeanPrice || null,
      targetMedianPrice: info.targetMedianPrice || null,
      recommendationKey: info.recommendationKey || null,
      recommendationMean: info.recommendationMean || null,
      numberOfAnalystOpinions: info.numberOfAnalystOpinions || null,
      
      // Rischio
      beta: info.beta || null,
      beta3Year: info.beta3Year || null,
      auditRisk: info.auditRisk || null,
      boardRisk: info.boardRisk || null,
      compensationRisk: info.compensationRisk || null,
      shareHolderRightsRisk: info.shareHolderRightsRisk || null,
      overallRisk: info.overallRisk || null,
      
      // Date Importanti
      lastFiscalYearEnd: info.lastFiscalYearEnd || null,
      nextFiscalYearEnd: info.nextFiscalYearEnd || null,
      mostRecentQuarter: info.mostRecentQuarter || null,
      exDividendDate: info.exDividendDate || null,
      lastDividendDate: info.lastDividendDate || null,
    };
  }

  /**
   * 📊 Organizza metriche per categorie (per UI)
   */
  organizeMetricsByCategory(metrics) {
    return {
      overview: {
        title: '📊 Panoramica',
        metrics: [
          { label: 'Simbolo', value: metrics.symbol, type: 'text' },
          { label: 'Nome Completo', value: metrics.longName, type: 'text' },
          { label: 'Settore', value: metrics.sector, type: 'text' },
          { label: 'Industria', value: metrics.industry, type: 'text' },
          { label: 'Paese', value: metrics.country, type: 'text' },
        ]
      },
      
      price: {
        title: '💰 Prezzi',
        metrics: [
          { label: 'Prezzo Corrente', value: metrics.currentPrice, type: 'currency' },
          { label: 'Chiusura Precedente', value: metrics.previousClose, type: 'currency' },
          { label: 'Apertura', value: metrics.open, type: 'currency' },
          { label: 'Min Giornaliero', value: metrics.dayLow, type: 'currency' },
          { label: 'Max Giornaliero', value: metrics.dayHigh, type: 'currency' },
          { label: 'Min 52 Settimane', value: metrics.fiftyTwoWeekLow, type: 'currency' },
          { label: 'Max 52 Settimane', value: metrics.fiftyTwoWeekHigh, type: 'currency' },
        ]
      },
      
      valuation: {
        title: '📈 Valutazione',
        metrics: [
          { label: 'Market Cap', value: metrics.marketCap, type: 'large_number' },
          { label: 'Enterprise Value', value: metrics.enterpriseValue, type: 'large_number' },
          { label: 'P/E Ratio (Trailing)', value: metrics.trailingPE, type: 'ratio' },
          { label: 'P/E Ratio (Forward)', value: metrics.forwardPE, type: 'ratio' },
          { label: 'PEG Ratio', value: metrics.pegRatio, type: 'ratio' },
          { label: 'P/B Ratio', value: metrics.priceToBook, type: 'ratio' },
          { label: 'P/S Ratio', value: metrics.priceToSales, type: 'ratio' },
        ]
      },
      
      dividends: {
        title: '💸 Dividendi',
        metrics: [
          { label: 'Dividend Rate', value: metrics.dividendRate, type: 'currency' },
          { label: 'Dividend Yield', value: metrics.dividendYield, type: 'percent' },
          { label: 'Payout Ratio', value: metrics.payoutRatio, type: 'percent' },
        ]
      },
      
      financials: {
        title: '💼 Finanziari',
        metrics: [
          { label: 'Revenue Totale', value: metrics.totalRevenue, type: 'large_number' },
          { label: 'Revenue per Share', value: metrics.revenuePerShare, type: 'currency' },
          { label: 'Debito Totale', value: metrics.totalDebt, type: 'large_number' },
          { label: 'Debt/Equity', value: metrics.debtToEquity, type: 'ratio' },
        ]
      },
      
      profitability: {
        title: '💹 Profittabilità',
        metrics: [
          { label: 'Profit Margin', value: metrics.profitMargins, type: 'percent' },
          { label: 'Operating Margin', value: metrics.operatingMargins, type: 'percent' },
          { label: 'ROA', value: metrics.returnOnAssets, type: 'percent' },
          { label: 'ROE', value: metrics.returnOnEquity, type: 'percent' },
        ]
      },
      
      growth: {
        title: '📊 Crescita',
        metrics: [
          { label: 'Revenue Growth', value: metrics.revenueGrowth, type: 'percent' },
          { label: 'Earnings Growth', value: metrics.earningsQuarterlyGrowth, type: 'percent' },
        ]
      },
      
      analysts: {
        title: '🎯 Target Analisti',
        metrics: [
          { label: 'Target Medio', value: metrics.targetMeanPrice, type: 'currency' },
          { label: 'Target Alto', value: metrics.targetHighPrice, type: 'currency' },
          { label: 'Target Basso', value: metrics.targetLowPrice, type: 'currency' },
          { label: 'Raccomandazione', value: metrics.recommendationKey?.toUpperCase(), type: 'text' },
          { label: 'N° Analisti', value: metrics.numberOfAnalystOpinions, type: 'number' },
        ]
      },
      
      risk: {
        title: '⚠️ Rischio',
        metrics: [
          { label: 'Beta', value: metrics.beta, type: 'ratio' },
          { label: 'Volume', value: metrics.volume, type: 'number' },
          { label: 'Volume Medio', value: metrics.averageVolume, type: 'number' },
        ]
      }
    };
  }

  /**
   * 💾 Cache Helper: Salva
   */
  _saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 📦 Cache Helper: Recupera
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 🗑️ Pulisci cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache Yahoo Finance pulita');
  }
}

// Singleton
const yahooFinanceService = new YahooFinanceService();

export default yahooFinanceService;
