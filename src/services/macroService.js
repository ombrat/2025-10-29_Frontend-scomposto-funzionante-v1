import { API_CONFIG } from '../config/apiConfig.js';

/**
 * 🏦 MacroService - Comunicazione ESCLUSIVA con Google Cloud Run FRED API
 * 
 * IMPORTANTE: 
 * - ZERO dati mock o fallback
 * - SOLO dati reali da FRED tramite Google Cloud Run
 * - 32 indicatori economici ufficiali
 * - 70 anni di dati storici per ogni indicatore
 */
class MacroService {
  constructor() {
    this.cacheKey = 'portfoliolab_macro_cache_v2';
    this.cacheDuration = API_CONFIG.BACKEND_CACHE_DURATION;
    
    console.log('🏦 MacroService v2.0 - SOLO Google Cloud Run Backend');
    console.log('🚫 ZERO FALLBACK - Solo dati FRED reali');
    console.log('🌐 Backend:', API_CONFIG.BACKEND_BASE_URL);
  }

  /**
   * 📊 Lista ufficiale dei 32 indicatori FRED
   * Organizzati in 10 categorie logiche
   */
  getOfficialFredIndicators() {
    return {
      // 1. GDP & GROWTH (4 indicatori)
      'gdp_growth': [
        { id: 'GDP', name: 'Prodotto Interno Lordo (PIL)', description: 'Valore totale di beni e servizi prodotti negli USA' },
        { id: 'GDPC1', name: 'PIL Reale', description: 'PIL aggiustato per inflazione' },
        { id: 'GDPPOT', name: 'PIL Potenziale', description: 'Livello massimo sostenibile di produzione' },
        { id: 'NYGDPMKTPCDWLD', name: 'PIL Pro Capite Mondiale', description: 'PIL per persona a livello mondiale' }
      ],

      // 2. EMPLOYMENT & LABOR (4 indicatori)
      'employment': [
        { id: 'UNRATE', name: 'Tasso di Disoccupazione', description: 'Percentuale della forza lavoro disoccupata' },
        { id: 'PAYEMS', name: 'Buste Paga Non Agricole', description: 'Numero di dipendenti nei settori non agricoli' },
        { id: 'CIVPART', name: 'Partecipazione Forza Lavoro', description: 'Percentuale di popolazione in età lavorativa attiva' },
        { id: 'EMRATIO', name: 'Rapporto Occupazione-Popolazione', description: 'Percentuale di popolazione occupata' }
      ],

      // 3. INFLATION & PRICES (4 indicatori)
      'inflation': [
        { id: 'CPIAUCSL', name: 'Inflazione (CPI)', description: 'Indice dei Prezzi al Consumo' },
        { id: 'CPILFESL', name: 'Inflazione Core', description: 'CPI escludendo alimentari ed energia' },
        { id: 'PPIACO', name: 'Indice Prezzi Produttori', description: 'Prezzi ricevuti dai produttori domestici' },
        { id: 'DFEDTARU', name: 'Aspettative Inflazione 5-10 anni', description: 'Aspettative di inflazione a lungo termine' }
      ],

      // 4. INTEREST RATES & MONETARY POLICY (4 indicatori)
      'monetary_policy': [
        { id: 'FEDFUNDS', name: 'Federal Funds Rate', description: 'Tasso di interesse obiettivo della Fed' },
        { id: 'DGS10', name: 'Rendimento Titoli 10 anni', description: 'Rendimento dei Treasury a 10 anni' },
        { id: 'DGS2', name: 'Rendimento Titoli 2 anni', description: 'Rendimento dei Treasury a 2 anni' },
        { id: 'T10Y2Y', name: 'Spread 10Y-2Y', description: 'Differenza tra rendimenti 10 anni e 2 anni' }
      ],

      // 5. CONSUMER & RETAIL (3 indicatori)
      'consumer': [
        { id: 'RSAFS', name: 'Vendite al Dettaglio', description: 'Vendite totali del commercio al dettaglio' },
        { id: 'UMCSENT', name: 'Fiducia dei Consumatori', description: 'Indice di fiducia dei consumatori Michigan' },
        { id: 'PCE', name: 'Spese Consumatori Personali', description: 'Spese totali dei consumatori' }
      ],

      // 6. HOUSING & REAL ESTATE (3 indicatori)
      'housing': [
        { id: 'HOUST', name: 'Nuove Costruzioni', description: 'Unità abitative iniziate mensilmente' },
        { id: 'CSUSHPISA', name: 'Case-Shiller Index', description: 'Indice prezzi case negli USA' },
        { id: 'MORTGAGE30US', name: 'Tasso Mutui 30 anni', description: 'Tasso medio mutui ipotecari 30 anni' }
      ],

      // 7. MANUFACTURING & INDUSTRY (3 indicatori)
      'manufacturing': [
        { id: 'INDPRO', name: 'Produzione Industriale', description: 'Output del settore manifatturiero, minerario e utilities' },
        { id: 'CAPUTLG2211A2S', name: 'Utilizzo Capacità Produttiva', description: 'Percentuale capacità produttiva utilizzata' },
        { id: 'NEWORDER', name: 'Nuovi Ordini Manifatturiero', description: 'Nuovi ordini nel settore manifatturiero' }
      ],

      // 8. TRADE & INTERNATIONAL (3 indicatori)
      'trade': [
        { id: 'BOPGSTB', name: 'Bilancia Commerciale', description: 'Differenza tra esportazioni e importazioni' },
        { id: 'DEXUSEU', name: 'Tasso di Cambio USD/EUR', description: 'Dollari USA per Euro' },
        { id: 'DTWEXBGS', name: 'Indice Dollaro USA', description: 'Valore del dollaro rispetto a un paniere di valute' }
      ],

      // 9. FINANCIAL MARKETS (2 indicatori)
      'financial': [
        { id: 'SP500', name: 'S&P 500', description: 'Indice azionario delle 500 maggiori aziende USA' },
        { id: 'VIXCLS', name: 'VIX Volatility Index', description: 'Indice di volatilità del mercato azionario' }
      ],

      // 10. GOVERNMENT & FISCAL (2 indicatori)
      'fiscal': [
        { id: 'GFDEBTN', name: 'Debito Federale USA', description: 'Debito totale del governo federale USA' },
        { id: 'FYONGDA188S', name: 'Deficit/Surplus Federale', description: 'Bilancio annuale del governo federale' }
      ]
    };
  }

