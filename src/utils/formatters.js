export const moneyFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

export function formatMoney(v) {
  if (typeof v !== 'number' || !isFinite(v)) return moneyFormatter.format(0);
  return moneyFormatter.format(v);
}

export function formatDateShort(dateString) {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('it-IT');
  } catch (e) {
    return dateString;
  }
}