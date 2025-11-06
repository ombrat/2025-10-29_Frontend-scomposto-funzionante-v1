# Simulatore di Backtest Finanziario (Frontend)

Frontend moderno per analisi finanziaria e backtest con dati economici FRED in tempo reale.

## 🏗️ Architettura

### Frontend (React + Vite)
- **Framework**: React 18 con Vite per sviluppo veloce
- **Routing**: React Router DOM per navigazione SPA
- **Styling**: CSS modulare con variabili CSS custom
- **API**: Axios per comunicazione HTTP

### Backend Services
- **FRED API**: Servizio esternalizzato su Google Cloud Run
  - URL: `https://fred-api-proxy-21722357706.europe-west1.run.app`
  - Fornisce dati macroeconomici della Federal Reserve
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

### FRED API Service
Il servizio FRED è completamente esternalizzato su Google Cloud Run. La configurazione si trova in:
- `src/config/apiConfig.js` - URL del servizio esterno
- `src/services/fredApiService.js` - Client per comunicazione API

### News API
Configurazione in `backend/backend-news/`:
- Chiave Alpha Vantage configurata
- Avvio automatico con `npm run dev`

Hai bisogno che generi anche i file direttamente nella tua repository su GitHub o preferisci incollare i file manualmente? Se vuoi posso preparare una patch o un branch con tutti i file.