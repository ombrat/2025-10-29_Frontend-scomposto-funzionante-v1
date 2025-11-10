# Backend News - Alpha Vantage API Proxy

Proxy server per l'API Alpha Vantage News che risolve i problemi CORS e gestisce l'autenticazione.

## Setup

1. **Installazione dipendenze:**
```bash
pip install -r requirements.txt
```

2. **Configurazione API Key:**
```bash
# Crea file .env
echo "ALPHA_VANTAGE_API_KEY=your_actual_api_key_here" > .env
```

3. **Avvio rapido:**
```bash
./start.sh
```

## Endpoints

### Health Check
```
GET /health
```
Ritorna lo stato del servizio e se l'API key è configurata.

### News
```
GET /news?tickers=AAPL,MSFT&topics=earnings&limit=10
```

**Parametri supportati:**
- `tickers`: ticker separati da virgola (default: principali US stocks)
- `topics`: topics separati da virgola (financial_markets, earnings, ipo, etc.)
- `limit`: numero massimo di articoli (default: 10)

### Test
```
GET /news/test
```
Ritorna dati di test per verificare che il proxy funzioni.

## Configurazione Frontend

Nel tuo `newsService.js`, cambia l'URL base:
```javascript
const API_BASE_URL = 'http://localhost:8001';
```

## Note

- Porta: **8001**
- API Key Alpha Vantage richiesta per dati reali
- Gestisce automaticamente CORS
- Logging completo per debugging
