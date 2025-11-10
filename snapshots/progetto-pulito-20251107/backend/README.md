# Backend Services

Questa cartella contiene i servizi backend **SOLO** per le news locali.

## Struttura

```
backend/
├── backend-news/     # Proxy per Alpha Vantage News API (solo locale)
└── README.md        # Questo file
```

**⚠️ IMPORTANTE**: I dati economici FRED vengono serviti dal backend esterno Google Cloud Run:
- **FRED API**: `https://fred-api-proxy-21722357706.europe-west1.run.app`

## Porte utilizzate

- **backend-news**: porta 8001 (solo per news locali)

## Avvio rapido

```bash
# Avvia SOLO backend News locale
cd backend/backend-news && ./start.sh
```

## Note

- Ogni backend è indipendente e può essere avviato/fermato separatamente
- I backend gestiscono CORS e proxy per le rispettive API esterne
- Configurazione tramite file .env in ogni cartella
