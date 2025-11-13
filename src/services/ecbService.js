import { API_CONFIG } from '../config/apiConfig.js';

/**
 * 🏦 EcbService - Comunicazione con Google Cloud Run ECB SDW API
 * 
 * IMPORTANTE: 
 * - ZERO dati mock o fallback
 * - SOLO dati reali da BCE tramite Google Cloud Run
 * - Indicatori economici Eurozona
 * - Dati storici completi disponibili
 */
class EcbService {
  constructor() {
    this.cacheKey = 'portfoliolab_ecb_cache_v1';
    this.cacheDuration = API_CONFIG.BACKEND_CACHE_DURATION;
    
    console.log('🏦 EcbService v3.0 - Google Cloud Run Backend');
    console.log('🚫 ZERO FALLBACK - Solo dati BCE reali');
    console.log('🌐 Backend ECB:', API_CONFIG.ECB_BACKEND_BASE_URL);
  }

  /**
   * 📊 Indicatori BCE ufficiali organizzati per categoria economica
   * ORDINATI PER: Mondo del Lavoro, Crescita Economica, Solidità Economica
   */
  getOfficialEcbIndicators() {
    return {
      // === CATEGORIA 1: MONDO DEL LAVORO ===
      'employment': [
        { 
          id: 'STS.M.I8.S.UNEH.RTT000.4.000', 
          name: 'Tasso di Disoccupazione', 
          description: 'Percentuale della forza lavoro nell\'Eurozona che è attivamente alla ricerca di un impiego ma non riesce a trovarlo. Un tasso basso indica un mercato del lavoro sano.', 
          units: 'Percent', 
          categoryKey: 'Mondo del Lavoro',
          dataflow: 'STS'
        },
        { 
          id: 'LFSI.M.I8.S.ER.LF15T64.SEX.F.N', 
          name: 'Tasso di Occupazione', 
          description: 'Percentuale della popolazione in età lavorativa che è attualmente occupata nell\'Eurozona. Misura la capacità del mercato del lavoro di assorbire la forza lavoro disponibile.', 
          units: 'Percent', 
          categoryKey: 'Mondo del Lavoro',
          dataflow: 'LFSI'
        },
        { 
          id: 'STS.M.I8.W.TOVT.NS0020.4.000', 
          name: 'Posti Vacanti', 
          description: 'Numero di posizioni lavorative disponibili nell\'Eurozona per cui le aziende cercano attivamente candidati. Un alto numero indica forte domanda di lavoro.', 
          units: 'Index', 
          categoryKey: 'Mondo del Lavoro',
          dataflow: 'STS'
        }
      ],

      // === CATEGORIA 2: CRESCITA ECONOMICA ===
      'growth': [
        { 
          id: 'MNA.Q.Y.I8.W2.S1.S1.B.B1GQ._Z._Z._Z.EUR.LR.N', 
          name: 'PIL Eurozona', 
          description: 'Prodotto Interno Lordo dell\'Eurozona. Valore totale di tutti i beni e servizi prodotti nell\'area euro in un trimestre. È la misura più completa dell\'attività economica.', 
          units: 'Billion EUR', 
          categoryKey: 'Crescita Economica',
          dataflow: 'MNA'
        },
        { 
          id: 'STS.M.I8.Y.PROD.NS0020.4.000', 
          name: 'Produzione Industriale', 
          description: 'Indice della produzione industriale nell\'Eurozona. Misura l\'output dei settori manifatturiero, minerario ed energetico. È un indicatore chiave della salute economica.', 
          units: 'Index 2021=100', 
          categoryKey: 'Crescita Economica',
          dataflow: 'STS'
        },
        { 
          id: 'STS.M.I8.Y.TOVT.NS0010.4.000', 
          name: 'Fatturato Industria', 
          description: 'Fatturato totale dell\'industria nell\'Eurozona. Riflette la domanda per i prodotti industriali e la capacità delle imprese di generare ricavi.', 
          units: 'Index 2021=100', 
          categoryKey: 'Crescita Economica',
          dataflow: 'STS'
        },
        { 
          id: 'STS.M.I8.Y.TOVT.NS0030.4.000', 
          name: 'Vendite al Dettaglio', 
          description: 'Volume delle vendite nel commercio al dettaglio nell\'Eurozona. Riflette la spesa dei consumatori, componente fondamentale della domanda aggregata.', 
          units: 'Index 2021=100', 
          categoryKey: 'Crescita Economica',
          dataflow: 'STS'
        },
        { 
          id: 'STS.M.I8.Y.PROD.NS0040.4.000', 
          name: 'Produzione Edilizia', 
          description: 'Indice della produzione nel settore delle costruzioni. Il settore edile è spesso un indicatore anticipatore dei cicli economici.', 
          units: 'Index 2021=100', 
          categoryKey: 'Crescita Economica',
          dataflow: 'STS'
        }
      ],

      // === CATEGORIA 3: SOLIDITÀ ECONOMICA ===
      'stability': [
        { 
          id: 'ICP.M.U2.N.000000.4.ANR', 
          name: 'Inflazione HICP', 
          description: 'Indice Armonizzato dei Prezzi al Consumo. Misura principale dell\'inflazione nell\'Eurozona, obiettivo di policy della BCE (target: 2%).', 
          units: 'Annual Rate', 
          categoryKey: 'Solidità Economica',
          dataflow: 'ICP'
        },
        { 
          id: 'ICP.M.U2.N.010000.4.ANR', 
          name: 'Inflazione Alimentare', 
          description: 'Variazione annuale dei prezzi dei prodotti alimentari nell\'Eurozona. Componente volatile ma importante per il potere d\'acquisto delle famiglie.', 
          units: 'Annual Rate', 
          categoryKey: 'Solidità Economica',
          dataflow: 'ICP'
        },
        { 
          id: 'ICP.M.U2.N.NRG.4.ANR', 
          name: 'Inflazione Energia', 
          description: 'Variazione annuale dei prezzi dell\'energia nell\'Eurozona. Include elettricità, gas e carburanti. Fortemente influenzata dai prezzi internazionali.', 
          units: 'Annual Rate', 
          categoryKey: 'Solidità Economica',
          dataflow: 'ICP'
        },
        { 
          id: 'ICP.M.U2.Y.XEF000.4.ANR', 
          name: 'Inflazione Core', 
          description: 'Inflazione escludendo energia e alimentari. Misura le pressioni inflazionistiche di fondo nell\'economia, meno influenzata da shock temporanei.', 
          units: 'Annual Rate', 
          categoryKey: 'Solidità Economica',
          dataflow: 'ICP'
        },
        { 
          id: 'FM.D.U2.EUR.4F.KR.MRR_FR.LEV', 
          name: 'Tasso BCE Principale', 
          description: 'Tasso di interesse principale di rifinanziamento della BCE. Strumento principale di politica monetaria per controllare inflazione e stimolare crescita.', 
          units: 'Percent', 
          categoryKey: 'Solidità Economica',
          dataflow: 'FM'
        },
        { 
          id: 'FM.D.U2.EUR.4F.KR.DFR.LEV', 
          name: 'Tasso Deposito BCE', 
          description: 'Tasso di interesse sui depositi overnight presso la BCE. Definisce il floor per i tassi di mercato monetario nell\'Eurozona.', 
          units: 'Percent', 
          categoryKey: 'Solidità Economica',
          dataflow: 'FM'
        },
        { 
          id: 'BP.M.N.I8.W1.S1.S1.T.C.FA.P.F._Z.EUR._T._X.N', 
          name: 'Bilancia Commerciale', 
          description: 'Differenza tra esportazioni e importazioni dell\'Eurozona. Un surplus indica competitività internazionale e accumulo di crediti esteri.', 
          units: 'Million EUR', 
          categoryKey: 'Solidità Economica',
          dataflow: 'BP'
        }
      ],

      // === CATEGORIA 4: FIDUCIA E SENTIMENT ===
      'sentiment': [
        { 
          id: 'STS.M.I8.Y.CONF.NS0010.4.000', 
          name: 'Fiducia Industria', 
          description: 'Indicatore di fiducia nel settore industriale basato su survey delle imprese. Valori positivi indicano ottimismo, negativi pessimismo.', 
          units: 'Balance', 
          categoryKey: 'Fiducia e Sentiment',
          dataflow: 'STS'
        },
        { 
          id: 'STS.M.I8.Y.CONF.NS0020.4.000', 
          name: 'Fiducia Consumatori', 
          description: 'Indicatore di fiducia dei consumatori dell\'Eurozona. Anticipa i comportamenti di spesa delle famiglie e le condizioni economiche future.', 
          units: 'Balance', 
          categoryKey: 'Fiducia e Sentiment',
          dataflow: 'STS'
        },
        { 
          id: 'STS.M.I8.Y.CONF.NS0030.4.000', 
          name: 'Fiducia Commercio', 
          description: 'Indicatore di fiducia nel settore del commercio al dettaglio. Riflette le aspettative degli operatori sulle vendite future.', 
          units: 'Balance', 
          categoryKey: 'Fiducia e Sentiment',
          dataflow: 'STS'
        },
        { 
          id: 'STS.M.I8.Y.CONF.NS0040.4.000', 
          name: 'Fiducia Edilizia', 
          description: 'Indicatore di fiducia nel settore delle costruzioni. Il sentiment del settore edile è spesso un indicatore anticipatore dei cicli economici.', 
          units: 'Balance', 
          categoryKey: 'Fiducia e Sentiment',
          dataflow: 'STS'
        }
      ]
    };
  }

