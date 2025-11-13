import { API_CONFIG } from '../config/apiConfig.js';

/**
 * 🇪🇺 EurostatService - Comunicazione con Google Cloud Run Eurostat API
 * 
 * IMPORTANTE: 
 * - ZERO dati mock o fallback
 * - SOLO dati reali da Eurostat tramite Google Cloud Run
 * - 12 indicatori economici Eurozona
 * - Dati storici completi disponibili (20-30 anni)
 * - Trasformazione JSON-stat → formato semplice
 * 
 * CREATO: 13 Nov 2025
 * BACKEND: https://eurostat-proxy-21722357706.europe-west1.run.app
 */
class EurostatService {
  constructor() {
    this.cacheKey = 'portfoliolab_eurostat_cache_v3';  // ⬆️ INCREMENTATO v2→v3: nuovi indicatori
    this.cacheDuration = API_CONFIG.BACKEND_CACHE_DURATION;
    this.disableCache = true;  // ⬆️ DISABILITATO: dataset troppo grande (3800+ obs)
    
    console.log('🇪🇺 EurostatService v1.3 - Google Cloud Run Backend');
    console.log('🚫 ZERO FALLBACK - Solo dati Eurostat reali');
    console.log('⚠️  Cache disabilitata - dataset troppo grande per localStorage');
    console.log('🆕 3 NUOVI INDICATORI: CONSUMPTION, INVESTMENT, SERVICES_CONFIDENCE, WAGES_GROWTH');
    console.log('❌ RIMOSSO: BUSINESS_INVESTMENT_EA (dataset non disponibile)');
    console.log('🌐 Backend Eurostat:', API_CONFIG.EUROSTAT_BACKEND_BASE_URL);
  }

