// Configurazione API per il frontend
export const API_CONFIG = {
  // Backend principale su Google Cloud Run
  BACKEND_BASE_URL: 'https://fred-api-proxy-21722357706.europe-west1.run.app',
  
  // Alpha Vantage per news finanziarie
  ALPHA_VANTAGE_KEY: 'M768ALQQ3JVUXCGC',
  
  // Rate limits
  REQUESTS_PER_MINUTE: 120,
  MAX_CONCURRENT_REQUESTS: 10,
  
  // Timeout per le richieste API
  REQUEST_TIMEOUT: 8000, // 8 secondi per dati storici
  
  // Cache duration (in millisecondi)
  CACHE_DURATION: 4 * 60 * 60 * 1000, // 4 ore per dati macro
  BACKEND_CACHE_DURATION: 12 * 60 * 60 * 1000, // 12 ore per dati backend
};

// Istruzioni per ottenere le API keys:
/*
 ALPHA VANTAGE (Gratuita - 5 richieste/minuto, 500/giorno):
1. Vai su https://www.alphavantage.co/support/#api-key
2. Inserisci il tuo email
3. Copia la API key e sostituisci il valore sopra

ALTERNATIVE GRATUITE:
- Financial Modeling Prep: https://financialmodelingprep.com/developer/docs (250 richieste/giorno)
- Polygon.io: https://polygon.io/ (5 richieste/minuto)  
- Yahoo Finance (tramite librerie unofficiali)
*/