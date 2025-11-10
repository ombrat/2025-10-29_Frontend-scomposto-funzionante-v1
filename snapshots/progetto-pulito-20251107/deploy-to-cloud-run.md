# 🚀 Deploy Backend su Google Cloud Run

## Prerequisiti

```bash
# Installa Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

## 1. Preparazione dei Backend

### A. Ottimizza Dockerfile per Cloud Run

**⚠️ OBSOLETO**: Il backend FRED è già deployato su Google Cloud Run:
- URL: `https://fred-api-proxy-21722357706.europe-west1.run.app`
- Non serve più deployare localmente

### B. Modifica app.py per Cloud Run

Aggiungi alla fine di `app.py`:
```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
```

## 2. Deploy Commands

### FRED Backend
```bash
cd backend/backend-fred

# Build e push container
gcloud builds submit --tag gcr.io/[PROJECT-ID]/fred-proxy

# Deploy su Cloud Run
gcloud run deploy fred-proxy \
    --image gcr.io/[PROJECT-ID]/fred-proxy \
    --platform managed \
    --region europe-west1 \
    --allow-unauthenticated \
    --set-env-vars FRED_API_KEY=830ce076f44518fb2cccc578da7e9b4e
```

### News Backend
```bash
cd backend/backend-news

# Build e push container
gcloud builds submit --tag gcr.io/[PROJECT-ID]/news-proxy

# Deploy su Cloud Run
gcloud run deploy news-proxy \
    --image gcr.io/[PROJECT-ID]/news-proxy \
    --platform managed \
    --region europe-west1 \
    --allow-unauthenticated \
    --set-env-vars ALPHA_VANTAGE_API_KEY=M768ALQQ3JVUXCGC
```

## 3. Aggiorna Frontend

Modifica `src/config/apiConfig.js`:

```javascript
const API_CONFIG = {
  // URLs Cloud Run (sostituisci con i tuoi)
  FRED_BASE_URL: 'https://fred-proxy-[hash]-ew.a.run.app',
  NEWS_BASE_URL: 'https://news-proxy-[hash]-ew.a.run.app',
  
  // Fallback per sviluppo locale
  LOCAL_FRED_URL: 'http://localhost:8000',
  LOCAL_NEWS_URL: 'http://localhost:8001'
};

export const getApiUrl = (service) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  switch(service) {
    case 'fred':
      return isProduction ? API_CONFIG.FRED_BASE_URL : API_CONFIG.LOCAL_FRED_URL;
    case 'news':
      return isProduction ? API_CONFIG.NEWS_BASE_URL : API_CONFIG.LOCAL_NEWS_URL;
    default:
      throw new Error(`Servizio sconosciuto: ${service}`);
  }
};
```

## 4. Vantaggi Immediati

✅ **Zero manutenzione server**
✅ **HTTPS automatico** (risolve CORS)
✅ **Scaling automatico** (0 → N istanze)
✅ **Costi bassi** (~€2-5/mese per traffico normale)
✅ **Deploy automatico** con CI/CD
✅ **Monitoring integrato**

## 5. Script di Deploy Automatico

Crea `deploy.sh`:
```bash
#!/bin/bash
set -e

PROJECT_ID="your-project-id"
REGION="europe-west1"

echo "🚀 Deploy dei backend su Cloud Run..."

# Deploy FRED Backend
echo "📊 Deploy FRED Backend..."
cd backend/backend-fred
gcloud builds submit --tag gcr.io/$PROJECT_ID/fred-proxy
gcloud run deploy fred-proxy \
    --image gcr.io/$PROJECT_ID/fred-proxy \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars FRED_API_KEY=$FRED_API_KEY \
    --quiet

# Deploy News Backend  
echo "📰 Deploy News Backend..."
cd ../backend-news
gcloud builds submit --tag gcr.io/$PROJECT_ID/news-proxy
gcloud run deploy news-proxy \
    --image gcr.io/$PROJECT_ID/news-proxy \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars ALPHA_VANTAGE_API_KEY=$ALPHA_VANTAGE_API_KEY \
    --quiet

echo "✅ Deploy completato!"
echo "🔗 Ottieni gli URL con: gcloud run services list"
```

## 6. Costi Stimati

**Cloud Run Pricing (eu-west1):**
- CPU: €0.00002400 per vCPU-secondo  
- Memory: €0.00000250 per GiB-secondo
- Requests: €0.40 per milione

**Stima mensile per traffico normale:**
- ~€2-5/mese per entrambi i backend
- First 2M requests/mese sono gratuiti

## 7. Monitoring

```bash
# Visualizza logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=fred-proxy" --limit 50

# Metriche
gcloud monitoring metrics list --filter="resource.type=cloud_run_revision"
```