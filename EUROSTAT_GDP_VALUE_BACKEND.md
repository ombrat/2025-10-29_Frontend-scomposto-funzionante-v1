# Aggiunta PIL Valore Assoluto al Backend Eurostat

## Nuovo Indicatore
**GDP_VALUE_EA** - PIL Eurozona in valore assoluto (miliardi EUR)

## Configurazione Backend (app.py su Cloud Run)

Aggiungere alla configurazione degli indicatori:

```python
'GDP_VALUE_EA': {
    'dataset': 'namq_10_gdp',
    'params': {
        'unit': 'CP_MEUR',      # Current Prices in Million EUR
        'na_item': 'B1GQ',      # Gross Domestic Product
        'geo': 'EA20',          # Eurozona 20 paesi
        's_adj': 'NSA',         # Non seasonally adjusted (o 'SCA' se preferisci adjusted)
        'sinceTimePeriod': '1995-Q1'
    },
    'transform': lambda x: round(x / 1000, 2) if x else None  # Converti da milioni a miliardi
}
```

## URL Test Eurostat API

Test manuale:
```bash
curl "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/namq_10_gdp?format=JSON&unit=CP_MEUR&na_item=B1GQ&geo=EA20&s_adj=NSA&sinceTimePeriod=1995-Q1"
```

## Deploy

Dopo aver aggiornato il backend:
```bash
# Deploy su Cloud Run
gcloud run deploy eurostat-proxy \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated
```

## Frontend

Frontend già aggiornato in `eurostatService.js`:
- ID: `GDP_VALUE_EA`
- Nome: "💶 PIL Eurozona (Valore)"
- Units: "Billion EUR"
- Dataset: `namq_10_gdp`

## Differenza con GDP_EA

- **GDP_EA**: Variazione percentuale (es. +0.3%, +0.5%)
- **GDP_VALUE_EA**: Valore assoluto (es. 3.100 miliardi EUR, 3.200 miliardi EUR)

Sono complementari e forniscono informazioni diverse.

## Totale Indicatori Eurostat

Dopo questa aggiunta: **17 indicatori** (era 16)
- Mondo del Lavoro: 2
- Crescita Economica: 8 (era 7)
- Solidità Economica: 7

**Totale EU: 17 Eurostat + 10 BCE = 27 indicatori**