  /**
   * 📊 Indicatori Eurostat ufficiali organizzati per categoria economica
   * Mappati come equivalenti agli indicatori FRED per l'Eurozona
   * 
   * CATEGORIE:
   * 1. Mondo del Lavoro (2 indicatori - 🆕 1 nuovo: WAGES_GROWTH_EA)
   * 2. Crescita Economica (7 indicatori - 🆕 3 nuovi: CONSUMPTION, INVESTMENT, SERVICES_CONFIDENCE)
   * 3. Solidità Economica (6 indicatori)
   * 
   * TOTALE: 15 indicatori con dati storici completi (erano 12 in v1.1)
   * RIMOSSO: BUSINESS_INVESTMENT_EA (dataset Eurostat non disponibile)
   */
  getOfficialEurostatIndicators() {
    return {
      // === CATEGORIA 1: MONDO DEL LAVORO ===
      'employment': [
        { 
          id: 'UNEMPLOYMENT_EA', 
          name: 'Tasso di Disoccupazione Eurozona', 
          description: 'Percentuale della forza lavoro che è attivamente alla ricerca di un impiego ma non riesce a trovarlo nell\'Eurozona. Indicatore chiave della salute del mercato del lavoro europeo.', 
          units: 'Percent', 
          categoryKey: 'Mondo del Lavoro',
          dataset: 'une_rt_m',
          frequency: 'Monthly'
        },
        { 
          id: 'WAGES_GROWTH_EA', 
          name: '💰 Crescita Salari Eurozona', 
          description: 'Variazione trimestrale del costo del lavoro per unità di lavoro dipendente. Misura la dinamica salariale e la pressione sui costi per le imprese. Indicatore cruciale per l\'inflazione salariale.', 
          units: 'Percent Change Q4', 
          categoryKey: 'Mondo del Lavoro',
          dataset: 'lc_lci_r2_q',
          frequency: 'Quarterly'
        }
      ],

      // === CATEGORIA 2: CRESCITA ECONOMICA ===
      'growth': [
        { 
          id: 'GDP_EA', 
          name: 'PIL Eurozona', 
          description: 'Tasso di crescita del Prodotto Interno Lordo dell\'Eurozona. Misura la variazione trimestrale dell\'attività economica nell\'area euro. È l\'indicatore più completo della salute economica.', 
          units: 'Percent Change', 
          categoryKey: 'Crescita Economica',
          dataset: 'namq_10_gdp',
          frequency: 'Quarterly'
        },
        { 
          id: 'CONSUMPTION_EA', 
          name: '🛒 Consumi Privati Eurozona', 
          description: 'Spesa per consumi finali delle famiglie. Rappresenta circa il 55% del PIL dell\'Eurozona. Misura diretta della domanda interna dei consumatori e del loro potere d\'acquisto.', 
          units: 'Percent Change', 
          categoryKey: 'Crescita Economica',
          dataset: 'namq_10_pc',
          frequency: 'Quarterly'
        },
        { 
          id: 'INVESTMENT_EA', 
          name: '🏗️ Investimenti Totali Eurozona', 
          description: 'Investimenti fissi lordi (Gross Fixed Capital Formation). Include macchinari, edifici, infrastrutture e tecnologia. Indicatore della fiducia delle imprese e del potenziale di crescita futuro.', 
          units: 'Percent Change', 
          categoryKey: 'Crescita Economica',
          dataset: 'namq_10_gdp',
          frequency: 'Quarterly'
        },
        { 
          id: 'INDPRO_EA', 
          name: 'Produzione Industriale Eurozona', 
          description: 'Indice della produzione industriale nell\'Eurozona. Misura l\'output dei settori manifatturiero, minerario ed energetico. Indicatore chiave della forza produttiva europea.', 
          units: 'Index 2015=100', 
          categoryKey: 'Crescita Economica',
          dataset: 'sts_inpr_m',
          frequency: 'Monthly'
        },
        { 
          id: 'RETAIL_EA', 
          name: 'Vendite al Dettaglio Eurozona', 
          description: 'Volume delle vendite al dettaglio nell\'Eurozona. Riflette direttamente la spesa dei consumatori, componente principale della domanda aggregata nell\'area euro.', 
          units: 'Index 2015=100', 
          categoryKey: 'Crescita Economica',
          dataset: 'sts_trtu_m',
          frequency: 'Monthly'
        },
        { 
          id: 'EMPLOYMENT_EA', 
          name: 'Occupazione Totale Eurozona', 
          description: 'Numero totale di persone occupate nell\'Eurozona. Include tutti i settori economici e tipologie contrattuali. Indicatore fondamentale della capacità dell\'economia di creare posti di lavoro.', 
          units: 'Thousands', 
          categoryKey: 'Crescita Economica',
          dataset: 'lfsq_egan22d',
          frequency: 'Quarterly'
        },
        { 
          id: 'SERVICES_CONFIDENCE_EA', 
          name: '📊 Fiducia Servizi Eurozona', 
          description: 'Indicatore di fiducia del settore servizi. Include commercio, trasporti, finanza e servizi alle imprese. Settore che rappresenta oltre il 70% del PIL europeo.', 
          units: 'Balance', 
          categoryKey: 'Crescita Economica',
          dataset: 'ei_bssi_m_r2',
          frequency: 'Monthly'
        }
      ],

      // === CATEGORIA 3: SOLIDITÀ ECONOMICA ===
      'stability': [
        { 
          id: 'HICP_EA', 
          name: 'Inflazione HICP Eurozona', 
          description: 'Indice Armonizzato dei Prezzi al Consumo. Misura principale dell\'inflazione nell\'Eurozona, obiettivo di policy della BCE (target: 2%). Fondamentale per le decisioni di politica monetaria.', 
          units: 'Annual Rate %', 
          categoryKey: 'Solidità Economica',
          dataset: 'prc_hicp_manr',
          frequency: 'Monthly'
        },
        { 
          id: 'HICP_CORE', 
          name: 'Inflazione Core Eurozona', 
          description: 'Inflazione escludendo energia e alimentari nell\'Eurozona. Misura le pressioni inflazionistiche di fondo, meno influenzata da shock temporanei. Preferita dalla BCE per valutare tendenze inflazionistiche persistenti.', 
          units: 'Annual Rate %', 
          categoryKey: 'Solidità Economica',
          dataset: 'prc_hicp_manr',
          frequency: 'Monthly'
        },
        { 
          id: 'HICP_ENERGY', 
          name: 'Inflazione Energia Eurozona', 
          description: 'Variazione annuale dei prezzi dell\'energia nell\'Eurozona. Include elettricità, gas e carburanti. Fortemente influenzata dai prezzi internazionali e dalle politiche energetiche.', 
          units: 'Annual Rate %', 
          categoryKey: 'Solidità Economica',
          dataset: 'prc_hicp_manr',
          frequency: 'Monthly'
        },
        { 
          id: 'HICP_FOOD', 
          name: 'Inflazione Alimentare Eurozona', 
          description: 'Variazione annuale dei prezzi dei prodotti alimentari nell\'Eurozona. Componente volatile ma cruciale per il potere d\'acquisto delle famiglie, specialmente quelle a basso reddito.', 
          units: 'Annual Rate %', 
          categoryKey: 'Solidità Economica',
          dataset: 'prc_hicp_manr',
          frequency: 'Monthly'
        },
        { 
          id: 'PPI_EA', 
          name: 'Prezzi alla Produzione Eurozona', 
          description: 'Indice dei prezzi alla produzione industriale nell\'Eurozona. Anticipa spesso l\'inflazione al consumo poiché gli aumenti dei costi di produzione vengono trasferiti ai prezzi finali.', 
          units: 'Index 2015=100', 
          categoryKey: 'Solidità Economica',
          dataset: 'sts_inpp_m',
          frequency: 'Monthly'
        },
        { 
          id: 'CONSUMER_CONFIDENCE_EA', 
          name: 'Fiducia Consumatori Eurozona', 
          description: 'Indicatore di fiducia dei consumatori nell\'Eurozona. Misura l\'ottimismo riguardo le condizioni economiche attuali e future. Valori elevati precedono aumenti della spesa personale.', 
          units: 'Balance', 
          categoryKey: 'Solidità Economica',
          dataset: 'ei_bssi_m_r2',
          frequency: 'Monthly'
        },
        { 
          id: 'INDUSTRY_CONFIDENCE_EA', 
          name: 'Fiducia Industria Eurozona', 
          description: 'Indicatore di fiducia del settore industriale nell\'Eurozona. Riflette le aspettative dei produttori su ordini, produzione e scorte. Indicatore anticipatore dell\'attività manifatturiera.', 
          units: 'Balance', 
          categoryKey: 'Solidità Economica',
          dataset: 'ei_bssi_m_r2',
          frequency: 'Monthly'
        }
      ]
    };
  }

