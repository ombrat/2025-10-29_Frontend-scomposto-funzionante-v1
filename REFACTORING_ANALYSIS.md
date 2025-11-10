# 📊 Refactoring AnalysisPage - Documentazione

## 🎯 Obiettivo
Scomporre il file monolitico `AnalysisPage.jsx` (2807 righe) in componenti modulari e riutilizzabili per migliorare manutenibilità, leggibilità e scalabilità del codice.

## 📁 Nuova Struttura

### 🔧 Utilities (`/src/utils/analysis/`)
- **`indicatorConfig.js`** - Configurazioni colori, icone, nomi per categorie e indicatori
- **`indicatorUtils.js`** - Funzioni di utilità (formatValue, downloadCSV, measureText)

### 🧩 Componenti (`/src/components/analysis/`)

#### 1. **AnalysisSearch.jsx** (Ricerca e Filtri)
- Barra di ricerca con debounce
- Dropdown filtro categoria
- Bottone refresh
- Contatore risultati
- Dropdown risultati ricerca esterna (FRED API)
- Gestione loading e errori ricerca

**Props:**
- `searchTerm`, `onSearchChange`
- `selectedCategory`, `onCategoryChange`
- `categories`, `totalResults`
- `onRefresh`
- `isSearching`, `searchResults`, `searchError`
- `onAddCustomIndicator`, `customIndicators`

#### 2. **CategorySection.jsx** (Sezione Categoria)
- Header categoria espandibile
- Lista indicatori della categoria
- Gestione stato espansione
- Animazioni e hover effects

**Props:**
- `categoryKey`, `indicators`
- `isExpanded`, `onToggleCategory`
- `expandedIndicators`, `onToggleIndicator`
- `onStartCompare`
- `macroData`, `macroService`

#### 3. **IndicatorCard.jsx** (Card Indicatore)
- Header con icona, nome, ID
- Valori correnti e variazione
- Grafico storico integrato (IndicatorChart)
- Tabella dati scrollabile
- Bottoni azioni (Confronta, CSV, Storico)

**Props:**
- `indicator`, `categoryKey`, `categoryName`
- `isExpanded`, `onToggleExpand`
- `onStartCompare`
- `macroData`, `macroService`

#### 4. **IndicatorChart.jsx** (Grafico Indicatore)
- Grafico SVG responsive
- Selezione periodo (1Y, 5Y, MAX)
- Campionamento dati (max 300 punti)
- Tooltip interattivo
- Area gradient fill
- Assi dinamici con etichette

**Props:**
- `data` - Array di osservazioni
- `color` - Colore della linea
- `height` - Altezza del grafico (default: 280)
- `title` - Titolo del grafico

#### 5. **CompareSection.jsx** (Confronto Indicatori)
- UI per selezione secondo indicatore
- Barra ricerca indicatori
- Lista indicatori filtrati
- Integrazione CompareChart
- Gestione stato confronto attivo

**Props:**
- `primary` - Indicatore primario
- `compareIndicator` - Indicatore secondario
- `onSelectCompareIndicator`
- `onClose`
- `allIndicators`
- `macroData`, `macroService`

#### 6. **CompareChart.jsx** (Grafico Confronto)
- Grafico a doppia linea normalizzata (0-100%)
- Tooltip con valori di entrambi gli indicatori
- Legenda con stili differenziati
- Range temporale comune
- Campionamento dati

**Props:**
- `primary`, `secondary` - Indicatori da confrontare
- `onClose`
- `macroData`, `macroService`

#### 7. **CustomIndicators.jsx** (Indicatori Personalizzati)
- Sezione dedicata per indicatori aggiunti dall'utente
- Filtro ricerca integrato
- Bottone rimozione per ogni indicatore
- Stile visivo distintivo (badge 🆕)

**Props:**
- `customIndicators`
- `searchTerm`
- `onRemoveIndicator`, `onStartCompare`
- `expandedIndicators`, `onToggleIndicator`
- `macroData`, `macroService`

## 🔄 AnalysisPage.jsx (Refactored)
**Da:** 2807 righe monolitiche  
**A:** ~450 righe di orchestrazione

### Responsabilità:
- Gestione stati globali (loading, error, data)
- Coordinamento tra componenti
- Gestione filtri e ricerca
- Fetch dati da API
- Routing logica confronto
- Debounce ricerca esterna

### Stati Gestiti:
```javascript
// Dati
const [macroData, setMacroData] = useState(null);
const [customIndicators, setCustomIndicators] = useState({});

// UI
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [loadingLogs, setLoadingLogs] = useState([]);
const [expandedCategories, setExpandedCategories] = useState({});
const [expandedIndicators, setExpandedIndicators] = useState({});

// Filtri
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState('all');

// Ricerca esterna
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);
const [searchError, setSearchError] = useState(null);

// Confronto
const [primaryIndicator, setPrimaryIndicator] = useState(null);
const [compareIndicator, setCompareIndicator] = useState(null);
const [showCompareChart, setShowCompareChart] = useState(false);
```

## 🎨 Vantaggi del Refactoring

### ✅ Manutenibilità
- Ogni componente ha una responsabilità chiara
- Modifiche isolate senza effetti collaterali
- Facile identificazione e fix dei bug

### ✅ Riusabilità
- Componenti esportabili e riutilizzabili
- Logica incapsulata e parametrizzabile
- Configurazioni separate dal codice

### ✅ Testabilità
- Componenti piccoli e testabili individualmente
- Props ben definite
- Logica separata dalla presentazione

### ✅ Leggibilità
- Codice più breve e comprensibile
- Nomi descrittivi e semantici
- Struttura gerarchica chiara

### ✅ Scalabilità
- Facile aggiungere nuove features
- Pattern replicabile per altre pagine
- Struttura estendibile

## 📦 File Backup
I file originali sono stati spostati in `/src/pages/_archive/`:
- `AnalysisPage_v5_pre-refactor.jsx` - Versione originale completa
- Altri file di backup precedenti

## 🚀 Prossimi Passi Potenziali
1. Test dei componenti individuali
2. Ottimizzazione performance (React.memo, useMemo)
3. Implementazione backend search endpoint
4. Aggiunta unit test
5. Documentazione JSDoc per ogni componente
6. Storybook per visualizzazione componenti
7. Accessibilità (ARIA labels, keyboard navigation)

## 📊 Metriche Refactoring

| Metrica | Prima | Dopo | Miglioramento |
|---------|-------|------|---------------|
| Righe AnalysisPage.jsx | 2807 | ~450 | -84% |
| File totali | 1 | 8 | +700% modularità |
| Lunghezza media file | 2807 | ~400 | -86% |
| Componenti riutilizzabili | 0 | 7 | ∞ |
| Funzioni utility | inline | 5 | Riutilizzabili |

## ✨ Features Preservate
- ✅ Ricerca locale e esterna (FRED API)
- ✅ Filtri categoria
- ✅ Espansione categorie/indicatori
- ✅ Grafici interattivi
- ✅ Confronto indicatori
- ✅ Download CSV
- ✅ Indicatori personalizzati
- ✅ Loading states e error handling
- ✅ Responsive design
- ✅ Animazioni e transizioni

## 🎉 Risultato
Codice più pulito, manutenibile e scalabile, pronto per future estensioni senza sacrificare funzionalità!
