export const downloadSvgAsPng = (svgElement, filename = 'chart.png') => {
  if (!svgElement) return;
  try {
    const xml = new XMLSerializer().serializeToString(svgElement);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const b64Start = 'data:image/svg+xml;base64,';
    const image64 = b64Start + svg64;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      // background consistent with dark theme
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const png = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = png;
      a.download = filename;
      a.click();
    };
    img.onerror = (e) => {
      console.error('Errore nel convertire SVG in immagine:', e);
    };
    img.src = image64;
  } catch (e) {
    console.error('downloadSvgAsPng error', e);
  }
};

export const exportCsvFromChartData = (chartData = [], filename = 'chart.csv') => {
  if (!Array.isArray(chartData) || chartData.length === 0) {
    const blob = new Blob([''], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    return;
  }
  const keys = Array.from(new Set(chartData.flatMap(d => Object.keys(d))));
  const rows = [keys.join(',')];
  for (const item of chartData) {
    const row = keys.map(k => {
      const v = item[k] ?? '';
      const s = (typeof v === 'string') ? v.replace(/"/g, '""') : String(v);
      return (s.indexOf(',') >= 0 || s.indexOf('\n') >= 0) ? `"${s}"` : s;
    }).join(',');
    rows.push(row);
  }
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};