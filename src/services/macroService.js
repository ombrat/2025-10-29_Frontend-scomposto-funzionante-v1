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
    this.cacheKey = 'portfoliolab_macro_cache_v4'; // v4 con PMI proxy
    this.cacheDuration = API_CONFIG.BACKEND_CACHE_DURATION;
    
    console.log('🏦 MacroService v4.0 - SOLO Google Cloud Run Backend');
    console.log('🚫 ZERO FALLBACK - Solo dati FRED reali');
    console.log('🌐 Backend:', API_CONFIG.BACKEND_BASE_URL);
  }

  /**
   * 📊 Indicatori FRED ufficiali organizzati per categoria economica
   * ORDINATI PER: Mondo del Lavoro, Crescita Economica, Solidità Economica
   * ESCLUSI: Indicatori finanziari (mercati, tassi, bond)
   */
  getOfficialFredIndicators() {
    return {
      // === CATEGORIA 1: MONDO DEL LAVORO ===
      'employment': [
        { 
          id: 'UNRATE', 
          name: 'Tasso di Disoccupazione', 
          description: 'Percentuale della forza lavoro che è attivamente alla ricerca di un impiego ma non riesce a trovarlo. Un tasso basso indica un mercato del lavoro sano con abbondanza di opportunità. Valori superiori al 5-6% possono segnalare difficoltà economiche significative.', 
          units: 'Percent', 
          categoryKey: 'Mondo del Lavoro' 
        },
        { 
          id: 'PAYEMS', 
          name: 'Buste Paga Non Agricole', 
          description: 'Numero totale di dipendenti nei settori non agricoli dell\'economia americana, escludendo lavoratori agricoli, domestici e non profit. Questo indicatore è fondamentale per valutare la creazione di posti di lavoro mese dopo mese. Una crescita costante indica espansione economica robusta.', 
          units: 'Thousands of Persons', 
          categoryKey: 'Mondo del Lavoro' 
        },
        { 
          id: 'CIVPART', 
          name: 'Partecipazione Forza Lavoro', 
          description: 'Percentuale della popolazione in età lavorativa (16+ anni) che è attivamente impiegata o alla ricerca di lavoro. Un tasso elevato indica un\'economia dinamica con opportunità diffuse. Cali prolungati possono segnalare scoraggiamento dei lavoratori o invecchiamento demografico.', 
          units: 'Percent', 
          categoryKey: 'Mondo del Lavoro' 
        },
        { 
          id: 'EMRATIO', 
          name: 'Rapporto Occupazione-Popolazione', 
          description: 'Percentuale della popolazione civile totale che è attualmente occupata. A differenza del tasso di disoccupazione, questo indicatore include chi non cerca attivamente lavoro. Fornisce una visione più completa della salute del mercato del lavoro oltre le statistiche ufficiali.', 
          units: 'Percent', 
          categoryKey: 'Mondo del Lavoro' 
        },
        { 
          id: 'ICSA', 
          name: 'Richieste Disoccupazione', 
          description: 'Numero di nuove richieste settimanali di sussidi di disoccupazione presentate dai lavoratori licenziati. È un indicatore anticipatore molto tempestivo delle condizioni del mercato del lavoro. Aumenti improvvisi possono segnalare un rallentamento economico imminente.', 
          units: 'Thousands', 
          categoryKey: 'Mondo del Lavoro' 
        },
        { 
          id: 'JTSJOL', 
          name: 'Aperture Lavoro', 
          description: 'Numero totale di posizioni lavorative aperte e disponibili per cui le aziende stanno attivamente cercando candidati. Un alto numero di aperture indica forte domanda di lavoro e potenziale per crescita salariale. Quando supera il numero di disoccupati, segnala un mercato molto stretto.', 
          units: 'Thousands', 
          categoryKey: 'Mondo del Lavoro' 
        },
        { 
          id: 'CES0500000003', 
          name: 'Retribuzione Oraria Media', 
          description: 'Paga media oraria per i lavoratori del settore privato non agricolo negli Stati Uniti. Crescite sostenute indicano pressioni inflazionistiche e potere d\'acquisto in aumento per i consumatori. Stagnazione salariale può segnalare debolezza del mercato del lavoro nonostante bassi tassi di disoccupazione.', 
          units: 'Dollars per Hour', 
          categoryKey: 'Mondo del Lavoro' 
        },
        { 
          id: 'MANEMP', 
          name: 'Occupazione Manifatturiero', 
          description: 'Numero totale di lavoratori impiegati nel settore manifatturiero americano. Questo settore è considerato strategico per l\'economia e fortemente ciclico. Declini prolungati possono indicare deindustrializzazione o spostamenti produttivi verso l\'estero.', 
          units: 'Thousands of Persons', 
          categoryKey: 'Mondo del Lavoro' 
        },
        { 
          id: 'USPRIV', 
          name: 'Occupazione Settore Privato', 
          description: 'Numero totale di dipendenti nel settore privato americano, escludendo lavoratori governativi. Rappresenta la capacità del settore privato di creare occupazione sostenibile. Una crescita robusta è segno di fiducia delle imprese e investimenti in capitale umano.', 
          units: 'Thousands of Persons', 
          categoryKey: 'Mondo del Lavoro' 
        }
      ],

      // === CATEGORIA 2: CRESCITA ECONOMICA ===
      'growth': [
        { 
          id: 'GDP', 
          name: 'Prodotto Interno Lordo', 
          description: 'Valore monetario totale di tutti i beni e servizi finali prodotti all\'interno dei confini nazionali in un periodo specifico. È la misura più completa dell\'attività economica di un paese. Crescite del 2-3% annuo sono considerate sane per economie mature.', 
          units: 'Billions of Dollars', 
          categoryKey: 'Crescita Economica' 
        },
        { 
          id: 'GDPC1', 
          name: 'PIL Reale', 
          description: 'Prodotto Interno Lordo aggiustato per gli effetti dell\'inflazione, permettendo confronti temporali significativi del potere d\'acquisto effettivo. Misura la crescita economica reale eliminando l\'illusione monetaria. Valori in calo per due trimestri consecutivi definiscono tecnicamente una recessione.', 
          units: 'Billions of Chained 2017 Dollars', 
          categoryKey: 'Crescita Economica' 
        },
        { 
          id: 'GDPPOT', 
          name: 'PIL Potenziale', 
          description: 'Livello massimo di produzione che un\'economia può sostenere nel lungo periodo senza creare pressioni inflazionistiche eccessive. Quando il PIL reale supera significativamente il potenziale, indica surriscaldamento economico. Al contrario, ampi gap negativi segnalano capacità produttiva inutilizzata.', 
          units: 'Billions of Chained 2017 Dollars', 
          categoryKey: 'Crescita Economica' 
        },
        { 
          id: 'INDPRO', 
          name: 'Produzione Industriale', 
          description: 'Indice che misura l\'output reale dei settori manifatturiero, minerario, elettrico e del gas. È un indicatore chiave della salute del settore produttivo e altamente ciclico. Cali anticipano spesso recessioni economiche più ampie.', 
          units: 'Index 2017=100', 
          categoryKey: 'Crescita Economica' 
        },
        { 
          id: 'IPMAN', 
          name: 'Produzione Manifatturiera', 
          description: 'Indice specifico della produzione nel settore manifatturiero, core dell\'economia industriale. Include tutto dalla produzione di automobili all\'elettronica di consumo. È particolarmente sensibile ai cicli economici e alla domanda globale.', 
          units: 'Index 2017=100', 
          categoryKey: 'Crescita Economica' 
        },
        { 
          id: 'SRVPRD', 
          name: 'Produzione Servizi', 
          description: 'Indice che traccia l\'attività nel settore dei servizi, che rappresenta circa l\'80% dell\'economia americana moderna. Include commercio, trasporti, finanza, sanità e servizi professionali. Meno volatile del manifatturiero ma ugualmente cruciale.', 
          units: 'Index 2017=100', 
          categoryKey: 'Crescita Economica' 
        },
        { 
          id: 'RSAFS', 
          name: 'Vendite al Dettaglio', 
          description: 'Valore totale delle vendite nei negozi al dettaglio e online. Riflette direttamente la spesa dei consumatori, motore principale dell\'economia americana. Crescite sostenute indicano fiducia dei consumatori e salute economica generale. Molto sensibile al reddito disponibile.', 
          units: 'Millions of Dollars', 
          categoryKey: 'Crescita Economica' 
        },
        { 
          id: 'PCE', 
          name: 'Spese Consumatori', 
          description: 'Misura totale della spesa personale per beni e servizi, rappresentando circa il 70% del PIL americano. Include acquisti di beni durevoli, non durevoli e servizi. La Federal Reserve monitora attentamente questo indicatore per valutare pressioni inflazionistiche.', 
          units: 'Billions of Dollars', 
          categoryKey: 'Crescita Economica' 
        },
        { 
          id: 'NEWORDER', 
          name: 'Nuovi Ordini', 
          description: 'Valore dei nuovi ordini ricevuti dai produttori manifatturieri per beni durevoli e non durevoli. È un indicatore anticipatore della produzione futura e della fiducia delle imprese. Incrementi suggeriscono aspettative di crescita della domanda.', 
          units: 'Millions of Dollars', 
          categoryKey: 'Crescita Economica' 
        },
        { 
          id: 'DGORDER', 
          name: 'Ordini Beni Durevoli', 
          description: 'Nuovi ordini per beni manifatturieri con vita utile superiore ai tre anni, come macchinari, computer, elettrodomestici e veicoli. È un indicatore volatile ma importante degli investimenti aziendali. Crescite robuste anticipano espansione della capacità produttiva.', 
          units: 'Millions of Dollars', 
          categoryKey: 'Crescita Economica' 
        }
      ],

      // === CATEGORIA 3: SOLIDITÀ ECONOMICA ===
      'stability': [
        { 
          id: 'CPIAUCSL', 
          name: 'Inflazione (CPI)', 
          description: 'Indice dei Prezzi al Consumo che misura la variazione media dei prezzi pagati dai consumatori urbani per un paniere fisso di beni e servizi. La Federal Reserve punta a un\'inflazione del 2% come ottimale. Tassi superiori al 3-4% erodono potere d\'acquisto e possono richiedere interventi restrittivi.', 
          units: 'Index 1982-1984=100', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'CPILFESL', 
          name: 'Inflazione Core', 
          description: 'Indice dei prezzi al consumo che esclude le componenti volatili di alimentari ed energia, fornendo una misura più stabile delle tendenze inflazionistiche di fondo. È preferito dai policy maker per valutare pressioni inflazionistiche persistenti e guidare decisioni sui tassi di interesse.', 
          units: 'Index 1982-1984=100', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'PPIACO', 
          name: 'Prezzi Produttori', 
          description: 'Indice che misura la variazione media dei prezzi di vendita ricevuti dai produttori domestici per il loro output. Anticipa spesso l\'inflazione al consumo poiché gli aumenti dei costi di produzione vengono trasferiti ai consumatori. Utile per prevedere pressioni sui margini aziendali.', 
          units: 'Index 1982=100', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'UMCSENT', 
          name: 'Fiducia Consumatori', 
          description: 'Indice di fiducia dei consumatori dell\'Università del Michigan che misura l\'ottimismo dei consumatori riguardo le condizioni economiche attuali e future. Valori elevati precedono spesso aumenti della spesa personale. Cali bruschi possono segnalare recessioni imminenti.', 
          units: 'Index 1966:Q1=100', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'CAPUTLG2211A2S', 
          name: 'Utilizzo Capacità', 
          description: 'Percentuale della capacità produttiva totale che è effettivamente utilizzata nell\'economia. Valori superiori all\'82-85% suggeriscono potenziali strozzature produttive e pressioni inflazionistiche. Tassi bassi indicano capacità inutilizzata e debolezza della domanda aggregata.', 
          units: 'Percent', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'HOUST', 
          name: 'Nuove Costruzioni', 
          description: 'Numero di nuove unità abitative per cui è iniziata la costruzione ogni mese. Il settore immobiliare è un motore importante dell\'economia con forti effetti moltiplicatori su occupazione e consumi. Cali significativi hanno spesso preceduto recessioni economiche.', 
          units: 'Thousands of Units', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'PERMIT', 
          name: 'Permessi Edilizi', 
          description: 'Numero di permessi autorizzati per la costruzione di nuove abitazioni private. Anticipa la costruzione effettiva di 1-2 mesi ed è quindi un indicatore anticipatore dell\'attività immobiliare. Riflette le aspettative dei costruttori sulla domanda futura di abitazioni.', 
          units: 'Thousands of Units', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'CSUSHPISA', 
          name: 'Prezzi Case', 
          description: 'Indice Case-Shiller che traccia i prezzi delle abitazioni unifamiliari in 20 principali aree metropolitane americane. La ricchezza immobiliare influenza fortemente la spesa dei consumatori. Bolle immobiliari possono creare instabilità finanziaria sistemica come visto nel 2008.', 
          units: 'Index Jan 2000=100', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'BOPGSTB', 
          name: 'Bilancia Commerciale', 
          description: 'Differenza tra il valore delle esportazioni e delle importazioni di beni e servizi. Un deficit persistente indica che il paese consuma più di quanto produce. Cambiamenti significativi possono impattare i tassi di cambio e riflettere la competitività internazionale.', 
          units: 'Millions of Dollars', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'TOTALSL', 
          name: 'Credito Consumatori', 
          description: 'Ammontare totale del credito al consumo in essere, includendo prestiti auto, carte di credito e prestiti studenteschi. Una crescita rapida può indicare fiducia economica ma anche accumulo di debito insostenibile. Contrazioni brusche possono segnalare stress finanziario delle famiglie.', 
          units: 'Billions of Dollars', 
          categoryKey: 'Solidità Economica' 
        },
        { 
          id: 'DRCCLACBS', 
          name: 'Insolvenza Carte Credito', 
          description: 'Tasso di insolvenza sui prestiti via carte di credito presso banche commerciali americane. Aumenti significativi segnalano stress finanziario delle famiglie e possono precedere rallentamenti nei consumi. Valori superiori al 3-4% sono considerati preoccupanti per la stabilità del sistema bancario.', 
          units: 'Percent', 
          categoryKey: 'Solidità Economica' 
        }
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
            
            // WORKAROUND: Il backend ignora sort_order, forza inversione
            if (data.observations && Array.isArray(data.observations)) {
              data.observations.reverse();
            }
            
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
   * � Ricerca indicatori FRED tramite API
   * Cerca nuovi indicatori non presenti nella lista predefinita
   */
  async searchFredSeries(searchText) {
    if (!searchText || searchText.trim().length < 2) {
      return { results: [], error: null };
    }

    try {
      console.log(`🔍 Ricerca FRED per: "${searchText}"`);
      
      const url = `${API_CONFIG.BACKEND_BASE_URL}/api/fred/search?q=${encodeURIComponent(searchText)}&limit=15`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const results = await response.json();
      
      console.log(`✅ Ricerca completata: ${results.length} risultati trovati`);
      
      return {
        results: results,
        error: null
      };
      
    } catch (error) {
      console.error('❌ Errore ricerca FRED:', error.message);
      return {
        results: [],
        error: `Errore ricerca: ${error.message}`
      };
    }
  }

  /**
   * 🔍 Carica una singola serie FRED per ID
   * @param {string} seriesId - ID della serie FRED (es: 'GDP', 'UNRATE')
   * @returns {Promise<Object>} Dati della serie con observations
   */
  async getSingleSeries(seriesId) {
    try {
      console.log(`📊 Caricamento serie FRED: ${seriesId}`);
      
      // Importa backendService
      const { default: backendService } = await import('./backendService.js');
      
      // Carica i dati usando il metodo esistente
      const data = await backendService.getFredSeriesObservations(seriesId, {
        limit: 70 * 12, // 70 anni di dati mensili
        sort_order: 'desc'
      });
      
      if (!data || !data.observations) {
        throw new Error('Nessun dato restituito dal backend');
      }
      
      console.log(`✅ Serie caricata: ${data.observations.length} osservazioni`);
      
      return {
        id: seriesId,
        name: data.title || seriesId,
        observations: data.observations || [],
        units: data.units || '',
        frequency: data.frequency || '',
        seasonal_adjustment: data.seasonal_adjustment || '',
        notes: data.notes || '',
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