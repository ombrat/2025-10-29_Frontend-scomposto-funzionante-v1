# Simulatore di Backtest Finanziario (Frontend)

Frontend moderno per analisi finanziaria e backtest con dati economici FRED in tempo reale.

## 🏗️ Architettura

### Frontend (React + Vite)
- **Framework**: React 18 con Vite per sviluppo veloce
- **Routing**: React Router DOM per navigazione SPA
- **Styling**: CSS modulare con variabili CSS custom
- **API**: Axios per comunicazione HTTP

### Backend Services
- **FRED API (USA)**: Servizio esternalizzato su Google Cloud Run
  - URL: `https://fred-api-proxy-21722357706.europe-west1.run.app`
  - Fornisce 32 indicatori macroeconomici USA con 70 anni di dati storici
  - Fonte: Federal Reserve Economic Data (FRED)
- **ECB API (Eurozona)**: Servizio esternalizzato su Google Cloud Run
  - URL: `https://ecb-proxy-21722357706.europe-west1.run.app`
  - Fornisce 10 indicatori macroeconomici Eurozona (25-34 anni di dati)
  - Fonte: ECB Statistical Data Warehouse (SDW)
  - ⚠️ **Nota**: Copertura limitata - molti indicatori BCE sono stati deprecati dall'API SDW
- **News API**: Backend locale per notizie finanziarie (porta 8001)

## 📁 Struttura Progetto

```
├── src/
│   ├── components/        # Componenti UI riutilizzabili
│   ├── pages/            # Pagine principali dell'app
│   ├── services/         # Servizi API (FRED, News)
│   ├── config/           # Configurazioni API
│   └── utils/            # Utilità e helpers
├── backend/
│   └── backend-news/     # Backend locale per notizie
└── public/               # File statici

```

## 🚀 Setup e Avvio

1. **Installa dipendenze**:
   ```bash
   npm install
   ```

2. **Avvia in modalità sviluppo**:
   ```bash
   npm run dev
   ```
   Questo avvia sia il frontend (porta 5173) che il backend news (porta 8001)

3. **Solo frontend** (se backend news già attivo):
   ```bash
   npm run dev:frontend-only
   ```

4. **Build di produzione**:
   ```bash
   npm run build
   npm run preview
   ```

## 🔧 Configurazione

### Copertura Dati Regionali

#### 🇺🇸 **USA (FRED API)** - Copertura Completa
- **32 indicatori** organizzati in 3 categorie
- **70 anni** di dati storici per ogni indicatore
- Categorie: Mondo del Lavoro (9), Crescita Economica (10), Solidità Economica (13)
- Fonte: Federal Reserve Economic Data (FRED)
- Status: ✅ **Database completo e stabile**

#### 🇪🇺 **Eurozona (ECB API)** - Copertura Limitata
- **10 indicatori** organizzati in 3 categorie
- **25-34 anni** di dati storici per indicatore
- Categorie: Mondo del Lavoro (1), Crescita Economica (3), Solidità Economica (6)
- Fonte: ECB Statistical Data Warehouse (SDW)
- Status: ⚠️ **Molti indicatori deprecati dall'API BCE**

**Nota**: L'asimmetria nella copertura dati non è una limitazione del frontend, ma deriva dalla deprecazione di molti indicatori nell'API SDW della BCE. Gli indicatori disponibili per l'Eurozona sono quelli verificati funzionanti con l'API attuale (aggiornamento: Nov 2025).

Per dettagli tecnici sulla ricerca degli ID corretti, vedi: `ECB_API_CORRECTIONS.md`

### FRED API Service
Il servizio FRED è completamente esternalizzato su Google Cloud Run. La configurazione si trova in:
- `src/config/apiConfig.js` - URL del servizio esterno
- `src/services/fredApiService.js` - Client per comunicazione API

### News API
Configurazione in `backend/backend-news/`:
- Chiave Alpha Vantage configurata
- Avvio automatico con `npm run dev`

Hai bisogno che generi anche i file direttamente nella tua repository su GitHub o preferisci incollare i file manualmente? Se vuoi posso preparare una patch o un branch con tutti i file.