  /**
   * 🎯 Ottiene tutti i series ID in una lista piatta
   */
  getAllSeriesIds() {
    const categories = this.getOfficialEurostatIndicators();
    const allSeries = [];
    
    Object.keys(categories).forEach(category => {
      categories[category].forEach(indicator => {
        allSeries.push(indicator.id);
      });
    });
    
    console.log(`📊 Totale indicatori Eurostat: ${allSeries.length}`);
    return allSeries;
  }

  /**
   * 🇪🇺 Carica tutti i 12 indicatori Eurostat
   * SOLO dal backend Google Cloud Run - ZERO fallback
   */
  async fetchAllIndicatorsComplete() {
    console.log(`🇪🇺 Caricando ${this.getAllSeriesIds().length} indicatori Eurostat...`);
    
    try {
      // 1. Health check obbligatorio
      console.log('🔍 Health check Google Cloud Run Eurostat...');
      const healthCheck = await this.checkHealth();
      
      if (!healthCheck || healthCheck.status !== 'healthy') {
        throw new Error('Backend Eurostat Google Cloud Run non disponibile');
      }
      
      console.log('✅ Backend Eurostat disponibile:', healthCheck);
      
      // 2. Carica tutti gli indicatori via batch
      const allSeriesIds = this.getAllSeriesIds();
      
      console.log(`📊 Caricamento batch ${allSeriesIds.length} serie Eurostat...`);
      
      const response = await fetch(`${API_CONFIG.EUROSTAT_BACKEND_BASE_URL}/api/eurostat/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          series: allSeriesIds
        })
      });

      if (!response.ok) {
        throw new Error(`Backend Eurostat error: ${response.status}`);
      }

      const batchData = await response.json();
      
      console.log(`✅ Dati Eurostat ricevuti: ${batchData.successful_series}/${batchData.total_series} serie`);

      // 3. Organizza per categorie
      const indicators = this.getOfficialEurostatIndicators();
      const categorizedData = {};
      let totalDataPoints = 0;
      
      Object.keys(indicators).forEach(categoryKey => {
        categorizedData[categoryKey] = [];
        
        indicators[categoryKey].forEach(indicator => {
          const seriesData = batchData.results[indicator.id];
          
          if (seriesData && seriesData.observations && seriesData.observations.length > 0) {
            const processedData = {
              ...indicator,
              observations: seriesData.observations,
              category: categoryKey,
              lastUpdate: Date.now(),
              totalObservations: seriesData.count,
              years_span: seriesData.years_span || 0,
              earliest_date: seriesData.observations[0].date,
              latest_date: seriesData.observations[seriesData.observations.length - 1].date
            };
            
            categorizedData[categoryKey].push(processedData);
            totalDataPoints += seriesData.count;
            
            console.log(`  ✅ ${indicator.name}: ${seriesData.count} osservazioni`);
          } else {
            console.warn(`  ⚠️ ${indicator.name}: Nessun dato disponibile`);
          }
        });
      });
      
      const finalData = {
        indicators: categorizedData,
        rawData: batchData.results,
        metadata: {
          totalIndicators: allSeriesIds.length,
          totalDataPoints: totalDataPoints,
          lastUpdate: Date.now(),
          source: 'google_cloud_run_eurostat',
          backendHealth: healthCheck
        }
      };
      
      console.log('🎉 Tutti i dati Eurostat caricati con successo:', {
        indicatori: allSeriesIds.length,
        categorie: Object.keys(categorizedData).length,
        puntiDati: totalDataPoints
      });
      
      // 4. Cache dei risultati (solo se cache abilitata)
      if (!this.disableCache) {
        this.setCachedData(finalData);
      } else {
        console.log('⚠️  Cache Eurostat disabilitata - dataset troppo grande per localStorage');
      }
      
      return finalData;
      
    } catch (error) {
      console.error('❌ ERRORE FATALE - Backend Eurostat Google Cloud Run fallito:', error.message);
      throw new Error(`Backend Eurostat non disponibile: ${error.message}. Verifica la connessione a Google Cloud Run.`);
    }
  }

  /**
   * 🏥 Health check del backend Eurostat
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_CONFIG.EUROSTAT_BACKEND_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const health = await response.json();
      console.log('✅ Eurostat backend health:', health);
      return health;
      
    } catch (error) {
      console.error('❌ Eurostat backend health check failed:', error);
      return null;
    }
  }

  /**
   * 🔍 Carica una singola serie Eurostat per ID
   */
  async getSingleSeries(seriesId) {
    try {
      console.log(`📊 Caricamento serie Eurostat: ${seriesId}`);
      
      const response = await fetch(
        `${API_CONFIG.EUROSTAT_BACKEND_BASE_URL}/api/eurostat/series/${seriesId}/observations`
      );
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.observations) {
        throw new Error('Nessun dato restituito dal backend');
      }
      
      console.log(`✅ Serie caricata: ${data.count} osservazioni`);
      
      return {
        id: seriesId,
        name: data.name || seriesId,
        observations: data.observations || [],
        units: data.units || '',
        count: data.count || 0,
        years_span: data.years_span || 0,
        dataset: data.dataset || '',
        error: null
      };
      
    } catch (error) {
      console.error(`❌ Errore caricamento serie ${seriesId}:`, error.message);
      return {
        id: seriesId,
        name: seriesId,
        observations: [],
        error: `Errore caricamento: ${error.message}`
      };
    }
  }

  /**
   * 🔍 Ricerca indicatori Eurostat
   */
  async searchEurostatSeries(searchText) {
    if (!searchText || searchText.trim().length < 2) {
      return { results: [], error: null };
    }

    try {
      console.log(`🔍 Ricerca Eurostat per: "${searchText}"`);
      
      const indicators = this.getOfficialEurostatIndicators();
      const results = [];
      const searchLower = searchText.toLowerCase();
      
      // Ricerca locale negli indicatori configurati
      Object.values(indicators).forEach(category => {
        category.forEach(indicator => {
          if (indicator.name.toLowerCase().includes(searchLower) ||
              indicator.description.toLowerCase().includes(searchLower) ||
              indicator.id.toLowerCase().includes(searchLower)) {
            results.push({
              id: indicator.id,
              title: indicator.name,
              description: indicator.description,
              units: indicator.units,
              frequency: indicator.frequency
            });
          }
        });
      });
      
      console.log(`✅ Ricerca completata: ${results.length} risultati trovati`);
      
      return {
        results: results,
        error: null
      };
      
    } catch (error) {
      console.error('❌ Errore ricerca Eurostat:', error.message);
      return {
        results: [],
        error: `Errore ricerca: ${error.message}`
      };
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
      
      console.log('📦 Dati Eurostat caricati da cache');
      return data.data;
    } catch (error) {
      console.error('❌ Errore lettura cache Eurostat:', error);
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
      console.log('💾 Dati Eurostat salvati in cache');
    } catch (error) {
      console.error('❌ Errore salvataggio cache Eurostat:', error);
    }
  }

  clearCache() {
    localStorage.removeItem(this.cacheKey);
    console.log('🗑️ Cache Eurostat pulita');
  }

  /**
   * 📊 Metodo principale per l'AnalysisPage
   * SOLO Google Cloud Run - ZERO fallback
   */
  async fetchMacroDataComplete() {
    console.log('🇪🇺 Avvio caricamento dati macro economici Eurostat');
    
    // Prova cache prima (solo se abilitata)
    if (!this.disableCache) {
      const cachedData = this.getCachedData();
      if (cachedData) {
        console.log('📦 Utilizzando dati Eurostat da cache');
        return cachedData;
      }
    }
    
    // Carica dati freschi
    return await this.fetchAllIndicatorsComplete();
  }
}

// Export singleton
const eurostatService = new EurostatService();
export default eurostatService;
