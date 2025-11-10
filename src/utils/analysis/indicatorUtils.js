/**
 * Funzioni di utilità per indicatori economici
 */

/**
 * Formatta un valore con la sua unità di misura appropriata
 * @param {number|string} value - Il valore da formattare
 * @param {object} indicator - Oggetto indicatore con metadati (units, id, etc.)
 * @param {boolean} includeUnit - Se includere l'unità nel risultato
 * @returns {string} Valore formattato
 */
export const formatValue = (value, indicator, includeUnit = false) => {
  if (value === null || value === undefined || value === '.') return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  
  // Ottieni l'unità dall'indicatore
  const units = indicator?.units || '';
  
  // Determina il formato in base all'unità
  let formattedValue = '';
  let unit = '';
  
  // Percentuali
  if (units.toLowerCase().includes('percent') || 
      units === '%' || 
      indicator?.id?.includes('RATE') || 
      indicator?.id?.includes('DGS')) {
    formattedValue = num.toFixed(2);
    return includeUnit ? `${formattedValue}%` : formattedValue;
  }
  // Indici (Index, Index Numbers)
  else if (units.toLowerCase().includes('index')) {
    formattedValue = num.toFixed(2);
    unit = ' pts';
  }
  // Miliardi di dollari
  else if (units.toLowerCase().includes('billions') || units.includes('Bil.')) {
    formattedValue = num.toFixed(1);
    return includeUnit ? `$${formattedValue}B` : formattedValue;
  }
  // Milioni di dollari o persone
  else if (units.toLowerCase().includes('millions')) {
    if (units.toLowerCase().includes('dollar') || units.includes('$')) {
      formattedValue = num.toFixed(1);
      return includeUnit ? `$${formattedValue}M` : formattedValue;
    } else if (units.toLowerCase().includes('person')) {
      formattedValue = num.toFixed(2);
      unit = 'M pers.';
    } else {
      formattedValue = num.toFixed(1);
      unit = 'M';
    }
  }
  // Migliaia (Thousands)
  else if (units.toLowerCase().includes('thousand')) {
    if (units.toLowerCase().includes('dollar') || units.includes('$')) {
      formattedValue = num.toFixed(0);
      return includeUnit ? `$${formattedValue}K` : formattedValue;
    } else if (units.toLowerCase().includes('person')) {
      formattedValue = num.toFixed(0);
      unit = 'K pers.';
    } else {
      formattedValue = num.toFixed(0);
      unit = 'K';
    }
  }
  // Dollari semplici
  else if (units.toLowerCase().includes('dollar') || units.includes('$')) {
    if (num > 1000000000) {
      formattedValue = (num / 1000000000).toFixed(2);
      return includeUnit ? `$${formattedValue}B` : formattedValue;
    } else if (num > 1000000) {
      formattedValue = (num / 1000000).toFixed(1);
      return includeUnit ? `$${formattedValue}M` : formattedValue;
    } else if (num > 1000) {
      formattedValue = (num / 1000).toFixed(1);
      return includeUnit ? `$${formattedValue}K` : formattedValue;
    } else {
      formattedValue = num.toFixed(2);
      return includeUnit ? `$${formattedValue}` : formattedValue;
    }
  }
  // Numeri puri grandi (per GDP, popolazione, ecc.)
  else if (num > 1000000000) {
    formattedValue = (num / 1000000000).toFixed(2);
    unit = 'B';
  }
  else if (num > 1000000) {
    formattedValue = (num / 1000000).toFixed(1);
    unit = 'M';
  }
  else if (num > 1000) {
    formattedValue = (num / 1000).toFixed(1);
    unit = 'K';
  }
  // Numeri piccoli
  else if (num < 1 && num > 0) {
    formattedValue = num.toFixed(3);
  }
  // Numeri normali
  else {
    formattedValue = num.toFixed(2);
  }
  
  // Restituisci con o senza unità
  return includeUnit && unit ? `${formattedValue} ${unit}` : formattedValue;
};

/**
 * Ottiene una descrizione user-friendly dell'unità di misura
 * @param {string} units - L'unità dall'API FRED
 * @returns {string} Descrizione chiara dell'unità
 */
export const getUnitDescription = (units) => {
  if (!units) return '';
  
  const unitsLower = units.toLowerCase();
  
  if (unitsLower.includes('percent')) return 'Percentuale';
  if (unitsLower.includes('index')) return 'Indice';
  if (unitsLower.includes('billions of dollars')) return 'Miliardi di $';
  if (unitsLower.includes('millions of dollars')) return 'Milioni di $';
  if (unitsLower.includes('thousands of dollars')) return 'Migliaia di $';
  if (unitsLower.includes('billions of persons')) return 'Miliardi di persone';
  if (unitsLower.includes('millions of persons')) return 'Milioni di persone';
  if (unitsLower.includes('thousands of persons')) return 'Migliaia di persone';
  if (unitsLower.includes('dollar')) return 'Dollari';
  if (unitsLower.includes('number')) return 'Numero';
  
  // Ritorna l'unità originale se non riconosciuta
  return units;
};

// Funzione per scaricare CSV di un indicatore
export const downloadIndicatorCSV = (indicator, categoryName) => {
  if (!indicator.observations || indicator.observations.length === 0) {
    alert('Nessun dato disponibile per questo indicatore');
    return;
  }

  // Header CSV
  const headers = ['Data', 'Valore', 'Indicatore', 'Nome', 'Categoria'];
  
  // Dati CSV
  const csvData = indicator.observations.map(obs => [
    obs.date,
    obs.value === '.' ? 'N/A' : obs.value,
    indicator.id,
    `"${indicator.name}"`, // Escape per nomi con virgole
    categoryName
  ]);
  
  // Combina header e dati
  const csvContent = [headers, ...csvData]
    .map(row => row.join(','))
    .join('\n');
  
  // Crea e scarica il file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${indicator.id}_${indicator.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Funzione per misurare dimensioni reali del testo
export const measureText = (text, fontSize = 12) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px monospace`;
  const width = context.measureText(text).width;
  return { width, height: fontSize * 1.2 };
};
