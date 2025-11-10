export const MAX_DISPLAY_POINTS = 300;

export const sampleEvenIndices = (arr, maxPoints = MAX_DISPLAY_POINTS) => {
  if (!Array.isArray(arr)) return arr || [];
  const n = arr.length;
  if (n <= maxPoints) return arr;
  const step = (n - 1) / (maxPoints - 1);
  const indices = [];
  const used = new Set();
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    const clamped = Math.max(0, Math.min(n - 1, idx));
    if (!used.has(clamped)) {
      indices.push(clamped);
      used.add(clamped);
    } else {
      let found = -1;
      for (let d = 1; d < n; d++) {
        const fwd = clamped + d;
        const bwd = clamped - d;
        if (fwd < n && !used.has(fwd)) { found = fwd; break; }
        if (bwd >= 0 && !used.has(bwd)) { found = bwd; break; }
      }
      if (found !== -1) { indices.push(found); used.add(found); }
    }
  }
  if (indices.length < maxPoints) {
    for (let i = 0; i < n && indices.length < maxPoints; i++) {
      if (!used.has(i)) { indices.push(i); used.add(i); }
    }
  }
  indices.sort((a, b) => a - b);
  return indices.slice(0, maxPoints).map(i => arr[i]);
};

export const niceTicks = (min, max, desiredCount = 6) => {
  if (!isFinite(min) || !isFinite(max)) return [];
  if (min === max) {
    const base = Math.abs(min) || 1;
    return [min - base, min, min + base];
  }
  const range = max - min;
  const rawStep = range / (desiredCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceMultiplier = 1;
  if (residual >= 5) niceMultiplier = 10;
  else if (residual >= 2) niceMultiplier = 5;
  else if (residual >= 1) niceMultiplier = 2;
  else niceMultiplier = 1;
  const step = magnitude * niceMultiplier;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + 0.5 * step; v += step) {
    const rounded = Math.round((v + Number.EPSILON) * 100) / 100;
    if (rounded >= niceMin - 1e-9 && rounded <= niceMax + 1e-9) ticks.push(rounded);
    if (ticks.length > desiredCount * 3) break;
  }
  if (ticks.length < 3) {
    const fallback = [];
    const altStep = range / (desiredCount - 1);
    for (let i = 0; i < desiredCount; i++) {
      fallback.push(Math.round((min + i * altStep) * 100) / 100);
    }
    return fallback;
  }
  return ticks;
};

export const estimateTextWidth = (text, fontSize = 13) => {
  const avgChar = fontSize * 0.55;
  return Math.ceil(String(text || '').length * avgChar);
};

// Composition helpers used by EfficientFrontierInline
export const toCompositionObjectFromArray = (arr) => {
  if (!Array.isArray(arr)) return null;
  const obj = {};
  for (const it of arr) {
    if (!it || !it.ticker) continue;
    const w = Number(it.weight || 0);
    obj[it.ticker] = w > 1 ? w : Number((w * 100).toFixed(6));
  }
  Object.keys(obj).forEach(k => obj[k] = Number(obj[k]));
  return obj;
};

export const compositionSum = (comp) => {
  if (!comp || typeof comp !== 'object') return 0;
  return Object.values(comp).reduce((s, v) => s + (Number(v) || 0), 0);
};

export const isFullyInvested = (comp) => {
  const sum = compositionSum(comp);
  return sum > 99.5 && sum < 100.5;
};