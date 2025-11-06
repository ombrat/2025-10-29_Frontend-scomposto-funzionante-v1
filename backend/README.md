# Backend Services

Questa cartella contiene tutti i servizi backend organizzati per tipo di API.

## Struttura

```
backend/
├── backend-fred/     # Proxy per FRED (Federal Reserve Economic Data) API
├── backend-news/     # Proxy per Alpha Vantage News API
└── README.md        # Questo file
```

## Porte utilizzate

- **backend-fred**: porta 8000
- **backend-news**: porta 8001

## Avvio rapido

```bash
# Avvia backend FRED
cd backend/backend-fred && ./start.sh

# Avvia backend News (in un altro terminale)
cd backend/backend-news && ./start.sh
```

## Note

- Ogni backend è indipendente e può essere avviato/fermato separatamente
- I backend gestiscono CORS e proxy per le rispettive API esterne
- Configurazione tramite file .env in ogni cartella
