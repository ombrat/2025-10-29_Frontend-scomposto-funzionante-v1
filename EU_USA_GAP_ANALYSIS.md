# 📊 CONFRONTO INDICATORI USA vs EUROZONA

**Data**: 13 Novembre 2025  
**Status**: Eurozona ha **11 indicatori in meno** rispetto agli USA

---

## 🇺🇸 **USA (FRED) - 32 INDICATORI**

### 👷 **Mondo del Lavoro** (9 indicatori)
1. ✅ Tasso di Disoccupazione (UNRATE)
2. ✅ Buste Paga Non Agricole (PAYEMS)
3. ✅ Partecipazione Forza Lavoro (CIVPART)
4. ✅ Rapporto Occupazione-Popolazione (EMRATIO)
5. ✅ Richieste Disoccupazione (ICSA)
6. ✅ Aperture Lavoro (JTSJOL)
7. ✅ Retribuzione Oraria Media (CES0500000003)
8. ✅ Occupazione Manifatturiero (MANEMP)
9. ✅ Occupazione Settore Privato (USPRIV)

### 📈 **Crescita Economica** (12 indicatori)
1. ✅ PIL (GDP)
2. ✅ PIL Reale (GDPC1)
3. ✅ PIL Potenziale (GDPPOT)
4. ✅ Produzione Industriale (INDPRO)
5. ✅ Produzione Manifatturiera (IPMAN)
6. ✅ Produzione Servizi (SRVPRD)
7. ✅ Vendite al Dettaglio (RSAFS)
8. ✅ Spese Consumatori (PCE)
9. ✅ Investimenti Privati (GPDI)
10. ✅ Capacità Utilizzazione (TCU)
11. ✅ ISM Manifatturiero (NAPM - PMI proxy)
12. ✅ ISM Servizi (NAPMNMI - PMI proxy)

### 🏛️ **Solidità Economica** (11 indicatori)
1. ✅ Inflazione CPI (CPIAUCSL)
2. ✅ Inflazione Core (CPILFESL)
3. ✅ Inflazione PCE (PCEPI)
4. ✅ Inflazione Core PCE (PCEPILFE)
5. ✅ PPI (PPIACO)
6. ✅ Aspettative Inflazione (T5YIE)
7. ✅ M2 Massa Monetaria (M2SL)
8. ✅ Fiducia Consumatori (UMCSENT)
9. ✅ Indice Leading (USSLIND)
10. ✅ Bilancia Commerciale (BOPGSTB)
11. ✅ Debito Pubblico (GFDEBTN)

---

## 🇪🇺 **EUROZONA (ECB + Eurostat) - 21 INDICATORI**

### 👷 **Mondo del Lavoro** (2 indicatori)
1. ✅ Posti Vacanti (ECB: `STS.M.I8.W.TOVT.NS0020.4.000`)
2. ✅ Tasso Disoccupazione (Eurostat: `UNEMPLOYMENT_EA`)

**❌ MANCANO 7 INDICATORI USA:**
- Buste Paga totali
- Partecipazione Forza Lavoro
- Rapporto Occupazione-Popolazione
- Richieste Disoccupazione settimanali
- Aperture Lavoro totali
- Retribuzione Oraria Media
- Occupazione per settori dettagliati

### 📈 **Crescita Economica** (7 indicatori)
1. ✅ PIL Eurozona (ECB: `MNA.Q.Y.I8.W2.S1.S1.B.B1GQ._Z._Z._Z.EUR.LR.N`)
2. ✅ Produzione Industriale (ECB: `STS.M.I8.Y.PROD.NS0020.4.000`)
3. ✅ Produzione Industriale (Eurostat: `INDPRO_EA`)
4. ✅ Produzione Edilizia (ECB: `STS.M.I8.Y.PROD.NS0040.4.000`)
5. ✅ Vendite al Dettaglio (Eurostat: `RETAIL_EA`)
6. ✅ Fiducia Consumatori (Eurostat: `CONSUMER_CONFIDENCE_EA`)
7. ✅ Fiducia Industria (Eurostat: `INDUSTRY_CONFIDENCE_EA`)

**❌ MANCANO 5 INDICATORI USA:**
- PIL Potenziale
- Produzione Servizi separata
- Spese Consumatori (PCE)
- Investimenti Privati (GPDI)
- Capacità Utilizzazione

