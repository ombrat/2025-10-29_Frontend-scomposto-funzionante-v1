# 🚀 Deploy Backend Yahoo Finance su Google Cloud Run

## ✅ Situazione Attuale

Il frontend è pronto e funzionante con questi file:
- `src/services/yahooFinanceService.js` - Service completo
- `src/pages/StockAnalysisPage.jsx` - Dashboard analisi azioni
- Route `/stocks` attiva nel menu "🏦 Azioni"

**Il backend ha già tutto il codice necessario** (app.py locale), ma serve il deploy su Cloud Run.

---

## 📋 Endpoint Richiesti (già nel codice)

### 1. `/api/search_tickers` ✅
```python
@app.route('/api/search_tickers', methods=['GET'])
def search_tickers():
    # Cerca ticker tramite Yahoo Finance API
    # Parametro: q (query string)
    # Ritorna: lista di {ticker, name}
```

### 2. `/api/ticker_info` ✅
```python
@app.route('/api/ticker_info', methods=['GET'])
def get_ticker_info():
    # Ottiene dizionario completo .info da yfinance
    # Parametro: ticker (es. AAPL)
    # Ritorna: JSON con 40+ metriche finanziarie
```

### 3. `/api/ticker_history` ✅
```python
@app.route('/api/ticker_history', methods=['GET'])
def get_ticker_history():
    # Ottiene storico prezzi
    # Parametri: ticker, period (1y default), interval (1d default)
    # Ritorna: array di {Date, Open, High, Low, Close, Volume}
```

---

## 🔧 Procedura di Deploy

### Opzione 1: Deploy da Terminale (Consigliata)

```bash
# 1. Vai alla cartella del backend
cd /path/to/backend/folder

# 2. Assicurati che requirements.txt includa yfinance
cat requirements.txt | grep yfinance

# 3. Deploy su Cloud Run
gcloud run deploy backtest-server-final \
  --source . \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 300

# 4. Annota il nuovo URL di deploy
```

### Opzione 2: Deploy da Cloud Console

1. Vai su [Cloud Run Console](https://console.cloud.google.com/run)
2. Seleziona il servizio `backtest-server-final`
3. Click su "EDIT & DEPLOY NEW REVISION"
4. Carica il file `app.py` aggiornato
5. Verifica che `requirements.txt` includa:
   ```
   yfinance>=0.2.0
   requests
   ```
6. Deploy

---

## ✅ Verifica Post-Deploy

### 1. Test Search Endpoint
```bash
curl "https://backtest-server-final-453907803757.europe-west3.run.app/api/search_tickers?q=aapl"
```

**Output atteso:**
```json
[
  {"ticker": "AAPL", "name": "Apple Inc. (NMS)"},
  {"ticker": "AAPL34.SA", "name": "Apple Inc. (SAO)"},
  ...
]
```

### 2. Test Ticker Info Endpoint
```bash
curl "https://backtest-server-final-453907803757.europe-west3.run.app/api/ticker_info?ticker=AAPL"
```

**Output atteso:**
```json
{
  "symbol": "AAPL",
  "longName": "Apple Inc.",
  "marketCap": 3500000000000,
  "currentPrice": 195.50,
  "trailingPE": 31.25,
  ...
}
```

### 3. Test Ticker History Endpoint
```bash
curl "https://backtest-server-final-453907803757.europe-west3.run.app/api/ticker_history?ticker=AAPL&period=1mo&interval=1d"
```

**Output atteso:**
```json
[
  {"Date": "2024-10-15", "Open": 190.5, "High": 192.3, "Low": 189.8, "Close": 191.2, "Volume": 45000000},
  {"Date": "2024-10-16", "Open": 191.5, "High": 193.1, "Low": 190.9, "Close": 192.8, "Volume": 48000000},
  ...
]
```

---

## 🧪 Test Completo nel Frontend

1. Apri l'app: http://localhost:5173/stocks
2. Cerca "apple" → Dovresti vedere risultati
3. Clicca su "AAPL" → Dashboard dovrebbe caricarsi con tutte le metriche

---

## 🐛 Troubleshooting

### Errore 404 su /api/ticker_info
**Causa:** Backend non aggiornato
**Soluzione:** Rideploya il servizio con app.py attuale

### Errore 500 Internal Server Error
**Causa:** Libreria yfinance non installata o ticker invalido
**Soluzione:** 
- Verifica requirements.txt
- Controlla i log: `gcloud run logs read backtest-server-final --region europe-west3`

### CORS Error
**Causa:** CORS non abilitato
**Soluzione:** Già presente nel codice: `CORS(app, resources={r"/*": {"origins": "*"}})`

### Timeout dopo 60 secondi
**Causa:** Timeout Cloud Run troppo basso
**Soluzione:** Deploy con `--timeout 300` (già incluso sopra)

---

## 📊 Metriche Disponibili nel Dashboard

Il frontend organizza le info in 9 categorie:

1. **Overview**: symbol, name, sector, industry, country
2. **Prices**: currentPrice, previousClose, fiftyTwoWeekHigh/Low
3. **Valuation**: marketCap, trailingPE, priceToBook, priceToSales, pegRatio
4. **Dividends**: dividendYield, dividendRate, payoutRatio
5. **Financials**: totalRevenue, totalDebt, debtToEquity
6. **Profitability**: profitMargins, returnOnAssets, returnOnEquity
7. **Growth**: revenueGrowth, earningsGrowth
8. **Analysts**: targetHighPrice, targetLowPrice, targetMeanPrice, recommendationKey
9. **Risk**: beta, averageVolume

---

## 🎯 Prossimi Passi

1. ✅ **Deploy backend** (seguire procedura sopra)
2. ✅ **Test endpoint** (curl commands)
3. ✅ **Test frontend completo** (ricerca + caricamento dati)
4. 🚀 **Feature completa e funzionante!**
