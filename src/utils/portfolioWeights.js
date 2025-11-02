export function buildAssetsPayloadFromPortfolioWeights(portfolioWeights = {}, feeMap = {}) {
  const entries = Object.entries(portfolioWeights || {});
  const assets = [];
  for (const [ticker, rawVal] of entries) {
    let num = null;
    if (typeof rawVal === 'number' && isFinite(rawVal)) num = rawVal;
    else if (typeof rawVal === 'string') {
      const s = rawVal.trim().replace('%', '').replace(',', '.');
      const p = parseFloat(s);
      if (!isNaN(p)) num = p;
    }
    if (num === null) continue;
    const fraction = Math.abs(num) > 1 ? (num / 100) : num;
    const feeObj = feeMap[ticker] || {};
    assets.push({
      ticker,
      weight: fraction,
      entry_fee_percent: typeof feeObj.entry_fee_percent === 'number' ? feeObj.entry_fee_percent : (feeObj.entry_fee_percent ?? 0),
      annual_fee_percent: typeof feeObj.annual_fee_percent === 'number' ? feeObj.annual_fee_percent : (feeObj.annual_fee_percent ?? 0)
    });
  }
  const total = assets.reduce((s, a) => s + (a.weight || 0), 0);
  return { assets, total };
}