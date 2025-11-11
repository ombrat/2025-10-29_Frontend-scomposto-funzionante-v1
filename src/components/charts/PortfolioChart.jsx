import React, { useRef, useState, useEffect } from 'react';
import useResizeObserver from '../../hooks/useResizeObserver';
import { sampleEvenIndices, niceTicks, estimateTextWidth } from '../../features/frontier/FrontierHelpers';
import { formatDate, formatMoney } from '../../utils/formatters';
import { downloadSvgAsPng, exportCsvFromChartData } from '../../utils/csvExport';
import KeyMetricsRow from '../ui/KeyMetricsRow';
import { searchTickers, getAssetHistory } from '../../api/api.js';
import macroService from '../../services/macroService.js';

const MAX_DISPLAY_POINTS = 300;

export default function PortfolioChart({ data, title, onHover = null, hoverIndex = null, highlightColor = '#1e88e5', summary = null }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchMode, setSearchMode] = useState('assets'); // 'assets' o 'indicators'
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [assetSearchResults, setAssetSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [overlayData, setOverlayData] = useState(null); // Dati asset/indicatore da sovrapporre
  const [overlayInfo, setOverlayInfo] = useState(null); // Info su cosa stiamo visualizzando
  
  // Effettua la ricerca quando cambia il termine
  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setAssetSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        if (searchMode === 'indicators') {
          const response = await macroService.searchFredSeries(searchTerm);
          setSearchResults(response.results || []);
          setAssetSearchResults([]);
        } else {
          const assets = await searchTickers(searchTerm);
          setAssetSearchResults(Array.isArray(assets) ? assets : []);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Errore ricerca:', error);
        setSearchResults([]);
        setAssetSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchMode]);

  const chartDataRaw = data?.chart_data;
  const dataSummary = data?.summary;
  const finalSummary = summary || dataSummary;
  if (!chartDataRaw || chartDataRaw.length === 0) return null;

  const wrapperRef = useRef(null);
  const { width: wrapperWidth } = useResizeObserver(wrapperRef);

  const computedWidth = Math.round(wrapperWidth || 900);
  const WIDTH = Math.max(600, Math.min(1200, computedWidth));
  const HEIGHT = Math.round(WIDTH * 0.44);

  const RIGHT_MARGIN = 48;
  const TOP_MARGIN = 48;
  const BOTTOM_MARGIN = 70;

  // Handler per selezionare un asset da sovrapporre
  const handleSelectAsset = async (asset) => {
    if (!chartDataRaw || chartDataRaw.length === 0) return;
    
    const startDate = new Date(chartDataRaw[0].Date);
    const endDate = new Date(chartDataRaw[chartDataRaw.length - 1].Date);
    
    try {
      // Aggiungi un piccolo delay per evitare sovraccarico
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const ticker = asset.ticker || asset.symbol;
      if (!ticker) {
        throw new Error('Ticker non valido');
      }
      
      console.log('Caricamento asset:', ticker, 'dal', startDate.toISOString().split('T')[0], 'al', endDate.toISOString().split('T')[0]);
      
      const assetData = await getAssetHistory(
        ticker,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      if (assetData && assetData.chart_data && assetData.chart_data.length > 0) {
        const chartData = assetData.chart_data.filter(day => day.Value > 0);
        
        if (chartData.length === 0) {
          throw new Error('Dati storici non disponibili');
        }
        
        // Simula lo stesso investimento del portfolio
        // Prendi il capitale iniziale del portfolio
        const portfolioInitialValue = chartDataRaw[0].Value;
        const assetFirstPrice = chartData[0].Value;
        
        console.log('💰 Portfolio iniziale:', portfolioInitialValue);
        console.log('💵 Prezzo iniziale asset:', assetFirstPrice);
        console.log('📦 Unità da comprare:', portfolioInitialValue / assetFirstPrice);
        console.log('📊 Primi 3 prezzi asset:', chartData.slice(0, 3).map(d => d.Value));
        
        // Calcola quante "unità" dell'asset avremmo comprato con il capitale iniziale
        const units = portfolioInitialValue / assetFirstPrice;
        
        // Calcola il valore dell'investimento per ogni giorno
        const observations = chartData.map(day => {
          const value = day.Value * units;
          return {
            date: day.Date,
            value: value  // NON usare toFixed qui, mantieni il numero
          };
        });
        
        console.log('✅ Primi 3 valori overlay calcolati:', observations.slice(0, 3));
        
        setOverlayData(observations);
        setOverlayInfo({ 
          type: 'asset', 
          name: asset.name || ticker, 
          symbol: ticker 
        });
        setShowAddModal(false);
        setSearchTerm('');
      } else {
        throw new Error('Nessun dato disponibile per questo asset');
      }
    } catch (error) {
      console.error('Errore caricamento asset:', error);
      const errorMsg = error.response?.status === 503 
        ? 'Backend temporaneamente non disponibile. Riprova tra qualche secondo.'
        : `Impossibile caricare i dati: ${error.message}`;
      alert(errorMsg);
    }
  };

  // Handler per selezionare un indicatore da sovrapporre
  const handleSelectIndicator = async (indicator) => {
    if (!chartDataRaw || chartDataRaw.length === 0) return;
    
    try {
      // Importa backendService per chiamata diretta
      const { default: backendService } = await import('../../services/backendService.js');
      
      const startDate = new Date(chartDataRaw[0].Date);
      const endDate = new Date(chartDataRaw[chartDataRaw.length - 1].Date);
      
      // Calcola anni richiesti
      const years = Math.ceil((endDate - startDate) / (365 * 24 * 60 * 60 * 1000)) + 1;
      
      console.log(`Caricando indicatore ${indicator.id} con ${years} anni di dati...`);
      
      const data = await backendService.getSeriesHistory(indicator.id, years);
      
      if (data && data.observations && data.observations.length > 0) {
        // Filtra per date range
        const observations = data.observations.filter(obs => {
          const obsDate = new Date(obs.date);
          return obsDate >= startDate && obsDate <= endDate;
        });
        
        if (observations.length === 0) {
          throw new Error('Nessun dato disponibile nel periodo selezionato');
        }
        
        // Per gli indicatori, normalizziamo al valore iniziale del portfolio
        // in modo che partano dallo stesso punto e mostrino la variazione relativa
        const portfolioInitialValue = chartDataRaw[0].Value;
        const indicatorFirstValue = parseFloat(observations[0].value);
        
        const normalizedObservations = observations.map(obs => ({
          date: obs.date,
          // Scala l'indicatore proporzionalmente: (valore / valore_iniziale) * capitale_iniziale_portfolio
          value: (parseFloat(obs.value) / indicatorFirstValue) * portfolioInitialValue  // NON usare toFixed
        }));
        
        setOverlayData(normalizedObservations);
        setOverlayInfo({ 
          type: 'indicator', 
          name: indicator.title, 
          id: indicator.id 
        });
        setShowAddModal(false);
        setSearchTerm('');
      } else {
        throw new Error('Nessun dato disponibile per questo indicatore');
      }
    } catch (error) {
      console.error('Errore caricamento indicatore:', error);
      alert('Impossibile caricare i dati dell\'indicatore');
    }
  };

  // Funzione per rimuovere l'overlay
  const handleRemoveOverlay = () => {
    setOverlayData(null);
    setOverlayInfo(null);
  };

  const firstInvestedIndexInRaw = chartDataRaw.findIndex(d => {
    const investedVal = Number(d.TotalInvested ?? d.Total_invested ?? d.totalInvested ?? 0);
    const valueVal = Number(d.Value ?? d.value ?? 0);
    return investedVal > 0 || valueVal > 0;
  });
  const startIdx = firstInvestedIndexInRaw >= 0 ? firstInvestedIndexInRaw : 0;
  const trimmedRaw = chartDataRaw.slice(startIdx);
  const chartData = sampleEvenIndices(trimmedRaw, MAX_DISPLAY_POINTS);

  const values = chartData.map(d => Number(d.Value ?? d.value ?? 0));
  const invested = chartData.map(d => Number(d.TotalInvested ?? d.Total_invested ?? d.totalInvested ?? 0));
  const dates = chartData.map(d => new Date(d.Date));

  const minYRaw = Math.min(...values, ...invested);
  const maxYRaw = Math.max(...values, ...invested);
  const minY = isFinite(minYRaw) ? minYRaw : 0;
  const maxY = isFinite(maxYRaw) ? maxYRaw : minY + 1;

  const desiredYTicks = 6;
  const yTickValues = niceTicks(minY, maxY, desiredYTicks);
  let yTicks = yTickValues;
  if (yTicks.length < 5) {
    yTicks = [];
    for (let i = 0; i < desiredYTicks; i++) {
      yTicks.push(Math.round((minY + (i / (desiredYTicks - 1)) * (maxY - minY)) * 100) / 100);
    }
  }

  const yLabelStrings = yTicks.map(v => formatMoney(v));
  const maxYLabelWidth = Math.max(...yLabelStrings.map(s => estimateTextWidth(s, 12)));
  const leftGutter = Math.max(56, maxYLabelWidth + 20);

  const innerWidth = WIDTH - leftGutter - RIGHT_MARGIN;
  const innerHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

  const getX = (index) => leftGutter + index * (innerWidth) / Math.max(1, (values.length - 1));
  const getY = (value) => {
    const normalized = (value - minY) / (maxY - minY || 1);
    return TOP_MARGIN + (1 - normalized) * innerHeight;
  };



  const [localHoverIndex, setLocalHoverIndex] = useState(null);
  const [hoverData, setHoverData] = useState(null);
  const [showInvested, setShowInvested] = useState(true);
  const svgRef = useRef(null);
  const pendingRef = useRef(false);
  const lastMouseRef = useRef(null);

  const processMouseEvent = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const chartLeft = leftGutter;
    const stepWidth = innerWidth / Math.max(1, (values.length - 1));
    let idxFloat = (mouseX - chartLeft) / stepWidth;
    let idx = Math.round(idxFloat);
    idx = Math.max(0, Math.min(values.length - 1, idx));
    const payload = { index: idx, date: dates[idx], x: getX(idx), y: getY(values[idx]), value: values[idx], invested: invested[idx] };
    if (typeof onHover === 'function') onHover(payload);
    else setLocalHoverIndex(idx);
    setHoverData(payload);
  };

  const scheduleProcess = () => {
    if (!pendingRef.current) {
      pendingRef.current = true;
      requestAnimationFrame(() => {
        const e = lastMouseRef.current;
        if (e) processMouseEvent(e);
        pendingRef.current = false;
      });
    }
  };

  const handleMouseMove = (e) => {
    lastMouseRef.current = e;
    scheduleProcess();
  };

  const handleMouseLeave = () => {
    if (typeof onHover === 'function') onHover(null);
    setLocalHoverIndex(null);
    setHoverData(null);
    lastMouseRef.current = null;
    pendingRef.current = false;
  };

  const activeIndex = (typeof hoverIndex === 'number') ? hoverIndex : localHoverIndex;

  const portfolioPath = values.map((value, index) => {
    const x = getX(index);
    const y = getY(value);
    return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  const investedPath = invested.map((value, index) => {
    const x = getX(index);
    const y = getY(value);
    return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  // Calcolo del percorso overlay
  let overlayPath = null;
  if (overlayData && overlayData.length > 0) {
    console.log('📊 Overlay data disponibile:', overlayData.length, 'punti');
    console.log('📅 Prime date overlay:', overlayData.slice(0, 3).map(d => d.date));
    console.log('📅 Prime date portfolio:', dates.slice(0, 3));
    
    // Normalizza le date a formato YYYY-MM-DD per il confronto
    const normalizeDateString = (dateInput) => {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      return d.toISOString().split('T')[0];
    };
    
    // Crea una mappa data normalizzata -> valore per l'overlay
    const overlayMap = new Map(
      overlayData.map(d => [normalizeDateString(d.date), typeof d.value === 'number' ? d.value : parseFloat(d.value)])
    );
    
    console.log('🗺️ Prima data overlay normalizzata:', Array.from(overlayMap.keys())[0]);
    console.log('🗺️ Prima data portfolio normalizzata:', normalizeDateString(dates[0]));
    
    // Mappa i valori dell'overlay agli indici del portfolio
    const overlayPoints = [];
    dates.forEach((date, index) => {
      const normalizedDate = normalizeDateString(date);
      if (overlayMap.has(normalizedDate)) {
        overlayPoints.push({ index, value: overlayMap.get(normalizedDate) });
      }
    });

    console.log('🎯 Punti overlay matchati:', overlayPoints.length);
    
    // Se abbiamo punti, calcola il path
    if (overlayPoints.length > 0) {
      console.log('✅ Generando overlay path con', overlayPoints.length, 'punti');
      console.log('📈 Range valori overlay:', Math.min(...overlayPoints.map(p => p.value)), '-', Math.max(...overlayPoints.map(p => p.value)));
      console.log('📈 Range valori portfolio:', Math.min(...values), '-', Math.max(...values));
      
      overlayPath = overlayPoints.map((point, i) => {
        const x = getX(point.index);
        const y = getY(point.value);
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
      }).join(' ');
      
      console.log('🎨 Overlay path generato:', overlayPath.substring(0, 100) + '...');
    } else {
      console.warn('⚠️ Nessun punto overlay matchato con le date del portfolio');
    }
  }

  const renderTooltip = () => {
    if (!hoverData || !wrapperRef.current) return null;
    const rect = wrapperRef.current.getBoundingClientRect();
    const leftPxRaw = (hoverData.x / WIDTH) * rect.width;
    const topPxRaw = (hoverData.y / HEIGHT) * rect.height;
    const dateLabel = formatDate(hoverData.date, { shortYear: true });
    const valueLabel = formatMoney(hoverData.value);
    const investedLabel = formatMoney(hoverData.invested ?? 0);
    const fontSize = 12;
    const estDate = estimateTextWidth(dateLabel, fontSize);
    const estVal = estimateTextWidth(valueLabel, fontSize);
    const estInv = estimateTextWidth(investedLabel, fontSize);
    const contentMax = Math.max(estDate, estVal, estInv);
    const horizontalPadding = 20;
    const BOX_WIDTH = Math.min(Math.max(140, contentMax + horizontalPadding), Math.min(380, rect.width * 0.7));
    const lineHeight = 18;
    const BOX_HEIGHT = 12 + 3 * lineHeight;
    const offsetFromPoint = 8;
    let left = leftPxRaw - BOX_WIDTH / 2;
    left = Math.max(8, Math.min(rect.width - BOX_WIDTH - 8, left));
    let top = topPxRaw - BOX_HEIGHT - offsetFromPoint;
    if (top < TOP_MARGIN * 0.4) {
      top = topPxRaw + offsetFromPoint;
      if (top + BOX_HEIGHT > rect.height - 8) top = Math.max(8, rect.height - BOX_HEIGHT - 8);
    }
    const tooltipStyle = {
      position: 'absolute',
      left: left,
      top: top,
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
      background: 'linear-gradient(180deg,#151515,#1e1e1e)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
      padding: '8px 10px',
      borderRadius: 8,
      color: '#e6e6e6',
      zIndex: 9999,
      pointerEvents: 'none',
      fontSize: 12,
      lineHeight: '18px'
    };
    return (
      <div style={tooltipStyle} role="tooltip" aria-hidden>
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>{dateLabel}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
          <div style={{ color: '#1e88e5', fontWeight: 700 }}>Valore</div>
          <div style={{ color: '#ddd', fontWeight: 700 }}>{valueLabel}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ color: '#ffb300', fontWeight: 700 }}>Investito</div>
          <div style={{ color: '#ddd', fontWeight: 700 }}>{investedLabel}</div>
        </div>
      </div>
    );
  };



  return (
    <div ref={wrapperRef} className="panel" style={{ marginTop: 18, padding: 14, border: '1px solid #222', position: 'relative' }}>
      <h3 style={{ color: '#fff', marginBottom: 12, fontSize: 18, textAlign: 'center' }}>{title || 'Andamento Storico Portafoglio'}</h3>
      
      {/* Badge Overlay Attivo */}
      {overlayInfo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '12px',
          padding: '10px 16px',
          background: 'rgba(102, 187, 106, 0.1)',
          border: '1px solid rgba(102, 187, 106, 0.3)',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <span style={{ color: '#66bb6a', fontWeight: '600' }}>
            {overlayInfo.type === 'asset' ? '💹' : '📊'} Overlay: {overlayInfo.name}
          </span>
          <button
            onClick={handleRemoveOverlay}
            style={{
              background: 'rgba(239, 83, 80, 0.2)',
              border: '1px solid rgba(239, 83, 80, 0.4)',
              borderRadius: '6px',
              padding: '4px 12px',
              color: '#ef5350',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(239, 83, 80, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(239, 83, 80, 0.2)'}
          >
            ✕ Rimuovi
          </button>
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', gap: '16px', position: 'relative' }}>
        {/* Grafico principale */}
        <div style={{ flex: 1, display: 'block', position: 'relative' }}>
          <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '100%', height: `${HEIGHT}px`, display: 'block', margin: '0 auto' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            {yTicks.map((v, i) => (<line key={i} x1={leftGutter} x2={WIDTH - RIGHT_MARGIN} y1={getY(v)} y2={getY(v)} stroke="#2d2d2d" strokeDasharray="3 3" />))}
            <path d={portfolioPath} fill="none" stroke={highlightColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {showInvested && <path d={investedPath} fill="none" stroke="#ffb300" strokeDasharray="5 5" strokeWidth="2.5" />}
            {overlayPath && <path d={overlayPath} fill="none" stroke="#66bb6a" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.85" />}
            {yTicks.map((labelValue, i) => (<text key={i} x={leftGutter - 12} y={getY(labelValue) + 5} textAnchor="end" fontSize="12" fill="#999">{formatMoney(labelValue)}</text>))}
            {Array.from(new Set([0, Math.floor((values.length - 1) * 0.25), Math.floor((values.length - 1) * 0.5), Math.floor((values.length - 1) * 0.75), values.length - 1])).map((idx) => (
              <text key={idx} x={getX(idx)} y={HEIGHT - BOTTOM_MARGIN + 22} textAnchor="middle" fontSize="12" fill="#999">{formatDate(dates[idx])}</text>
            ))}
            <line x1={leftGutter} x2={leftGutter} y1={TOP_MARGIN - 6} y2={HEIGHT - BOTTOM_MARGIN} stroke="#444" />
            {typeof activeIndex === 'number' && activeIndex >= 0 && activeIndex < values.length && (
              <>
                <line x1={getX(activeIndex)} x2={getX(activeIndex)} y1={TOP_MARGIN} y2={HEIGHT - BOTTOM_MARGIN} stroke={highlightColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.9" />
                <circle cx={getX(activeIndex)} cy={getY(values[activeIndex])} r="5" fill={highlightColor} stroke="#fff" strokeWidth="1.4" />
              </>
            )}
          </svg>

          <div className="chart-controls" style={{ marginTop: 8, marginBottom: 12, textAlign: 'right', opacity: 0.7 }}>
            <button className="btn btn-small" style={{ marginRight: 6, fontSize: 11, padding: '4px 8px', background: '#2a2a2a', border: '1px solid #444', color: '#bbb' }} onClick={() => downloadSvgAsPng(svgRef.current, 'portfolio.png')} aria-label="Scarica PNG">PNG</button>
            <button className="btn btn-small" style={{ marginRight: 8, fontSize: 11, padding: '4px 8px', background: '#2a2a2a', border: '1px solid #444', color: '#bbb' }} onClick={() => exportCsvFromChartData(chartData, 'portfolio.csv')}>CSV</button>
            <label style={{ color: '#999', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={showInvested} onChange={(e) => setShowInvested(e.target.checked)} style={{ transform: 'scale(0.8)' }} /> Totale Investito
            </label>
          </div>

          <div style={{ textAlign: 'center', fontSize: 13 }}>
            <span style={{ color: '#1e88e5', marginRight: 10 }}>Valore Portafoglio</span>
            <span style={{ color: '#ffb300' }}>Totale Investito</span>
          </div>

          {/* KEY METRICS */}
          {finalSummary && <KeyMetricsRow summary={finalSummary} />}

          {renderTooltip()}
        </div>

        {/* Sidebar Strumenti Verticale */}
        <div style={{
          width: '60px',
          height: `${innerHeight}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px 8px',
          background: 'linear-gradient(180deg, rgba(30, 30, 30, 0.9), rgba(20, 20, 20, 0.95))',
          border: '2px solid rgba(102, 187, 106, 0.5)',
          borderRadius: '12px',
          position: 'relative',
          marginTop: `${TOP_MARGIN}px`,
          flexShrink: 0
        }}>
          {/* Header Sidebar */}
          <div style={{
            textAlign: 'center',
            fontSize: '10px',
            color: '#999',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '8px'
          }}>
            Tools
          </div>

          {/* Tool: Aggiungi elemento */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Button + clicked on PortfolioChart!');
              setShowAddModal(true);
            }}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(102, 187, 106, 0.3)',
              border: '2px solid #66bb6a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '28px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 'bold',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102, 187, 106, 0.5)';
              e.target.style.borderColor = '#81c784';
              e.target.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(102, 187, 106, 0.3)';
              e.target.style.borderColor = '#66bb6a';
              e.target.style.transform = 'scale(1)';
            }}
            title="Aggiungi elemento"
          >
            +
          </button>
          <div style={{
            fontSize: '9px',
            color: '#66bb6a',
            textAlign: 'center',
            lineHeight: '1.2',
            maxWidth: '44px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Aggiungi
          </div>

          {/* Footer Sidebar */}
          <div style={{
            textAlign: 'center',
            fontSize: '9px',
            color: '#666',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '8px',
            marginTop: 'auto'
          }}>
            📊
          </div>
        </div>
      </div>

      {/* Modal per aggiungere elementi */}
      {showAddModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            style={{
              background: 'linear-gradient(180deg, #1a1a1a, #0d0d0d)',
              border: '2px solid rgba(102, 187, 106, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                color: '#fff', 
                margin: 0, 
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>📊</span>
                Aggiungi al Grafico
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'rgba(239, 83, 80, 0.1)',
                  border: '1px solid rgba(239, 83, 80, 0.3)',
                  color: '#ef5350',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 83, 80, 0.2)';
                  e.target.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 83, 80, 0.1)';
                  e.target.style.transform = 'rotate(0deg)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Toggle Asset / Indicatori */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '4px'
            }}>
              <button
                onClick={() => {
                  setSearchMode('assets');
                  setSearchTerm('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: searchMode === 'assets' ? 'rgba(102, 187, 106, 0.2)' : 'transparent',
                  border: searchMode === 'assets' ? '1px solid #66bb6a' : '1px solid transparent',
                  borderRadius: '6px',
                  color: searchMode === 'assets' ? '#66bb6a' : '#999',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                💹 Asset Finanziari
              </button>
              <button
                onClick={() => {
                  setSearchMode('indicators');
                  setSearchTerm('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: searchMode === 'indicators' ? 'rgba(102, 187, 106, 0.2)' : 'transparent',
                  border: searchMode === 'indicators' ? '1px solid #66bb6a' : '1px solid transparent',
                  borderRadius: '6px',
                  color: searchMode === 'indicators' ? '#66bb6a' : '#999',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📊 Indicatori
              </button>
            </div>

            {/* Campo di ricerca */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder={searchMode === 'assets' ? 'Cerca asset (es. AAPL, SPY)...' : 'Cerca indicatori FRED...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#66bb6a'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            {/* Risultati ricerca */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '16px'
            }}>
              {isSearching && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  🔍 Ricerca in corso...
                </div>
              )}

              {!isSearching && searchTerm.length >= 2 && searchMode === 'assets' && assetSearchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Nessun asset trovato
                </div>
              )}

              {!isSearching && searchTerm.length >= 2 && searchMode === 'indicators' && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Nessun indicatore trovato
                </div>
              )}

              {/* Risultati Asset */}
              {searchMode === 'assets' && assetSearchResults.map((asset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectAsset(asset)}
                  style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(102, 187, 106, 0.1)';
                    e.target.style.borderColor = '#66bb6a';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>
                    {asset.ticker || asset.symbol}
                  </div>
                  <div style={{ color: '#999', fontSize: '12px' }}>
                    {asset.name || 'Asset finanziario'}
                  </div>
                </div>
              ))}

              {/* Risultati Indicatori */}
              {searchMode === 'indicators' && searchResults.map((indicator, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectIndicator(indicator)}
                  style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(102, 187, 106, 0.1)';
                    e.target.style.borderColor = '#66bb6a';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>
                    {indicator.title}
                  </div>
                  <div style={{ color: '#999', fontSize: '12px' }}>
                    ID: {indicator.id}
                  </div>
                </div>
              ))}
            </div>

            {/* Contenuto Modal */}
            <div style={{
              background: 'rgba(66, 165, 245, 0.1)',
              border: '1px solid rgba(66, 165, 245, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              color: '#42a5f5',
              lineHeight: '1.5'
            }}>
              💡 <strong>Info:</strong> L'asset/indicatore selezionato verrà normalizzato e sovrapposto al grafico del portfolio.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}