  /**
   * 🎯 Ottiene tutti i series ID in una lista piatta
   */
  getAllSeriesIds() {
    const categories = this.getOfficialFredIndicators();
    const allSeries = [];
    
    Object.keys(categories).forEach(category => {
      categories[category].forEach(indicator => {
        allSeries.push(indicator.id);
      });
    });
    
    console.log(`📊 Totale indicatori FRED: ${allSeries.length}`);
    return allSeries;
  }

  /**
   * 🏦 Carica tutti i 32 indicatori con 70 anni di dati storici
   * SOLO dal backend Google Cloud Run - ZERO fallback
   */
  async fetchAllIndicatorsComplete(years = 70) {
    console.log(`🏦 Caricando ${this.getAllSeriesIds().length} indicatori FRED con ${years} anni di storia...`);
    
    // Importa backendService
    const { default: backendService } = await import('./backendService.js');
    
    try {
      // 1. Health check obbligatorio
      console.log('🔍 Health check Google Cloud Run...');
      const healthCheck = await backendService.checkHealth();
      
      if (!healthCheck || healthCheck.status !== 'healthy') {
        throw new Error('Backend Google Cloud Run non disponibile');
      }
      
      console.log('✅ Backend disponibile:', healthCheck);
      
      // 2. Carica tutti gli indicatori
      const allSeriesIds = this.getAllSeriesIds();
      const indicators = this.getOfficialFredIndicators();
      
      console.log(`📊 Caricamento ${allSeriesIds.length} serie storiche...`);
      
      // 3. Caricamento parallelo con limite di concorrenza
      const batchSize = 5; // Massimo 5 richieste contemporanee
      const results = {};
      
      for (let i = 0; i < allSeriesIds.length; i += batchSize) {
        const batch = allSeriesIds.slice(i, i + batchSize);
        console.log(`📈 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allSeriesIds.length/batchSize)}: caricando ${batch.join(', ')}`);
        
        const batchPromises = batch.map(async (seriesId) => {
          try {
            const data = await backendService.getFredSeriesObservations(seriesId, {
              limit: years * 12, // Circa 70 anni di dati mensili
              sort_order: 'desc'
            });
            
            return { seriesId, data, success: true };
          } catch (error) {
            console.error(`❌ Errore caricando ${seriesId}:`, error.message);
            throw new Error(`Impossibile caricare ${seriesId}: ${error.message}`);
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(result => {
          if (result.success) {
            results[result.seriesId] = result.data;
            console.log(`  ✅ ${result.seriesId}: ${result.data?.observations?.length || 0} osservazioni`);
          }
        });
      }
      
      // 4. Organizza per categorie
      const categorizedData = {};
      let totalDataPoints = 0;
      
      Object.keys(indicators).forEach(categoryKey => {
        categorizedData[categoryKey] = [];
        
        indicators[categoryKey].forEach(indicator => {
          const seriesData = results[indicator.id];
          if (seriesData && seriesData.observations) {
            const processedData = {
              ...indicator,
              observations: seriesData.observations,
              category: categoryKey,
              lastUpdate: Date.now(),
              totalObservations: seriesData.observations.length
            };
            
            categorizedData[categoryKey].push(processedData);
            totalDataPoints += seriesData.observations.length;
          }
        });
      });
      
      const finalData = {
        indicators: categorizedData,
        rawData: results,
        metadata: {
          totalIndicators: allSeriesIds.length,
          totalDataPoints: totalDataPoints,
          yearsRequested: years,
          lastUpdate: Date.now(),
          source: 'google_cloud_run_fred',
          backendHealth: healthCheck
        }
      };
      
      console.log('🎉 Tutti i dati FRED caricati con successo:', {
        indicatori: allSeriesIds.length,
        categorie: Object.keys(categorizedData).length,
        puntiDati: totalDataPoints
      });
      
      // 5. Cache dei risultati
      this.setCachedData(finalData);
      
      return finalData;
      
    } catch (error) {
      console.error('❌ ERRORE FATALE - Backend Google Cloud Run fallito:', error.message);
      throw new Error(`Backend non disponibile: ${error.message}. Verifica la connessione a Google Cloud Run.`);
    }
  }

  /**
   * 💾 Gestione cache
   */
  getCachedData() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const now = Date.now();
      
      if (now - data.timestamp > this.cacheDuration) {
        localStorage.removeItem(this.cacheKey);
        return null;
      }
      
      console.log('📦 Dati caricati da cache');
      return data.data;
    } catch (error) {
      console.error('❌ Errore lettura cache:', error);
      return null;
    }
  }

  setCachedData(data) {
    try {
      const cacheObject = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheObject));
      console.log('💾 Dati salvati in cache');
    } catch (error) {
      console.error('❌ Errore salvataggio cache:', error);
    }
  }

  /**
   * 📊 Metodo principale per l'AnalysisPage
   * SOLO Google Cloud Run - ZERO fallback
   */
  async fetchMacroDataComplete(years = 70) {
    console.log(`🏦 Avvio caricamento dati macro economici: ${years} anni di storia`);
    
    // Prova cache prima
    const cachedData = this.getCachedData();
    if (cachedData) {
      console.log('📦 Utilizzando dati da cache');
      return cachedData;
    }
    
    // Carica dati freschi
    return await this.fetchAllIndicatorsComplete(years);
  }
}

// Export singleton
const macroService = new MacroService();
export default macroService;