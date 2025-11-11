# 📊💹 Asset Comparison Feature - Documentazione

## 🎯 Nuova Funzionalità Implementata

La sezione di confronto in **AnalysisPage** ora supporta il confronto tra:
- **Indicatore economico vs Indicatore economico** (funzionalità esistente)
- **Indicatore economico vs Asset finanziario** ✨ **NUOVO!**

## 🚀 Come Funziona

### Flusso Utente

1. **Selezione Indicatore Primario**
   - L'utente clicca su "Confronta" su un qualsiasi indicatore economico
   - Si apre la sezione CompareSection

2. **Toggle Modalità Ricerca**
   - **📊 Indicatori Economici**: Cerca tra indicatori locali (32) + FRED API
   - **📈 Asset Finanziari**: Cerca ticker su Yahoo Finance (azioni, ETF, crypto)

3. **Ricerca Asset**
   - Digita il ticker (es: AAPL, SPY, TSLA, BTC-USD)
   - Risultati in tempo reale da backend
   - Click per caricare i dati storici

4. **Visualizzazione Grafico**
   - Grafico normalizzato 0-100% per confronto visuale
   - Tooltip con valori reali di entrambe le serie
   - Legenda distintiva (linea solida vs tratteggiata)

## 🔧 Architettura Tecnica

### API Endpoint

#### getAssetHistory (api.js)
```javascript
export async function getAssetHistory(ticker, startDate, endDate)
```

**Implementazione:**
- Usa l'endpoint `/backtest` esistente con un singolo asset
- Payload:
  ```json
  {
    "assets": [{ "ticker": "AAPL", "weight": 1.0 }],
    "initial_investment": 10000,
    "start_date": "2023-01-01",
    "end_date": "2024-01-01"
  }
  ```
- Restituisce `chart_data` con valori giornalieri

#### searchTickers (api.js)
```javascript
export async function searchTickers(query)
```
- Ricerca ticker su Yahoo Finance
- Già esistente, riutilizzato per la nuova feature

### Componenti Modificati

#### 1. CompareSection.jsx

**Nuovi Stati:**
```javascript
const [searchMode, setSearchMode] = useState('indicators'); // 'indicators' | 'assets'
const [assetSearchResults, setAssetSearchResults] = useState([]);
```

**Nuova Logica:**
- Toggle tra modalità indicatori e asset
- Ricerca duale (FRED + Yahoo Finance)
- Caricamento dati asset tramite `getAssetHistory`
- Allineamento temporale automatico con indicatore primario

**Funzione Chiave: handleSelectIndicator**
```javascript
if (indicator.source === 'yahoo') {
  // 1. Calcola range temporale dall'indicatore primario
  // 2. Chiama getAssetHistory(ticker, startDate, endDate)
  // 3. Normalizza dati: (Value / firstValue) * 100
  // 4. Trasforma in formato observations
  // 5. Passa a CompareChart con flag isAsset: true
}
```

#### 2. CompareChart.jsx

**Nuovi Flag:**
```javascript
const isSecondaryAsset = secondary.isAsset === true;
const isPrimaryAsset = primary.isAsset === true;
```