### 🏛️ **Solidità Economica** (12 indicatori)
1. ✅ Inflazione HICP (ECB: `ICP.M.U2.N.000000.4.ANR`)
2. ✅ Inflazione Alimentare (ECB: `ICP.M.U2.N.010000.4.ANR`)
3. ✅ Inflazione Energia (ECB: `ICP.M.U2.N.072000.4.ANR`)
4. ✅ Inflazione Core (ECB: `ICP.M.U2.N.XEF000.4.ANR`)
5. ✅ HICP Eurostat (Eurostat: `HICP_EA`)
6. ✅ HICP Energy (Eurostat: `HICP_ENERGY`)
7. ✅ HICP Food (Eurostat: `HICP_FOOD`)
8. ✅ HICP Core (Eurostat: `HICP_CORE`)
9. ✅ PPI (Eurostat: `PPI_EA`)
10. ✅ Tasso BCE Principale (ECB: `FM.D.U2.EUR.4F.KR.MRR_FR.LEV`)
11. ✅ Tasso Deposito BCE (ECB: `FM.D.U2.EUR.4F.KR.DFR.LEV`)
12. ✅ GDP (Eurostat: `GDP_EA`)

**❌ MANCANO 3 INDICATORI USA (ma +4 varianti inflazione):**
- Massa Monetaria M3
- Aspettative Inflazione forward-looking
- Indice Leading composito
- Bilancia Commerciale
- Debito Pubblico aggregato

---

## ❌ **GAP ANALYSIS - INDICATORI MANCANTI**

### 📊 **Tabella Riepilogativa**

| Categoria | 🇺🇸 USA | 🇪🇺 EUR | ❌ Gap |
|-----------|---------|---------|--------|
| Mondo del Lavoro | 9 | 2 | **-7** |
| Crescita Economica | 12 | 7 | **-5** |
| Solidità Economica | 11 | 12 | **+1** |
| **TOTALE** | **32** | **21** | **-11** |

---

## 🎯 **ROADMAP INTEGRAZIONE - PRIORITÀ**

### 🔴 **FASE 1: ALTA PRIORITÀ** (critici per parità USA)

#### 1️⃣ **Occupazione Totale Eurozona**
- **Dataset Eurostat**: `lfsq_egan` (LFS - Occupazione per settore)
- **Equivalente USA**: PAYEMS (Buste Paga)
- **Motivazione**: Indicatore chiave mercato lavoro
- **Implementazione**: Eurostat backend + frontend integration

#### 2️⃣ **Crescita Salari Eurozona**
- **Dataset Eurostat**: `lc_lci_r2_q` (Labour Cost Index)
- **Equivalente USA**: CES0500000003 (Retribuzione Oraria)
- **Motivazione**: Pressioni inflazionistiche da domanda
- **Implementazione**: Eurostat backend + frontend integration

#### 3️⃣ **Spese Consumatori Eurozona**
- **Dataset Eurostat**: `namq_10_pc` (Spesa famiglie)
- **Equivalente USA**: PCE (Personal Consumption Expenditures)
- **Motivazione**: 60% del PIL Eurozona
- **Implementazione**: Eurostat backend (quarterly data)

#### 4️⃣ **Investimenti Privati Eurozona**
- **Dataset Eurostat**: `namq_10_gdp` → GFCF component
- **Equivalente USA**: GPDI (Investimenti Privati)
- **Motivazione**: Motore crescita economia
- **Implementazione**: Eurostat backend (quarterly data)

#### 5️⃣ **Massa Monetaria M3 BCE**
- **Dataset ECB**: `BSI.M.U2.Y.V.M30.X.1.U2.2300.Z01.E`
- **Equivalente USA**: M2SL
- **Motivazione**: Liquidità sistema economico
- **Implementazione**: ECB backend (verificare disponibilità)

---

### 🟡 **FASE 2: MEDIA PRIORITÀ** (migliorano analisi)

#### 6️⃣ **Partecipazione Forza Lavoro**
- **Dataset Eurostat**: `lfsq_argan` (Activity rates)
- **Equivalente USA**: CIVPART
- **Motivazione**: Demografia mercato lavoro

#### 7️⃣ **Bilancia Commerciale**
- **Dataset ECB**: `TRD.M.I8.Y.E.Z.TB.Z` (Trade Balance)
- **Equivalente USA**: BOPGSTB
- **Motivazione**: Deficit/Surplus commerciale

#### 8️⃣ **Capacità Utilizzazione Industria**
- **Dataset Eurostat**: Derivabile da `sts_inpr_m`
- **Equivalente USA**: TCU
- **Motivazione**: Pressioni inflazionistiche da offerta

#### 9️⃣ **PMI Manifatturiero & Servizi**
- **Source**: S&P Global / Markit (non Eurostat/ECB)
- **Equivalente USA**: ISM Manufacturing/Services
- **Motivazione**: Sentiment forward-looking
- **Nota**: Richiede integrazione terza fonte dati

---

### 🟢 **FASE 3: BASSA PRIORITÀ** (completezza dataset)

#### 🔟 **Richieste Disoccupazione**
- **Disponibilità**: Limitata in Eurozona (no dato settimanale)
- **Equivalente USA**: ICSA
- **Nota**: Non prioritario - diversa struttura mercato lavoro EU

#### 1️⃣1️⃣ **Debito Pubblico Aggregato**
- **Dataset Eurostat**: `gov_10q_ggdebt`
- **Equivalente USA**: GFDEBTN
- **Motivazione**: Sostenibilità fiscale

