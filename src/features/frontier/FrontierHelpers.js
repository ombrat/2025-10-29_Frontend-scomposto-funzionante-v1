/**
 * Helper utilities for efficient frontier feature.
 * Kept lightweight but compatible with the functions used in AppFull.jsx.
 */

/**
 * Convert array-of-weights to object { TICKER: percent }
 */
 export function toCompositionObjectFromArray(arr) {
  if (!Array.isArray(arr)) return null;
  const obj = {};
  for (const it of arr) {
    if (!it || !it.ticker) continue;
    const raw = Number(it.weight ?? it.weight_percent ?? it.pct ?? 0);
    const value = isFinite(raw) ? (raw > 1 ? raw : raw * 100) : 0;
    obj[it.ticker] = Number(value);
  }
  // normalize to sum 100
  const sum = Object.values(obj).reduce((s, v) => s + v, 0) || 1;
  Object.keys(obj).forEach(k => obj[k] = Number(((obj[k] / sum) * 100).toFixed(6)));
  return obj;
}

export function compositionSum(comp) {
  if (!comp || typeof comp !== 'object') return 0;
  return Object.values(comp).reduce((s, v) => s + (Number(v) || 0), 0);
}

export function isFullyInvested(comp) {
  const sum = compositionSum(comp);
  return sum > 99.5 && sum < 100.5;
}

/* sampleEvenIndices: reduce long arrays to at most maxPoints preserving first/last */
export function sampleEvenIndices(arr, maxPoints = 300) {
  if (!Array.isArray(arr)) return arr || [];
  const n = arr.length;
  if (n <= maxPoints) return arr;
  const step = (n - 1) / (maxPoints - 1);
  const indices = [];
  for (let i = 0; i < maxPoints; i++) {
    indices.push(Math.round(i * step));
  }
  const uniq = Array.from(new Set(indices)).sort((a, b) => a - b);
  return uniq.map(i => arr[i]);
}

/* niceTicks - simple numeric ticks generator */
export function niceTicks(min, max, desiredCount = 6) {
  if (!isFinite(min) || !isFinite(max)) return [];
  if (min === max) return [min - 1, min, min + 1];
  const range = max - min;
  const rawStep = range / (Math.max(1, desiredCount - 1));
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / mag;
  let mult = 1;
  if (residual >= 5) mult = 10;
  else if (residual >= 2) mult = 5;
  else if (residual >= 1) mult = 2;
  const step = mag * mult;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Math.round((v + Number.EPSILON) * 100) / 100);
  return ticks;
}