**Modifiche UI:**
- Titolo dinamico: "📊💹 Confronto Indicatore vs Asset"
- Info badge per spiegare la normalizzazione
- Emoji differenziati nel tooltip e legenda
- Colore verde (#66bb6a) per asset

## 📊 Normalizzazione Dati

### Perché Normalizzare?

Gli indicatori economici e gli asset hanno scale completamente diverse:
- GDP: Trilioni di dollari
- Tasso Disoccupazione: Percentuale 0-15%
- AAPL: Prezzo $150-200
- BTC: Prezzo $30,000-60,000

### Come Funziona

#### Per Indicatori FRED
```javascript
normalizedValue = ((value - min) / (max - min)) * 100
```
- Scala da valore minimo (0%) a valore massimo (100%)

#### Per Asset Yahoo Finance
```javascript
indexValue = (currentValue / firstValue) * 100
```
- Base 100 al primo giorno del periodo
- Mostra performance relativa (es: 150 = +50%, 80 = -20%)

### Esempio Pratico

```
Confronto: UNRATE (Disoccupazione) vs AAPL (Apple)

UNRATE:
  Min: 3.5%  → 0% nel grafico
  Max: 14.7% → 100% nel grafico
  Attuale: 4.0% → 5% nel grafico

AAPL:
  Primo giorno: $150 → 100 nel grafico
  Oggi: $180 → 120 nel grafico (+20%)
  Picco: $195 → 130 nel grafico (+30%)
```

## 🎨 UI/UX Design

### Toggle Modalità
```
┌─────────────────────────────────────┐
│ [📊 Indicatori Economici] [📈 Asset]│
└─────────────────────────────────────┘
```
- Blu per indicatori
- Verde per asset
- Transizione fluida 0.2s

### Risultati Ricerca

#### Indicatori
```
┌──────────────────────────────────┐
│ 📊 GDP - Prodotto Interno Lordo  │
│    🔍 FRED Search • Da caricare  │
└──────────────────────────────────┘
```

#### Asset
```
┌──────────────────────────────────┐
│ 💹 AAPL - Apple Inc.             │
│    📈 Yahoo Finance • NASDAQ     │
└──────────────────────────────────┘
```

### Grafico

```
100% ┼─────────────────────────────
     │    ╱╮    ╱─╮               ← UNRATE (blu, solido)
 75% ┼───╱ ╰──╱  │   
     │  ╱       │  ╱━━╮           ← AAPL (verde, tratteggiato)
 50% ┼─╱        └─╱   ┃
     │╱            ╲  ┃
 25% ┼              ╲━╯
     │
  0% ┼─────────────────────────────
     gen '23  lug '23  gen '24

━━━ UNRATE    ┄┄┄ AAPL
```

## 🧪 Testing

### Test Manuale

1. Vai su AnalysisPage
2. Click "Confronta" su GDP
3. Click toggle "📈 Asset Finanziari"
4. Cerca "AAPL"
5. Click su Apple Inc.
6. Verifica grafico di confronto
7. Hover per vedere valori
8. Prova con altri ticker (SPY, TSLA, BTC-USD)

### Casi d'Uso

#### 1. Disoccupazione vs Tech Stocks
- UNRATE vs AAPL/MSFT/NVDA
- Mostra come il tech performa quando la disoccupazione sale/scende

#### 2. GDP vs Mercato Azionario
- GDP vs SPY (S&P 500)
- Correlazione crescita economica e mercato

#### 3. Tassi Fed vs Bond
- FEDFUNDS vs TLT (Treasury Bond ETF)
- Relazione inversa tassi/obbligazioni

#### 4. Inflazione vs Gold
- CPIAUCSL vs GLD (Gold ETF)
- Gold come hedge contro inflazione

## ⚡ Performance

### Ottimizzazioni

1. **Debounce 300ms**: Evita troppe chiamate API durante la digitazione
2. **Campionamento**: Max 300 punti per grafico fluido
3. **Allineamento Temporale**: Carica solo il range necessario
4. **Cache**: Indicatori già caricati non vengono richiesti

### Limiti Backend

- Timeout: 60 secondi
- Rate limit: Gestito da Google Cloud Run
- Yahoo Finance: Limitato a ticker disponibili

## 🔮 Future Enhancements

### Possibili Miglioramenti

1. **📈 Calcolo Correlazione**
   ```javascript
   correlationCoefficient = calculateCorrelation(series1, series2)
   ```
   - Mostra r² tra -1 e +1
   - Indicatore di forza della relazione

2. **📊 Multi-Asset Comparison**
   - Confronta 1 indicatore con 2-3 asset simultaneamente
   - Overlay multiplo

3. **🔔 Alert Divergenze**
   - Notifica quando correlazione cambia significativamente
   - Pattern di divergenza (indicatore sale, asset scende)

4. **💾 Salva Confronti**
   - Bookmark confronti interessanti
   - Dashboard personalizzata

5. **📥 Export Enhanced**
   - Download grafico come PNG/SVG
   - Export dati correlazione come CSV

6. **🎯 Preset Popolari**
   - "GDP vs S&P 500"
   - "Inflazione vs Gold"
   - "Fed Funds vs Tech Stocks"

## 🐛 Troubleshooting

### Problemi Comuni

#### "Nessun dato disponibile per questo asset"
- **Causa**: Ticker non valido o non trovato su Yahoo Finance
- **Soluzione**: Verifica ticker esatto (es: BTC-USD non BTC)

#### "Errore durante il caricamento"
- **Causa**: Timeout backend o problemi di rete
- **Soluzione**: Riprova, verifica connessione

#### Grafico vuoto
- **Causa**: Date non si sovrappongono
- **Soluzione**: Scegli asset con dati nel range temporale dell'indicatore

#### Performance lenta
- **Causa**: Troppi dati da processare
- **Soluzione**: Già ottimizzato con campionamento a 300 punti

## 📝 Note Tecniche

### Dipendenze
- **Nessuna nuova dipendenza** 
- Usa API esistenti (searchTickers, postBacktest)
- Componenti già presenti (CompareChart, CompareSection)

### Compatibilità
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile responsive

### Security
- Nessun dato sensibile memorizzato
- API calls tramite backend proxy sicuro
- CORS gestito da Google Cloud Run

---

## 🎉 Conclusione

La nuova feature di confronto asset permette analisi avanzate tra economia reale e mercati finanziari, aprendo nuove possibilità di studio delle correlazioni e pattern.

**Implementazione completata con successo!** ✅
