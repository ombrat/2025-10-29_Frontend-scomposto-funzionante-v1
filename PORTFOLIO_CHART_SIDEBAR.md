# 📊 Sidebar Strumenti per PortfolioChart

## ✅ Implementazione Completata

È stata aggiunta una **sidebar verticale** sul lato destro del grafico PortfolioChart nella pagina Backtest.

## 🎨 Struttura Implementata

```
┌───────────────────────────────────────────────────────────────┐
│          Andamento Storico Portafoglio                        │
├─────────────────────────────────────────────────┬─────────────┤
│                                                 │   TOOLS     │
│                                                 ├─────────────┤
│                                                 │             │
│            [GRAFICO PORTAFOGLIO]                │     ⚙️      │
│                                                 │   Ready     │
│                                                 │             │
│                                                 │             │
│                                                 │             │
│    [PNG] [CSV] ☑ Totale Investito             │             │
│    ━ Valore Portafoglio  ┄ Totale Investito   │             │
│    [Metriche Chiave]                           │             │
│                                                 │     📊      │
└─────────────────────────────────────────────────┴─────────────┘
```

## 📐 Specifiche Tecniche

### Dimensioni
- **Larghezza**: 60px fisso
- **Altezza**: Si adatta all'altezza del grafico (`${HEIGHT}px`)
- **Gap**: 16px tra grafico e sidebar

### Styling
```javascript
{
  width: '60px',
  minHeight: `${HEIGHT}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px 8px',
  background: 'linear-gradient(180deg, rgba(30, 30, 30, 0.6), rgba(20, 20, 20, 0.8))',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  position: 'relative'
}
```

### Sezioni

#### 1. Header
- **Testo**: "TOOLS"
- **Font**: 10px, uppercase, letter-spacing 0.5px
- **Colore**: #999
- **Separatore**: Border-bottom

#### 2. Area Strumenti (flex: 1)
- **Layout**: Flexbox column
- **Allineamento**: center
- **Gap**: 8px tra elementi
- **Pronta** per ospitare i tool button

#### 3. Footer
- **Icona**: 📊
- **Font**: 9px
- **Colore**: #666
- **Separatore**: Border-top
- **Posizione**: margin-top auto

### Tool Button Template
```javascript
{
  width: '44px',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '8px',
  color: '#666',
  fontSize: '18px',
  cursor: 'pointer',
  transition: 'all 0.2s'
}
```

## 🔧 Prossimi Passi

La sidebar è pronta per ospitare strumenti. Esempi di tool che possono essere aggiunti:

### Strumenti Suggeriti

1. **📈 Zoom**
   - Zoom in/out sul grafico
   - Reset zoom

2. **📊 Indicatori Tecnici**
   - Media mobile
   - Bande di Bollinger
   - RSI

3. **🎯 Marker**
   - Aggiungi note/annotazioni
   - Evidenzia punti chiave

4. **🔍 Analisi**
   - Mostra drawdown
   - Mostra volatilità
   - Calcola metriche avanzate

5. **📸 Export**
   - Screenshot HD
   - Export dati
   - Condividi

6. **🎨 Personalizzazione**
   - Cambia colori
   - Cambia stile linea
   - Tema grafico

7. **📅 Filtri Temporali**
   - YTD
   - 1Y, 3Y, 5Y
   - Custom range

8. **🔔 Alert**
   - Imposta soglie
   - Notifiche performance

## 💡 Implementazione Tool

Per aggiungere un nuovo tool, inserire questo template nell'area strumenti:

```jsx
<button
  onClick={() => handleToolClick('tool_name')}
  style={{
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isActive ? 'rgba(30, 136, 229, 0.2)' : 'rgba(255, 255, 255, 0.03)',
    border: isActive ? '1px solid #1e88e5' : '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: isActive ? '#1e88e5' : '#999',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }}
  onMouseEnter={(e) => {
    e.target.style.background = 'rgba(30, 136, 229, 0.15)';
    e.target.style.borderColor = 'rgba(30, 136, 229, 0.4)';
    e.target.style.transform = 'scale(1.05)';
  }}
  onMouseLeave={(e) => {
    if (!isActive) {
      e.target.style.background = 'rgba(255, 255, 255, 0.03)';
      e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    }
    e.target.style.transform = 'scale(1)';
  }}
  title="Tool Description"
>
  🔧
</button>
<div style={{
  fontSize: '9px',
  color: isActive ? '#1e88e5' : '#999',
  textAlign: 'center',
  lineHeight: '1.2',
  maxWidth: '44px',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}}>
  Label
</div>
```

## 🎨 Color Scheme

### Stati
- **Default**: rgba(255, 255, 255, 0.03) bg, rgba(255, 255, 255, 0.08) border
- **Hover**: rgba(30, 136, 229, 0.15) bg, rgba(30, 136, 229, 0.4) border
- **Active**: rgba(30, 136, 229, 0.2) bg, #1e88e5 border
- **Disabled**: opacity 0.3, cursor not-allowed

### Icone
- **Default**: #999
- **Active**: #1e88e5
- **Disabled**: #666

## 📱 Responsive

La sidebar è progettata per:
- ✅ Desktop (>1024px): Sidebar completa visibile
- ✅ Tablet (768-1024px): Sidebar compatta
- ⚠️ Mobile (<768px): Considerare collapse o hide

## 🔮 Future Enhancements

1. **Collapsible Sidebar**: Click per nascondere/mostrare
2. **Tooltip Rich**: Hover per descrizioni dettagliate
3. **Keyboard Shortcuts**: Hotkey per strumenti comuni
4. **Tool Categories**: Raggruppa strumenti per categoria
5. **Custom Tools**: API per aggiungere tool esterni
6. **Preset Layouts**: Salva configurazioni preferite

---

**Status**: ✅ Ready for tools integration
**File**: `src/components/charts/PortfolioChart.jsx`
**Lines modified**: ~50 lines
