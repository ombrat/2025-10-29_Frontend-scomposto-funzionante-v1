import { API_CONFIG } from '../config/apiConfig.js';

/**
 * 🌐 Backend Service - Comunicazione con Google Cloud Run
 * Servizio per gestire tutte le chiamate al backend
 */
class BackendService {
  constructor() {
    this.baseURL = API_CONFIG.BACKEND_BASE_URL;
    this.timeout = API_CONFIG.REQUEST_TIMEOUT;
    this.cacheKey = 'portfoliolab_backend_cache';
    this.cacheDuration = API_CONFIG.BACKEND_CACHE_DURATION;
    
    console.log('🌐 Backend Service inizializzato:', this.baseURL);
  }

  /**
   * 🏥 Test di connessione e health check
   */
  async checkHealth() {
    try {
      console.log('🔍 Controllo salute backend...');
      
      const response = await this.makeRequest('/health', {
        method: 'GET'
      });
      
      console.log('✅ Backend disponibile:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Backend non raggiungibile:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Ottieni indicatori economici principali
   */
  async getMainIndicators() {
    try {
      console.log('📊 Caricamento indicatori principali...');
      
      const response = await this.makeRequest('/api/fred/main-indicators', {
        method: 'GET'
      });
      
      console.log('✅ Indicatori caricati:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Errore caricamento indicatori:', error.message);
      throw error;
    }
  }

  /**
   * 📈 Ottieni dati storici per una serie specifica
   */
  async getSeriesHistory(seriesId, years = 5) {
    try {
      console.log(`📈 Caricamento storico per ${seriesId}...`);
      // Il backend proxy espone /api/fred/series/:series_id/history?limit=N
      // Convertiamo years in un limite approssimativo di mesi (years * 12)
      const limit = Math.max(1, Math.floor(years * 12));
      const response = await this.makeRequest(`/api/fred/series/${seriesId}/history`, {
        method: 'GET',
        params: { limit }
      });
      
      console.log(`✅ Storico ${seriesId} caricato:`, response);
      return response;
      
    } catch (error) {
      console.error(`❌ Errore caricamento storico ${seriesId}:`, error.message);
      throw error;
    }
  }

  /**
   * 🔍 Cerca serie economiche
   */
  async searchSeries(searchText, limit = 10) {
    try {
      console.log(`🔍 Ricerca serie: "${searchText}"...`);
      
      const response = await this.makeRequest('/api/fred/search', {
        method: 'GET',
        params: { search_text: searchText, limit }
      });
      
      console.log(`✅ Risultati ricerca trovati:`, response);
      return response;
      
    } catch (error) {
      console.error(`❌ Errore ricerca serie:`, error.message);
      throw error;
    }
  }

  /**
   * 📅 Ottieni le release economiche
   */
  async getReleases(options = {}) {
    try {
      console.log('📅 Caricamento release economiche...');
      
      const { limit = 20, realtime_start, realtime_end } = options;
      
      const params = { limit };
      if (realtime_start) params.realtime_start = realtime_start;
      if (realtime_end) params.realtime_end = realtime_end;
      
      const response = await this.makeRequest('/api/fred/releases', {
        method: 'GET',
        params
      });
      
      console.log('✅ Release economiche caricate:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Errore caricamento release:', error.message);
      throw error;
    }
  }



  /**
   * 📦 Richiesta batch per più serie
   */
  async getBatchData(seriesIds, years = 5) {
    try {
      console.log(`📦 Caricamento batch per ${seriesIds.length} serie...`);
      // Il backend proxy si aspetta body: { series: [ ... ] }
      const response = await this.makeRequest('/api/fred/batch', {
        method: 'POST',
        body: { series: seriesIds }
      });
      
      console.log(`✅ Batch caricato:`, response);
      return response;
      
    } catch (error) {
      console.error(`❌ Errore caricamento batch:`, error.message);
      throw error;
    }
  }

  /**
   * 📊 Ottieni osservazioni per una serie FRED specifica
   */
  async getFredSeriesObservations(seriesId, options = {}) {
    try {
      console.log(`🔍 Caricamento osservazioni per serie ${seriesId}...`);
      
      const params = {
        limit: options.limit || 1000,
        sort_order: options.sort_order || 'asc',
        ...(options.start_date && { start_date: options.start_date }),
        ...(options.end_date && { end_date: options.end_date })
      };
      
      const response = await this.makeRequest(`/api/fred/series/${seriesId}/observations`, {
        method: 'GET',
        params
      });
      
      console.log(`✅ ${seriesId}: ${response.observations?.length || 0} osservazioni caricate`);
      return response;
      
    } catch (error) {
      console.error(`❌ Errore caricamento ${seriesId}:`, error.message);
      throw error;
    }
  }

  /**
   * Ottieni le release dal proxy FRED
   */
  async getReleases(params = {}) {
    try {
      const response = await this.makeRequest('/api/fred/releases', {
        method: 'GET',
        params
      });
      return response;
    } catch (error) {
      console.error('❌ Errore getReleases:', error.message);
      throw error;
    }
  }

  /**
   * 🛠️ Metodo helper per fare richieste HTTP
   */
  async makeRequest(endpoint, options = {}) {
    const { method = 'GET', params = {}, body = null, useCache = true } = options;
    
    // Costruisci URL completo
    let url = `${this.baseURL}${endpoint}`;
    
    // Aggiungi parametri query se presenti
    if (method === 'GET' && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    // Controlla cache per richieste GET
    const cacheKey = `${this.cacheKey}_${url}`;
    if (method === 'GET' && useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📦 Dati recuperati dalla cache:', endpoint);
        return cached;
      }
    }

    // Configurazione richiesta
    const requestConfig = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: this.timeout
    };

    // Aggiungi body per richieste POST/PUT
    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    try {
      console.log(`🌐 ${method} ${url}`);
      
      const response = await Promise.race([
        fetch(url, requestConfig),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        )
      ]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Salva in cache per richieste GET
      if (method === 'GET' && useCache) {
        this.saveToCache(cacheKey, data);
      }

      return data;

    } catch (error) {
      console.error(`❌ Errore richiesta ${method} ${endpoint}:`, error.message);
      throw new Error(`Backend request failed: ${error.message}`);
    }
  }

  /**
   * 💾 Salva dati in cache
   */
  saveToCache(key, data) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + this.cacheDuration
      };
      localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('⚠️ Errore salvataggio cache:', error.message);
    }
  }

  /**
   * 📦 Recupera dati dalla cache
   */
  getFromCache(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      
      // Controlla se la cache è ancora valida
      if (Date.now() > cacheEntry.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn('⚠️ Errore lettura cache:', error.message);
      return null;
    }
  }

  /**
   * 🧹 Pulisce la cache
   */
  clearCache() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cacheKey));
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
      
      console.log(`✅ Cache pulita: ${cacheKeys.length} entries rimosse`);
    } catch (error) {
      console.warn('⚠️ Errore pulizia cache:', error.message);
    }
  }

  /**
   * 📊 Ottieni statistiche cache
   */
  getCacheStats() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cacheKey));
      
      let totalSize = 0;
      let validEntries = 0;
      let expiredEntries = 0;

      cacheKeys.forEach(key => {
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          totalSize += localStorage.getItem(key).length;
          
          if (Date.now() > entry.expiry) {
            expiredEntries++;
          } else {
            validEntries++;
          }
        } catch (error) {
          // Entry corrotta, ignora
        }
      });

      return {
        totalEntries: cacheKeys.length,
        validEntries,
        expiredEntries,
        totalSizeKB: Math.round(totalSize / 1024)
      };
    } catch (error) {
      console.warn('⚠️ Errore statistiche cache:', error.message);
      return null;
    }
  }
}

// Export singleton
const backendService = new BackendService();
export default backendService;