#### 1️⃣2️⃣ **Aspettative Inflazione**
- **Source**: ECB Survey of Professional Forecasters
- **Equivalente USA**: T5YIE
- **Motivazione**: Forward-looking sentiment

---

## 🚀 **IMPLEMENTAZIONE TECNICA**

### **Step 1: Backend Eurostat (Python)**
```python
# Aggiungere a backend/eurostat-proxy/app.py

NEW_INDICATORS = {
    'EMPLOYMENT_TOTAL_EA': {
        'dataset': 'lfsq_egan',
        'filters': {
            'geo': 'EA20',
            'sex': 'T',
            'age': 'Y15-64',
            'unit': 'THS_PER'
        }
    },
    'WAGES_EA': {
        'dataset': 'lc_lci_r2_q',
        'filters': {
            'geo': 'EA20',
            'lcstruct': 'D11_D12',
            'nace_r2': 'B-S'
        }
    },
    'CONSUMPTION_EA': {
        'dataset': 'namq_10_pc',
        'filters': {
            'geo': 'EA20',
            'na_item': 'P31_S14_S15',
            'unit': 'CLV15_MEUR'
        }
    },
    'INVESTMENT_EA': {
        'dataset': 'namq_10_gdp',
        'filters': {
            'geo': 'EA20',
            'na_item': 'P51G',
            'unit': 'CLV15_MEUR'
        }
    }
}
```

### **Step 2: Frontend Integration (JavaScript)**
```javascript
// Aggiungere a src/services/eurostatService.js

getOfficialEurostatIndicators() {
  return {
    'employment': [
      // ... esistenti ...
      { 
        id: 'EMPLOYMENT_TOTAL_EA', 
        name: 'Occupazione Totale Eurozona',
        description: 'Numero totale di persone occupate...',
        units: 'Thousands',
        categoryKey: 'Mondo del Lavoro'
      },
      { 
        id: 'WAGES_EA', 
        name: 'Crescita Salari Eurozona',
        description: 'Variazione trimestrale costo lavoro...',
        units: 'Index',
        categoryKey: 'Mondo del Lavoro'
      }
    ],
    'growth': [
      // ... esistenti ...
      { 
        id: 'CONSUMPTION_EA', 
        name: 'Spese Consumatori Eurozona',
        description: 'Spesa famiglie per beni e servizi...',
        units: 'Million EUR',
        categoryKey: 'Crescita Economica'
      },
      { 
        id: 'INVESTMENT_EA', 
        name: 'Investimenti Privati Eurozona',
        description: 'Investimenti fissi lordi...',
        units: 'Million EUR',
        categoryKey: 'Crescita Economica'
      }
    ]
  };
}
```

### **Step 3: Backend ECB (Python)**
```python
# Verificare disponibilità M3 su ECB SDW
# Aggiungere a backend/ecb-proxy/app.py

ECB_ADDITIONAL_SERIES = {
    'M3_EA': 'BSI.M.U2.Y.V.M30.X.1.U2.2300.Z01.E',
    'TRADE_BALANCE_EA': 'TRD.M.I8.Y.E.Z.TB.Z'
}
```

---

## 📈 **OBIETTIVO FINALE**

**Target**: **30-32 indicatori Eurozona** (parità con USA)

- ✅ Attuali: 21 indicatori
- 🎯 Fase 1 (Alta priorità): +5 indicatori → **26 totali**
- 🎯 Fase 2 (Media priorità): +4 indicatori → **30 totali**
- 🎯 Fase 3 (Bassa priorità): +2 indicatori → **32 totali**

**Timeline stimata**:
- Fase 1: 1-2 settimane (backend + frontend integration)
- Fase 2: 2-3 settimane (include PMI integration)
- Fase 3: 1 settimana (opzionale)

---

## 📝 **NOTE TECNICHE**

### **Limitazioni Eurostat vs FRED**
1. **Frequenza dati**: 
   - FRED: prevalentemente mensile/settimanale
   - Eurostat: prevalentemente trimestrale (PIL, consumi, investimenti)

2. **Storico disponibile**:
   - FRED: fino a 70 anni
   - Eurostat: tipicamente 20-30 anni (post Euro 1999)

3. **Latenza pubblicazione**:
   - FRED: 1-4 settimane
   - Eurostat: 45-60 giorni (revisioni frequenti)

### **Raccomandazioni**
- Prioritizzare **indicatori mensili** per coerenza con USA
- Marcare chiaramente **indicatori trimestrali** nel frontend
- Implementare **interpolazione** per visualizzazioni uniformi
- Aggiungere **note metodologiche** per differenze US/EU

---

**Documento creato**: 13 Novembre 2025  
**Versione**: 1.0  
**Status**: Roadmap definita - Pronto per implementazione Fase 1
