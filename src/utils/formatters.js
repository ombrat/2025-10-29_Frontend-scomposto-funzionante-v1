export const formatDate = (dateString, opts = {}) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (opts.shortYear) return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
    if (opts.short) return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

const moneyFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
export const formatMoney = (value) => {
  if (typeof value !== 'number' || !isFinite(value)) return moneyFormatter.format(0);
  return moneyFormatter.format(value);
};

// formatNumber similar to legacy: handles percents/values/sharpe
export const formatNumber = (value, key = '') => {
  if (typeof value !== 'number') return value;
  if (key && (key.includes('percent') || key.includes('volatility') || key.includes('drawdown') || key.includes('cagr') || key.includes('return') || key.includes('year'))) {
    const color = value >= 0 ? '#66bb6a' : '#ef5350';
    return { formatted: `${value.toFixed(2)}%`, color };
  }
  if (key && (key.includes('value') || key.includes('invested') || key.includes('amount') || key.includes('final'))) {
    return { formatted: formatMoney(value), color: '#fff' };
  }
  if (key && (key.includes('sharpe') || key.includes('ratio'))) {
    return { formatted: value.toFixed(2), color: '#fff' };
  }
  return { formatted: value.toLocaleString(), color: '#fff' };
};