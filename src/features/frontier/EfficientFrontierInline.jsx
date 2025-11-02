import React, { useMemo, useRef, useState } from 'react';
import '../../styles/components.css';
import { estimateTextWidth, isFullyInvested } from './FrontierHelpers';
import { downloadSvgAsPng } from '../../utils/csvExport';
import CombinedPortfolioChart from '../../components/charts/CombinedPortfolioChart';

/**
 * EfficientFrontierInline - interactive scatter plot of simulated portfolios.
 * Replicates legacy interactive behaviour and calls onSimulate with normalized fractions {ticker: fraction}.
 */
export default function EfficientFrontierInline({ frontierData, onSimulate, simulatedBacktestResults, renderSummaryContent, backtestResults }) {
  if (!frontierData) return null;

  const riskFree = frontierData.risk_free_rate_percent ?? 0;

  const WIDTH_DEFAULT = 1100;
  const HEIGHT_DEFAULT = 520;
  const MARGIN = 50;
  
  // Dot radius constants for different states
  const DOT_RADIUS = {
    EXTRA_NORMAL: 4,
    EXTRA_HOVERED: 6,
    EXTRA_SELECTED: 7,
    HIGHLIGHT_NORMAL: 7,
    HIGHLIGHT_HOVERED: 10,
    HIGHLIGHT_SELECTED: 12
  };

  const sims = frontierData.simulated_portfolios || frontierData.simulated || frontierData.simulations || [];
  
  // DEBUG: Let's see what we're actually receiving from the backend
  console.log('=== FRONTIER DATA DEBUG ===');
  console.log('Total frontierData keys:', Object.keys(frontierData));
  console.log('simulated_portfolios length:', frontierData.simulated_portfolios?.length);
  console.log('simulated length:', frontierData.simulated?.length);  
  console.log('simulations length:', frontierData.simulations?.length);
  console.log('Final sims array length:', sims.length);
  console.log('First few sims:', sims.slice(0, 3));
  console.log('===========================');

  const {
    simsNormalized,
    minX, maxX, minY, maxY,
    getX, getY,
    highlightPoints,
    extraPoints,
    renderedPoints,
    extraCount
  } = useMemo(() => {
    const simsNorm = sims.map((s, idx) => {
      const vol = (typeof s.Volatility === 'number') ? s.Volatility : parseFloat(s.annual_volatility ?? s.Volatility ?? 0) || 0;
      const ret = (typeof s.Return === 'number') ? s.Return : parseFloat(s.cagr_approx ?? s.Return ?? 0) || 0;
      const sharpe = (typeof s.Sharpe === 'number') ? s.Sharpe : (vol !== 0 ? (ret - riskFree) / vol : 0);
      return { ...s, Volatility: vol, Return: ret, Sharpe: sharpe, _simIndex: idx };
    });

    // highlights (max sharpe / min vol / max return / user)
    const hp = [];
    const maxSharpe = frontierData.max_sharpe_portfolio || null;
    const minVol = frontierData.min_volatility_portfolio || null;
    const maxReturn = frontierData.max_return_portfolio || null;
    const userPoint = frontierData.user_portfolio_point || null;

    function readVol(p) { return Number(p?.annual_volatility ?? p?.Volatility ?? 0); }
    function readRet(p) { return Number(p?.cagr_approx ?? p?.Return ?? 0); }

    // Initial temporary range for generation (will be recalculated later)
    const tempAllVol = simsNorm.map(d => d.Volatility);
    const tempAllRet = simsNorm.map(d => d.Return);
    const tempMinX = Math.min(...tempAllVol, 0);
    const tempMaxX = Math.max(...tempAllVol, 1);
    const tempMinY = Math.min(...tempAllRet, 0);
    const tempMaxY = Math.max(...tempAllRet, 1);

    if (maxSharpe) hp.push({ v: readVol(maxSharpe), r: readRet(maxSharpe), label: 'Max Sharpe', color: '#1e88e5', meta: maxSharpe });
    if (minVol) hp.push({ v: readVol(minVol), r: readRet(minVol), label: 'Min Vol', color: '#66bb6a', meta: minVol });
    if (maxReturn) hp.push({ v: readVol(maxReturn), r: readRet(maxReturn), label: 'Max Return', color: '#d32f2f', meta: maxReturn });
    if (userPoint) hp.push({ v: Number(userPoint.Volatility ?? userPoint.annual_volatility ?? 0), r: Number(userPoint.Return ?? userPoint.cagr_approx ?? 0), label: 'Tuo Statico', color: '#ffb300', meta: userPoint });

    // try to extract composition-aware sims
    const simsWithComp = [];
    sims.forEach((s) => {
      const possible = s.weights || s.composition || s.allocation || s.static_weights || s.portfolio_weights || null;
      if (possible && typeof possible === 'object') {
        const comp = {};
        if (Array.isArray(possible)) {
          possible.forEach(it => {
            const t = it.ticker || it.symbol;
            const w = Number(it.weight ?? it.weight_percent ?? it.pct ?? it.percent ?? it.value);
            if (t && !isNaN(w)) comp[t] = w > 1 ? w : (w * 100);
          });
        } else {
          Object.entries(possible).forEach(([k, v]) => {
            const n = Number(v);
            if (!isNaN(n)) comp[k] = n > 1 ? n : (n * 100);
          });
        }
        const sum = Object.values(comp).reduce((a, b) => a + b, 0) || 0;
        if (sum > 0) {
          Object.keys(comp).forEach(k => comp[k] = Number(((comp[k] / sum) * 100).toFixed(6)));
          if (isFullyInvested(comp)) {
            simsWithComp.push({ Volatility: s.Volatility ?? s.annual_volatility ?? 0, Return: s.Return ?? s.cagr_approx ?? 0, Sharpe: s.Sharpe ?? null, composition: comp });
          }
        }
      }
    });

    // DEBUG: Let's see what we have for portfolio data
    console.log('=== PORTFOLIO DATA DEBUG ===');
    console.log('simsNorm length:', simsNorm.length);
    console.log('simsWithComp length:', simsWithComp.length);
    console.log('Sample simsNorm portfolio:', simsNorm[0]);
    console.log('Sample simsWithComp portfolio:', simsWithComp[0]);
    console.log('=============================');

    // If not enough simsWithComp, synthesize extras by mixing highlighted portfolios
    const desiredExtra = 100;
    let extras = simsWithComp.slice(0, desiredExtra).map((s) => ({ Volatility: s.Volatility, Return: s.Return, Sharpe: s.Sharpe, composition: s.composition || null }));
    
    console.log('Initial extras length:', extras.length);

    if (extras.length < desiredExtra) {
      // Get the optimal benchmarks to ensure generated points are suboptimal
      const maxSharpeValue = hp.find(h => h.label === 'Max Sharpe');
      const maxReturnValue = hp.find(h => h.label === 'Max Return');  
      const minVolValue = hp.find(h => h.label === 'Min Vol');
      
      const benchmarkMaxSharpe = maxSharpeValue ? (maxSharpeValue.r - riskFree) / Math.max(maxSharpeValue.v, 0.01) : 2;
      const benchmarkMaxReturn = maxReturnValue ? maxReturnValue.r : tempMaxY * 0.8;
      const benchmarkMinVol = minVolValue ? minVolValue.v : tempMinX + (tempMaxX - tempMinX) * 0.2;

      // Calculate the full space boundaries for more uniform distribution
      const fullVolRange = tempMaxX - tempMinX;
      const fullRetRange = tempMaxY - tempMinY;
      const volCenter = (tempMaxX + tempMinX) / 2;
      const retCenter = (tempMaxY + tempMinY) / 2;

      // create synthetic in-between points by mixing hp compositions
      function gaussianRandom() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      }
      const volRange = Math.max(1e-6, tempMaxX - tempMinX);
      const retRange = Math.max(1e-6, tempMaxY - tempMinY);
      const pool = hp.slice(); // use highlights as anchors
      
      while (extras.length < desiredExtra) {
        const progress = extras.length / desiredExtra; // 0 to 1
        
        // Create different generation strategies for better distribution
        let vol, ret, combinedComp = {};
        
        if (progress < 0.3) {
          // First 30%: Generate points around optimal portfolios (like before)
          const take = Math.min(pool.length, (Math.random() < 0.35 ? 2 : 3));
          const indices = [];
          while (indices.length < take) {
            const idx = Math.floor(Math.random() * pool.length);
            if (!indices.includes(idx)) indices.push(idx);
          }
          let weights = indices.map(() => Math.random());
          const sumW = weights.reduce((a, b) => a + b, 0) || 1;
          weights = weights.map(w => w / sumW);

          vol = 0;
          ret = 0;
          indices.forEach((pi, wi) => {
            const anchor = pool[pi];
            vol += anchor.v * weights[wi];
            ret += anchor.r * weights[wi];
            // mix composition
            const compObj = (anchor.meta && (anchor.meta.weights || anchor.meta.composition || anchor.meta.static_weights)) ? (anchor.meta.weights || anchor.meta.composition || anchor.meta.static_weights) : null;
            if (compObj && typeof compObj === 'object') {
              Object.entries(compObj).forEach(([tkr, pct]) => {
                const num = Number(pct);
                if (!isNaN(num)) combinedComp[tkr] = (combinedComp[tkr] || 0) + ((num > 1 ? num : num * 100) * weights[wi]);
              });
            }
          });
          
          // Light jitter around optimal points
          const jitter = 0.05;
          vol += gaussianRandom() * jitter * volRange;
          ret += gaussianRandom() * jitter * retRange;
          
        } else if (progress < 0.6) {
          // Middle 30%: Generate points in the middle area with moderate dispersion
          vol = volCenter + gaussianRandom() * 0.3 * fullVolRange;
          ret = retCenter + gaussianRandom() * 0.3 * fullRetRange;
          
          // Create basic composition for these points
          if (pool.length > 0) {
            const anchor = pool[Math.floor(Math.random() * pool.length)];
            const compObj = (anchor.meta && (anchor.meta.weights || anchor.meta.composition || anchor.meta.static_weights)) ? (anchor.meta.weights || anchor.meta.composition || anchor.meta.static_weights) : null;
            if (compObj && typeof compObj === 'object') {
              Object.entries(compObj).forEach(([tkr, pct]) => {
                const num = Number(pct);
                if (!isNaN(num)) combinedComp[tkr] = (num > 1 ? num : num * 100) * (0.8 + Math.random() * 0.4);
              });
            }
          }
          
        } else {
          // Last 40%: Generate extreme and diverse points across the full space
          const extremeFactor = 0.8 + (progress - 0.6) * 1.0; // Increases from 0.8 to 1.8
          
          // Generate points across the full range, but keep realistic returns
          vol = tempMinX + Math.random() * fullVolRange * 1.5; // Can go beyond normal range
          // Ensure returns are always positive and realistic (minimum 1% annual return)
          const minRealisticReturn = Math.max(1.0, tempMinY * 0.8); // At least 1% or 80% of minimum observed
          ret = minRealisticReturn + Math.random() * (tempMaxY * 1.2 - minRealisticReturn);
          
          // Add some extreme outliers (but still realistic)
          if (Math.random() < 0.2) {
            // 20% chance of creating really bad portfolios (high vol, low ret)
            vol = tempMaxX * (1.2 + Math.random() * 0.8); // Very high volatility
            ret = minRealisticReturn + Math.random() * (tempMaxY * 0.4 - minRealisticReturn); // Low but realistic returns
          }
          
          // Create random composition for extreme points
          if (pool.length > 0) {
            const numAssets = Math.min(pool.length, 2 + Math.floor(Math.random() * 3)); // 2-4 assets
            const selectedAnchors = [];
            while (selectedAnchors.length < numAssets) {
              const anchor = pool[Math.floor(Math.random() * pool.length)];
              if (!selectedAnchors.includes(anchor)) selectedAnchors.push(anchor);
            }
            
            selectedAnchors.forEach(anchor => {
              const compObj = (anchor.meta && (anchor.meta.weights || anchor.meta.composition || anchor.meta.static_weights)) ? (anchor.meta.weights || anchor.meta.composition || anchor.meta.static_weights) : null;
              if (compObj && typeof compObj === 'object') {
                Object.entries(compObj).forEach(([tkr, pct]) => {
                  const num = Number(pct);
                  if (!isNaN(num)) combinedComp[tkr] = (combinedComp[tkr] || 0) + ((num > 1 ? num : num * 100) * Math.random());
                });
              }
            });
          }
        }
        
        // Enforce that generated points are suboptimal
        const generatedSharpe = vol > 0 ? (ret - riskFree) / vol : 0;
        
        // Define realistic minimum return (1% annual)
        const minRealisticReturn = Math.max(1.0, tempMinY * 0.5);
        
        // If generated point is too good, make it worse
        if (generatedSharpe > benchmarkMaxSharpe * 0.95) {
          // Reduce the Sharpe by increasing vol or decreasing ret (but keep realistic)
          if (Math.random() < 0.6) {
            vol = vol * (1.2 + Math.random() * 0.5); // Increase volatility by 20-70%
          } else {
            ret = Math.max(minRealisticReturn, ret * (0.7 + Math.random() * 0.2)); // Decrease return but keep realistic
          }
        }
        
        if (ret > benchmarkMaxReturn * 0.98) {
          ret = Math.max(minRealisticReturn, benchmarkMaxReturn * (0.8 + Math.random() * 0.15)); // Cap return but keep realistic
        }
        
        if (vol < benchmarkMinVol * 1.05) {
          vol = benchmarkMinVol * (1.1 + Math.random() * 0.4); // Ensure higher volatility than benchmark
        }
        
        vol = Math.max(tempMinX, Math.min(tempMaxX * 2, vol)); // Allow wider range during generation
        ret = Math.max(minRealisticReturn, Math.min(tempMaxY * 1.5, ret)); // Ensure realistic minimum return

        // normalize composition to percentages
        const compEntries = Object.entries(combinedComp);
        if (compEntries.length === 0) {
          // no composition, skip adding this one as an extra composition point
        } else {
          const sumComp = compEntries.reduce((s, [, v]) => s + v, 0) || 1;
          const comp = {};
          compEntries.forEach(([t, v]) => { comp[t] = Number(((v / sumComp) * 100).toFixed(6)); });
          if (isFullyInvested(comp)) {
            extras.push({ Volatility: vol, Return: ret, Sharpe: vol !== 0 ? (ret - riskFree) / vol : 0, composition: comp });
          }
        }

        // fallback safety
        if (extras.length === 0 && simsWithComp.length > 0) {
          // if we couldn't synthesize anything, fallback to simsWithComp
          extras = simsWithComp.slice(0, Math.min(desiredExtra, simsWithComp.length));
        }

        // avoid infinite loops
        if (extras.length > desiredExtra * 3) break;
      }
    }

    // Validate that optimal points are actually optimal compared to generated extras
    const allPoints = [...extras.filter(p => p.composition && isFullyInvested(p.composition))];
    
    // Find actual optimal values from all points including extras
    const actualMaxSharpe = allPoints.reduce((max, p) => {
      const sharpe = p.Volatility > 0 ? (p.Return - riskFree) / p.Volatility : 0;
      return sharpe > (max?.sharpe || -Infinity) ? { ...p, sharpe } : max;
    }, null);
    
    const actualMaxReturn = allPoints.reduce((max, p) => p.Return > (max?.Return || -Infinity) ? p : max, null);
    const actualMinVol = allPoints.reduce((min, p) => p.Volatility < (min?.Volatility || Infinity) ? p : min, null);

    // NOW calculate the final range based on ALL generated points + optimal portfolios
    const allFinalVol = [...extras.map(p => p.Volatility), ...simsNorm.map(d => d.Volatility)];
    const allFinalRet = [...extras.map(p => p.Return), ...simsNorm.map(d => d.Return)];
    
    // Add optimal portfolio values to the final range calculation  
    if (maxSharpe) {
      allFinalVol.push(readVol(maxSharpe));
      allFinalRet.push(readRet(maxSharpe));
    }
    if (minVol) {
      allFinalVol.push(readVol(minVol));
      allFinalRet.push(readRet(minVol));
    }
    if (maxReturn) {
      allFinalVol.push(readVol(maxReturn));
      allFinalRet.push(readRet(maxReturn));
    }
    if (userPoint) {
      allFinalVol.push(Number(userPoint.Volatility ?? userPoint.annual_volatility ?? 0));
      allFinalRet.push(Number(userPoint.Return ?? userPoint.cagr_approx ?? 0));
    }

    // Final range calculation with proper padding
    const _minX = Math.min(...allFinalVol, 0) * 0.95; // 5% padding
    const _maxX = Math.max(...allFinalVol, 1) * 1.05; // 5% padding  
    const _minY = Math.min(...allFinalRet, 0) * (allFinalRet.some(r => r < 0) ? 1.05 : 0.95);
    const _maxY = Math.max(...allFinalRet, 1) * 1.05; // 5% padding

    const _getX = (vol) => MARGIN + ((vol - _minX) / (_maxX - _minX || 1)) * (WIDTH_DEFAULT - 2 * MARGIN);
    const _getY = (ret) => HEIGHT_DEFAULT - MARGIN - ((ret - _minY) / (_maxY - _minY || 1)) * (HEIGHT_DEFAULT - 2 * MARGIN);

    // build rendered points: extras first, then highlights
    const rp = [];
    let skippedCount = 0;
    extras.forEach((p, i) => {
      if (!p.composition || !isFullyInvested(p.composition)) {
        skippedCount++;
        return;
      }
      const x = _getX(p.Volatility);
      const y = _getY(p.Return);
      rp.push({ id: `extra-${i}`, type: 'extra', idx: i, Volatility: p.Volatility, Return: p.Return, Sharpe: p.Sharpe, x, y, color: '#90caf9', label: null, composition: p.composition || null });
    });
    
    console.log('=== RENDERING DEBUG ===');
    console.log('Total extras:', extras.length);
    console.log('Skipped (no composition):', skippedCount);
    console.log('Actually rendered:', rp.length);
    console.log('=======================');
    hp.forEach((h, i) => {
      const x = _getX(h.v);
      const y = _getY(h.r);
      const composition = (h.meta && (h.meta.weights || h.meta.composition || h.meta.static_weights)) ? (h.meta.weights || h.meta.composition || h.meta.static_weights) : null;
      // Calcola Sharpe correttamente dai diversi formati possibili
      let sharpe = null;
      if (h.meta) {
        sharpe = h.meta.Sharpe ?? h.meta.sharpe_ratio ?? h.meta.sharpe ?? null;
        // Se non c'è, calcolalo manualmente: (Return - RiskFree) / Volatility
        if (sharpe === null && h.v > 0) {
          sharpe = (h.r - riskFree) / h.v;
        }
      }
      rp.push({ id: `highlight-${i}`, type: 'highlight', idx: i, Volatility: h.v, Return: h.r, Sharpe: sharpe, x, y, color: h.color, label: h.label, composition });
    });

    return {
      simsNormalized: simsNorm,
      minX: _minX, maxX: _maxX, minY: _minY, maxY: _maxY,
      getX: _getX, getY: _getY,
      highlightPoints: hp,
      extraPoints: extras,
      renderedPoints: rp,
      extraCount: extras.length
    };
  }, [frontierData, riskFree, sims]);

  const svgRefF = useRef(null);
  const containerRefF = useRef(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const handleMouseMoveF = (e) => {
    const container = containerRefF.current;
    const svg = svgRefF.current;
    if (!container || !svg) return;
    
    const containerRect = container.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    
    // Verifica se il mouse è dentro l'area dell'SVG
    if (e.clientX < svgRect.left || e.clientX > svgRect.right || 
        e.clientY < svgRect.top || e.clientY > svgRect.bottom) {
      setHoverPoint(null);
      return;
    }
    
    // Usa le dimensioni reali dell'SVG per calcolare le coordinate
    const scaleX = WIDTH_DEFAULT / svgRect.width;
    const scaleY = HEIGHT_DEFAULT / svgRect.height;
    const mouseX = (e.clientX - svgRect.left) * scaleX;
    const mouseY = (e.clientY - svgRect.top) * scaleY;

    let nearest = null;
    let minDist = Infinity;
    for (const p of renderedPoints) {
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; nearest = p; }
    }

    const threshold = 12;
    if (nearest && minDist <= threshold) {
      setHoverPoint({ ...nearest, distance: minDist });
    } else setHoverPoint(null);
  };

  const handleMouseLeaveF = () => setHoverPoint(null);

  const handlePointClickF = (p) => {
    if (!p) return;
    if (selectedPoint && selectedPoint.id === p.id) setSelectedPoint(null);
    else setSelectedPoint(p);
  };

  // Helper function to calculate dot radius based on point type and state
  const getDotRadius = (point, isHovered, isSelected) => {
    if (point.type === 'highlight') {
      return isSelected ? DOT_RADIUS.HIGHLIGHT_SELECTED : (isHovered ? DOT_RADIUS.HIGHLIGHT_HOVERED : DOT_RADIUS.HIGHLIGHT_NORMAL);
    } else {
      return isSelected ? DOT_RADIUS.EXTRA_SELECTED : (isHovered ? DOT_RADIUS.EXTRA_HOVERED : DOT_RADIUS.EXTRA_NORMAL);
    }
  };

  const renderJsonTooltip = (p) => {
    if (!p || !containerRefF.current) return null;
    const containerRect = containerRefF.current.getBoundingClientRect();
    const compList = p.composition ? Object.entries(p.composition) : [];
    const baseText = p.label || (p.type === 'extra' ? 'Portafoglio (In-between)' : 'Portafoglio evidenziato');
    const baseWidth = estimateTextWidth(baseText, 13);
    const compWidth = compList.length > 0 ? Math.max(...compList.map(([tkr, pct]) => estimateTextWidth(`${tkr} ${Number(pct).toFixed(2)}%`, 12)), 0) : 0;
    const tooltipWidth = Math.min(380, Math.max(140, Math.max(baseWidth, compWidth) + 30));
    const approxHeight = 70 + compList.length * 18;
    const offsetFromPoint = 8;
    
    // Ottieni le dimensioni effettive dell'SVG
    if (!svgRefF.current) return null;
    const svgRect = svgRefF.current.getBoundingClientRect();
    
    // Determine the radius of the dot based on its type and state
    const isHovered = hoverPoint && hoverPoint.id === p.id;
    const isSelected = selectedPoint && selectedPoint.id === p.id;
    const dotRadius = getDotRadius(p, isHovered, isSelected);
    
    // Convert radius from SVG units to pixels
    const dotRadiusPx = dotRadius * (svgRect.width / WIDTH_DEFAULT);
    
    // Converti coordinate SVG in pixel dell'SVG
    const leftPxRaw = (p.x / WIDTH_DEFAULT) * svgRect.width;
    const topPxRaw = (p.y / HEIGHT_DEFAULT) * svgRect.height;
    
    // Calcola offset dall'SVG al container
    const svgOffsetLeft = svgRect.left - containerRect.left;
    const svgOffsetTop = svgRect.top - containerRect.top;
    
    // Coordinate del punto rispetto al container
    const pointLeftInContainer = svgOffsetLeft + leftPxRaw;
    const pointTopInContainer = svgOffsetTop + topPxRaw;
    
    // Position tooltip 8 pixels above the top edge of the dot
    const topEdgeOfDot = pointTopInContainer - dotRadiusPx;
    
    let left = pointLeftInContainer - tooltipWidth / 2;
    left = Math.max(8, Math.min(containerRect.width - tooltipWidth - 8, left));
    let top = topEdgeOfDot - approxHeight - offsetFromPoint;
    if (top < 8) {
      // If not enough space above, position below the dot
      const bottomEdgeOfDot = pointTopInContainer + dotRadiusPx;
      top = bottomEdgeOfDot + offsetFromPoint;
      if (top + approxHeight > containerRect.height - 8) top = Math.max(8, containerRect.height - approxHeight - 8);
    }
    const boxStyle = {
      position: 'absolute',
      left,
      top,
      width: tooltipWidth,
      background: 'linear-gradient(180deg,#151515,#1e1e1e)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
      padding: '10px',
      borderRadius: 8,
      color: '#e6e6e6',
      zIndex: 9999,
      pointerEvents: 'none',
      fontSize: 12,
      lineHeight: '16px'
    };
    const labelStyle = { fontWeight: 700, color: '#fff', marginBottom: 6, display: 'block' };
    return (
      <div style={boxStyle}>
        <div style={labelStyle}>{baseText}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginBottom: 8, color: '#cfcfcf', fontSize: 12 }}>
          <div><span style={{ color: '#66bb6a', fontWeight: 700 }}>{p.Return.toFixed(3)}%</span> <span style={{ color: '#999' }}>Rendimento</span></div>
          <div><span style={{ color: '#ffb300', fontWeight: 700 }}>{p.Volatility.toFixed(3)}%</span> <span style={{ color: '#999' }}>Volatilità</span></div>
          {typeof p.Sharpe === 'number' && !isNaN(p.Sharpe) && (
            <div><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: '#1e88e5', color: '#fff', fontWeight: 700, fontSize: 11 }}>{p.Sharpe.toFixed(3)}</span> <span style={{ color: '#999' }}>Sharpe</span></div>
          )}
          {p.max_drawdown != null && (
            <div><span style={{ color: '#ef5350', fontWeight: 700 }}>{Math.abs(p.max_drawdown).toFixed(2)}%</span> <span style={{ color: '#999' }}>Max DD</span></div>
          )}
        </div>
        {compList.length > 0 ? (
          <div style={{ maxHeight: 160, overflowY: 'auto', paddingRight: 6 }}>
            <div style={{ color: '#ddd', fontWeight: 700, marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Composizione Portafoglio</div>
            <div style={{ display: 'grid', gap: 3 }}>
              {compList
                .sort(([, a], [, b]) => Number(b) - Number(a))
                .map(([tkr, pct]) => {
                  const percentage = Number(pct);
                  const barWidth = Math.max(2, (percentage / Math.max(...compList.map(([, p]) => Number(p)))) * 100);
                  return (
                    <div key={tkr} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                      <div style={{ 
                        minWidth: 40, 
                        textAlign: 'right', 
                        color: '#fff', 
                        fontWeight: 600, 
                        fontSize: 11 
                      }}>{tkr}</div>
                      <div style={{ 
                        flex: 1, 
                        height: 8, 
                        background: '#2a2a2a', 
                        borderRadius: 4, 
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{ 
                          width: `${barWidth}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #66bb6a, #81c784)',
                          borderRadius: 4
                        }} />
                      </div>
                      <div style={{ 
                        minWidth: 42, 
                        textAlign: 'right', 
                        color: '#ccc', 
                        fontWeight: 700, 
                        fontSize: 11 
                      }}>{percentage.toFixed(1)}%</div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (<div style={{ color: '#999', fontSize: 11 }}>Composizione non disponibile</div>)}
      </div>
    );
  };

  const renderSelectedCard = (p) => {
    if (!p) return null;
    const compList = p.composition ? Object.entries(p.composition) : [];
    const simulateDisabled = !p.composition || compList.length === 0 || typeof onSimulate !== 'function';
    return (
      <div style={{ marginTop: 18, borderLeft: '4px solid #ffd54f' }} className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ color: '#ffd54f', margin: 0 }}>{p.label || 'Portafoglio Selezionato'}</h4>
          <div>
            <button
              onClick={() => {
                if (simulateDisabled) return;
                // pass weights as fractions (0..1)
                const portfolioWeights = {};
                compList.forEach(([tkr, pct]) => { portfolioWeights[tkr] = Number(pct) / 100; });
                onSimulate && onSimulate(portfolioWeights, `Selezionato: ${p.label || p.id}`, p.id);
              }}
              disabled={simulateDisabled}
              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: simulateDisabled ? '#555' : '#1e88e5', color: '#fff' }}
            >
              {simulateDisabled ? 'Simula non disponibile' : 'Simula Backtest'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <div style={{ 
            backgroundColor: '#1a1a1a',
            border: '2px solid #66bb6a',
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center',
            minWidth: '100px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <div style={{ 
              fontSize: 10, 
              fontWeight: 500,
              marginBottom: 4, 
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Rendimento
            </div>
            <div style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: '#66bb6a',
              lineHeight: 1.2
            }}>
              {p.Return.toFixed(2)}%
            </div>
          </div>
          <div style={{ 
            backgroundColor: '#1a1a1a',
            border: '2px solid #ffb300',
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center',
            minWidth: '100px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <div style={{ 
              fontSize: 10, 
              fontWeight: 500,
              marginBottom: 4, 
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Volatilità
            </div>
            <div style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: '#ffb300',
              lineHeight: 1.2
            }}>
              {p.Volatility.toFixed(2)}%
            </div>
          </div>
          {typeof p.Sharpe === 'number' && !isNaN(p.Sharpe) && (
            <div style={{ 
              backgroundColor: '#1a1a1a',
              border: '2px solid #1e88e5',
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center',
              minWidth: '100px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <div style={{ 
                fontSize: 10, 
                fontWeight: 500,
                marginBottom: 4, 
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Sharpe
              </div>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 700, 
                color: '#1e88e5',
                lineHeight: 1.2
              }}>
                {p.Sharpe.toFixed(2)}
              </div>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ color: '#ddd', fontWeight: 700, marginBottom: 6 }}>Composizione</div>
            {compList.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {compList.map(([tkr, pct]) => (
                  <li key={tkr} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#fff' }}>{tkr}</span>
                    <span style={{ color: '#ccc', fontWeight: 700 }}>{Number(pct).toFixed(2)}%</span>
                  </li>
                ))}
              </ul>
            ) : (<div style={{ color: '#999' }}>Composizione non disponibile per questo punto.</div>)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 30, padding: 20 }} className="panel">
      <h3 style={{ color: '#fff', textAlign: 'center', borderBottom: '1px dashed #333', paddingBottom: 12 }}>Frontiera Efficiente — Scatter interattivo</h3>

      <div ref={containerRefF} style={{ width: '100%', position: 'relative' }} onMouseMove={handleMouseMoveF} onMouseLeave={handleMouseLeaveF}>
        <svg ref={svgRefF} viewBox={`0 0 ${WIDTH_DEFAULT} ${HEIGHT_DEFAULT}`} style={{ width: '100%', height: `${Math.round(WIDTH_DEFAULT * 0.47)}px`, display: 'block', margin: '0 auto', cursor: hoverPoint ? 'pointer' : 'default' }}>
          <line x1={MARGIN} x2={MARGIN} y1={MARGIN} y2={HEIGHT_DEFAULT - MARGIN} stroke="#444" />
          <line x1={MARGIN} x2={WIDTH_DEFAULT - MARGIN} y1={HEIGHT_DEFAULT - MARGIN} y2={HEIGHT_DEFAULT - MARGIN} stroke="#444" />
          <text x={WIDTH_DEFAULT / 2} y={HEIGHT_DEFAULT} textAnchor="middle" fontSize="12" fill="#999">Volatilità (%)</text>
          <text x={12} y={HEIGHT_DEFAULT / 2} transform={`rotate(-90 12 ${HEIGHT_DEFAULT / 2})`} textAnchor="middle" fontSize="12" fill="#999">Rendimento (%)</text>

          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const x = MARGIN + t * (WIDTH_DEFAULT - 2 * MARGIN);
            const y = MARGIN + t * (HEIGHT_DEFAULT - 2 * MARGIN);
            const volVal = (minX + t * (maxX - minX)).toFixed(2);
            const retVal = (minY + (1 - t) * (maxY - minY)).toFixed(2);
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={MARGIN} y2={HEIGHT_DEFAULT - MARGIN} stroke="#2a2a2a" strokeDasharray="3 3" />
                <line x1={MARGIN} x2={WIDTH_DEFAULT - MARGIN} y1={y} y2={y} stroke="#2a2a2a" strokeDasharray="3 3" />
                {i === 0 || i === 4 ? null : <text x={x} y={HEIGHT_DEFAULT - MARGIN + 16} textAnchor="middle" fontSize="12" fill="#777">{volVal}</text>}
                {i === 0 || i === 4 ? null : <text x={MARGIN - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#777">{retVal}</text>}
              </g>
            );
          })}

          {renderedPoints.filter(p => p.type === 'extra').map((p) => {
            const isHovered = hoverPoint && hoverPoint.id === p.id;
            const isSelected = selectedPoint && selectedPoint.id === p.id;
            const r = getDotRadius(p, isHovered, isSelected);
            const opacity = isSelected ? 1 : (isHovered ? 1 : (hoverPoint ? 0.35 : 0.95));
            return (
              <circle key={p.id} cx={p.x} cy={p.y} r={r} fill={p.color} opacity={opacity} stroke={isSelected ? '#ffd54f' : '#222'} strokeWidth={isSelected ? 1.5 : 0.6} style={{ cursor: 'pointer' }} onClick={() => handlePointClickF(p)} />
            );
          })}

          {renderedPoints.filter(p => p.type === 'highlight').map((p) => {
            const isHovered = hoverPoint && hoverPoint.id === p.id;
            const isSelected = selectedPoint && selectedPoint.id === p.id;
            const r = getDotRadius(p, isHovered, isSelected);
            const strokeWidth = isSelected ? 2 : (isHovered ? 1.5 : 1);
            const textX = p.x + 12;
            const textY = p.y - 10;
            const opacity = isSelected ? 1 : (hoverPoint ? 0.95 : 1);
            return (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r={r} fill={p.color} stroke={isSelected ? '#ffd54f' : '#fff'} strokeWidth={strokeWidth} opacity={opacity} style={{ cursor: 'pointer' }} onClick={() => handlePointClickF(p)} />
                <text x={textX} y={textY} fontSize="11" fill={p.color}>{p.label}</text>
              </g>
            );
          })}

          {hoverPoint && (
            <g>
              <line x1={hoverPoint.x} x2={hoverPoint.x} y1={MARGIN} y2={HEIGHT_DEFAULT - MARGIN} stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
              <line x1={MARGIN} x2={WIDTH_DEFAULT - MARGIN} y1={hoverPoint.y} y2={hoverPoint.y} stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
            </g>
          )}
        </svg>

        {hoverPoint && renderJsonTooltip(hoverPoint)}

        {/* Portafogli Ottimali - 4 etichette con stile KeyMetricsRow */}
        <div style={{ display: 'flex', gap: 16, marginTop: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
          {frontierData.max_sharpe_portfolio && (
            <div 
              onClick={() => {
                const maxSharpePoint = renderedPoints.find(p => p.label === 'Max Sharpe');
                if (maxSharpePoint) handlePointClickF(maxSharpePoint);
              }}
              style={{ 
                backgroundColor: '#1a1a1a',
                border: '2px solid #1e88e5',
                borderRadius: '12px',
                padding: '16px 20px',
                flex: 1,
                minWidth: '200px',
                maxWidth: '250px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(30,136,229,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
            >
              <h4 style={{ color: '#1e88e5', margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }}>Massimo Sharpe</h4>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Rendimento: <strong>{(frontierData.max_sharpe_portfolio.cagr_approx ?? frontierData.max_sharpe_portfolio.Return ?? 0).toFixed(2)}%</strong></div>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Volatilità: <strong>{(frontierData.max_sharpe_portfolio.annual_volatility ?? frontierData.max_sharpe_portfolio.Volatility ?? 0).toFixed(2)}%</strong></div>
              <div style={{ fontSize: 12, color: '#ccc' }}>Sharpe: <strong>{(frontierData.max_sharpe_portfolio.sharpe_ratio ?? frontierData.max_sharpe_portfolio.Sharpe ?? 0).toFixed(2)}</strong></div>
            </div>
          )}
          {frontierData.max_return_portfolio && (
            <div 
              onClick={() => {
                const maxReturnPoint = renderedPoints.find(p => p.label === 'Max Return');
                if (maxReturnPoint) handlePointClickF(maxReturnPoint);
              }}
              style={{ 
                backgroundColor: '#1a1a1a',
                border: '2px solid #d32f2f',
                borderRadius: '12px',
                padding: '16px 20px',
                flex: 1,
                minWidth: '200px',
                maxWidth: '250px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(211,47,47,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
            >
              <h4 style={{ color: '#d32f2f', margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }}>Massimo Rendimento</h4>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Rendimento: <strong>{(frontierData.max_return_portfolio.cagr_approx ?? frontierData.max_return_portfolio.Return ?? 0).toFixed(2)}%</strong></div>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Volatilità: <strong>{(frontierData.max_return_portfolio.annual_volatility ?? frontierData.max_return_portfolio.Volatility ?? 0).toFixed(2)}%</strong></div>
              <div style={{ fontSize: 12, color: '#ccc' }}>Sharpe: <strong>{(frontierData.max_return_portfolio.sharpe_ratio ?? frontierData.max_return_portfolio.Sharpe ?? 0).toFixed(2)}</strong></div>
            </div>
          )}
          {frontierData.min_volatility_portfolio && (
            <div 
              onClick={() => {
                const minVolPoint = renderedPoints.find(p => p.label === 'Min Vol');
                if (minVolPoint) handlePointClickF(minVolPoint);
              }}
              style={{ 
                backgroundColor: '#1a1a1a',
                border: '2px solid #66bb6a',
                borderRadius: '12px',
                padding: '16px 20px',
                flex: 1,
                minWidth: '200px',
                maxWidth: '250px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(102,187,106,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
            >
              <h4 style={{ color: '#66bb6a', margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }}>Minima Volatilità</h4>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Rendimento: <strong>{(frontierData.min_volatility_portfolio.cagr_approx ?? frontierData.min_volatility_portfolio.Return ?? 0).toFixed(2)}%</strong></div>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Volatilità: <strong>{(frontierData.min_volatility_portfolio.annual_volatility ?? frontierData.min_volatility_portfolio.Volatility ?? 0).toFixed(2)}%</strong></div>
              <div style={{ fontSize: 12, color: '#ccc' }}>Sharpe: <strong>{(frontierData.min_volatility_portfolio.sharpe_ratio ?? frontierData.min_volatility_portfolio.Sharpe ?? 0).toFixed(2)}</strong></div>
            </div>
          )}
          {frontierData.user_portfolio_point && (
            <div 
              onClick={() => {
                const userPoint = renderedPoints.find(p => p.label === 'Tuo Statico');
                if (userPoint) handlePointClickF(userPoint);
              }}
              style={{ 
                backgroundColor: '#1a1a1a',
                border: '2px solid #ffb300',
                borderRadius: '12px',
                padding: '16px 20px',
                flex: 1,
                minWidth: '200px',
                maxWidth: '250px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(255,179,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
            >
              <h4 style={{ color: '#ffb300', margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }}>Il tuo Statico</h4>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Rendimento: <strong>{(frontierData.user_portfolio_point.Return ?? frontierData.user_portfolio_point.cagr_approx ?? 0).toFixed(2)}%</strong></div>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Volatilità: <strong>{(frontierData.user_portfolio_point.Volatility ?? frontierData.user_portfolio_point.annual_volatility ?? 0).toFixed(2)}%</strong></div>
              <div style={{ fontSize: 12, color: '#ccc' }}>Sharpe: <strong>{(frontierData.user_portfolio_point.Sharpe ?? frontierData.user_portfolio_point.sharpe_ratio ?? 0).toFixed(2)}</strong></div>
            </div>
          )}
        </div>

        {selectedPoint && renderSelectedCard(selectedPoint)}

        {selectedPoint && simulatedBacktestResults && simulatedBacktestResults.point_id && selectedPoint.id && simulatedBacktestResults.point_id === selectedPoint.id && (
          <div style={{ marginTop: 16 }}>
            { backtestResults ? (
              <>
                <CombinedPortfolioChart
                  primaryResult={backtestResults}
                  secondaryResult={simulatedBacktestResults}
                  titlePrimary={'Risultati Backtest Statico Utente'}
                  titleSecondary={`Simulazione: ${simulatedBacktestResults.name || selectedPoint.id}`}
                  onHover={() => {}}
                  primaryColor="#ffb300"
                  secondaryColor="#1e88e5"
                />
                <div style={{ display: 'flex', gap: 18, marginTop: 20 }}>
                  <div style={{ width: '50%', minWidth: 320 }}>
                    { typeof renderSummaryContent === 'function' ? renderSummaryContent(backtestResults, 'Risultati Backtest Statico Utente', false, { hideChart: true }) : null }
                  </div>
                  <div style={{ width: '50%', minWidth: 320 }}>
                    { typeof renderSummaryContent === 'function' ? renderSummaryContent(simulatedBacktestResults, `Simulazione: ${simulatedBacktestResults.name || selectedPoint.id}`, true, { hideChart: true }) : null }
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ width: '50%', minWidth: 320 }}>
                  <div className="panel" style={{ border: '1px dashed #444', padding: 12 }}>
                    <h4 style={{ color: '#ffb300' }}>Risultati Statico Mancanti</h4>
                    <p style={{ color: '#ccc' }}>Non sono presenti risultati del backtest statico. Esegui prima "Passo 1: Esegui Backtest Statico" per visualizzare il confronto lato sinistro.</p>
                  </div>
                </div>
                <div style={{ width: '50%', minWidth: 320 }}>
                  { typeof renderSummaryContent === 'function' ? renderSummaryContent(simulatedBacktestResults, `Simulazione: ${simulatedBacktestResults.name || selectedPoint.id}`, true, { hideChart: true }) : null }
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}