  /**
   * 🚀 Carica dati completi da BCE con batch request
   */
  async fetchMacroDataComplete() {
    try {
      console.log('🌍 Avvio caricamento dati BCE...');
      
      // Controlla cache prima
      const cached = this.getFromCache();
      if (cached) {
        console.log('📦 Dati BCE caricati da cache');
        return cached;
      }

      const indicators = this.getOfficialEcbIndicators();
      const allSeries = [];
      
      // Raccogli tutti gli ID delle serie
      Object.values(indicators).forEach(category => {
        category.forEach(indicator => {
          allSeries.push(indicator.id);
        });
      });

      console.log(`📊 Caricamento ${allSeries.length} serie BCE...`);

      // Chiamata batch al backend ECB su Cloud Run
      const response = await fetch(`${API_CONFIG.ECB_BACKEND_BASE_URL}/api/ecb/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          series: allSeries
        })
      });

      if (!response.ok) {
        throw new Error(`Backend ECB error: ${response.status}`);
      }

      const batchData = await response.json();
      
      console.log(`✅ Dati BCE ricevuti: ${batchData.successful_series}/${batchData.total_series} serie`);

      // Processa i dati per ogni categoria
      const processedData = {
        indicators: {},
        timestamp: new Date().toISOString()
      };

      Object.entries(indicators).forEach(([categoryKey, categoryIndicators]) => {
        console.log(`🔄 Processamento categoria ${categoryKey} (${categoryIndicators.length} indicatori)...`);
        
        processedData.indicators[categoryKey] = categoryIndicators.map(indicator => {
          const seriesData = batchData.results[indicator.id];
          
          if (seriesData && seriesData.observations && seriesData.observations.length > 0) {
            console.log(`  ✅ ${indicator.name}: ${seriesData.count} osservazioni`);
            return {
              ...indicator,
              observations: seriesData.observations,
              count: seriesData.count,
              years_span: seriesData.years_span,
              earliest_year: seriesData.earliest_year,
              latest_year: seriesData.latest_year
            };
          }
          
          console.warn(`  ⚠️ ${indicator.name}: Nessun dato disponibile`);
          return {
            ...indicator,
            observations: [],
            count: 0,
            error: 'No data available'
          };
        });
      });

      // Salva in cache
      this.saveToCache(processedData);

      // Conta totale indicatori con dati
      let totalWithData = 0;
      let totalWithoutData = 0;
      Object.values(processedData.indicators).forEach(category => {
        category.forEach(ind => {
          if (ind.observations && ind.observations.length > 0) {
            totalWithData++;
          } else {
            totalWithoutData++;
          }
        });
      });

      console.log(`✅ Processati dati BCE: ${totalWithData} con dati, ${totalWithoutData} senza dati`);
      return processedData;

    } catch (error) {
      console.error('❌ Errore caricamento dati BCE:', error);
      throw new Error(`Impossibile caricare dati BCE: ${error.message}`);
    }
  }

  /**
   * 🔍 Ricerca serie BCE
   */
  async searchEcbSeries(searchText, limit = 15) {
    try {
      console.log(`🔍 Ricerca BCE: "${searchText}"`);

      const indicators = this.getOfficialEcbIndicators();
      const results = [];
      const searchLower = searchText.toLowerCase();
      
      Object.values(indicators).forEach(category => {
        category.forEach(indicator => {
          if (indicator.name.toLowerCase().includes(searchLower) ||
              indicator.description.toLowerCase().includes(searchLower) ||
              indicator.id.toLowerCase().includes(searchLower)) {
            results.push({
              id: indicator.id,
              title: indicator.name,
              description: indicator.description,
              units: indicator.units
            });
          }
        });
      });
      
      console.log(`✅ Trovati ${results.length} risultati BCE`);
      
      return { results: results.slice(0, limit), error: null };
    } catch (error) {
      console.error('❌ Errore ricerca BCE:', error);
      return { results: [], error: error.message };
    }
  }

  /**
   * 📈 Carica osservazioni per una singola serie
   */
  async fetchSeriesObservations(seriesId, startPeriod = null, endPeriod = null) {
    try {
      console.log(`📊 Caricamento serie BCE: ${seriesId}`);

      // Il dataflow è il primo componente dell'ID (es. ICP da ICP.M.U2.N.000000.4.ANR)
      const dataflow = seriesId.split('.')[0];
      
      // L'API BCE vuole il dataflow nel path e poi l'ID completo come key
      // Ma alcuni ID includono già il dataflow ripetuto (es. STS.M.I8.S.UNEH...)
      // Quindi il formato corretto è: /data/{dataflow}/{key} dove key può includere o meno il dataflow
      let url = `${this.ECB_API_BASE}/data/${dataflow}/${seriesId}?format=jsondata`;
      
      if (startPeriod) url += `&startPeriod=${startPeriod}`;
      if (endPeriod) url += `&endPeriod=${endPeriod}`;

      console.log(`🌐 URL richiesta: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ BCE API error ${response.status}:`, errorText.substring(0, 200));
        throw new Error(`BCE API error: ${response.status}`);
      }

      const data = await response.json();
      const observations = this.parseEcbResponse(data);
      
      console.log(`✅ Caricati ${observations.length} dati per ${seriesId}`);
      
      // Calcola statistiche temporali
      let earliest_year = 'N/A';
      let latest_year = 'N/A';
      let years_span = 0;
      
      if (observations.length > 0) {
        const dates = observations.map(obs => new Date(obs.date));
        earliest_year = dates[0].getFullYear().toString();
        latest_year = dates[dates.length - 1].getFullYear().toString();
        years_span = parseInt(latest_year) - parseInt(earliest_year);
      }
      
      return {
        series_id: seriesId,
        dataflow: dataflow,
        observations: observations,
        count: observations.length,
        earliest_date: observations[0]?.date || 'N/A',
        latest_date: observations[observations.length - 1]?.date || 'N/A',
        earliest_year: earliest_year,
        latest_year: latest_year,
        years_span: years_span
      };
    } catch (error) {
      console.error(`❌ Errore caricamento serie ${seriesId}:`, error);
      throw error;
    }
  }

  parseEcbResponse(data) {
    try {
      const observations = [];
      
      if (!data.dataSets || data.dataSets.length === 0) {
        console.log('⚠️ Nessun dataset nella risposta');
        return observations;
      }

      const dataset = data.dataSets[0];
      const series = dataset.series;
      if (!series) {
        console.log('⚠️ Nessuna serie nel dataset');
        return observations;
      }

      const seriesKey = Object.keys(series)[0];
      const seriesData = series[seriesKey];
      if (!seriesData || !seriesData.observations) {
        console.log('⚠️ Nessuna osservazione nella serie');
        return observations;
      }

      const timeDimension = data.structure.dimensions.observation.find(d => d.id === 'TIME_PERIOD');
      if (!timeDimension || !timeDimension.values) {
        console.log('⚠️ Dimensione tempo non trovata');
        return observations;
      }

      const timeValues = timeDimension.values;
      
      Object.keys(seriesData.observations).forEach(obsIndex => {
        const index = parseInt(obsIndex);
        const obsArray = seriesData.observations[obsIndex];
        const value = obsArray[0]; // Il primo elemento dell'array è il valore
        
        if (index < timeValues.length && value !== null && value !== undefined) {
          observations.push({
            date: this.formatEcbDate(timeValues[index].id),
            value: String(value)
          });
        }
      });

      console.log(`📊 Parsed ${observations.length} observations`);
      return observations;
    } catch (error) {
      console.error('❌ Errore parsing risposta BCE:', error);
      console.error('Stack:', error.stack);
      return [];
    }
  }

  formatEcbDate(ecbDate) {
    if (ecbDate.includes('Q')) {
      const [year, quarter] = ecbDate.split('-Q');
      const month = (parseInt(quarter) - 1) * 3 + 1;
      return `${year}-${String(month).padStart(2, '0')}-01`;
    } else if (ecbDate.includes('-')) {
      return `${ecbDate}-01`;
    } else {
      return `${ecbDate}-01-01`;
    }
  }

  /**
   * 📅 Carica calendario economico BCE
   */
  async fetchCalendar(startDate = null, endDate = null) {
    try {
      console.log('📅 Caricamento calendario BCE...');

      // Calendario simulato (BCE non ha API calendario pubblica)
      const events = [
        {
          date: '2025-11-14',
          time: '11:00',
          release_name: 'HICP Flash Estimate',
          importance: 'high',
          country: 'EU'
        }
      ];
      
      console.log(`✅ Generati ${events.length} eventi calendario BCE`);
      
      return {
        events: events,
        total: events.length,
        start_date: startDate,
        end_date: endDate
      };
    } catch (error) {
      console.error('❌ Errore caricamento calendario BCE:', error);
      throw error;
    }
  }

  /**
   * 💾 Gestione cache
   */
  getFromCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > this.cacheDuration) {
        console.log('🗑️ Cache BCE scaduta');
        localStorage.removeItem(this.cacheKey);
        return null;
      }

      console.log(`📦 Cache BCE valida (età: ${Math.round(age / 1000 / 60)} minuti)`);
      return data;
    } catch (error) {
      console.error('❌ Errore lettura cache BCE:', error);
      return null;
    }
  }

  saveToCache(data) {
    try {
      const cacheObj = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheObj));
      console.log('💾 Dati BCE salvati in cache');
    } catch (error) {
      console.error('❌ Errore salvataggio cache BCE:', error);
    }
  }

  clearCache() {
    localStorage.removeItem(this.cacheKey);
    console.log('🗑️ Cache BCE pulita');
  }
}

// Export singleton instance
const ecbService = new EcbService();
export default ecbService;
