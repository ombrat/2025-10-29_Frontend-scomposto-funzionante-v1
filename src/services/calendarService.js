/**
 * Calendar Service
 * Gestisce le chiamate API per il calendario economico FRED
 */

import { API_CONFIG } from '../config/apiConfig';

/**
 * Recupera gli eventi del calendario economico in un intervallo di date
 * @param {string} startDate - Data di inizio (formato YYYY-MM-DD)
 * @param {string} endDate - Data di fine (formato YYYY-MM-DD)
 * @returns {Promise<{events: Array, error: string|null, cached: boolean}>}
 */
export async function getCalendarEvents(startDate = null, endDate = null) {
  try {
    // Costruisci l'URL con parametri opzionali
    let url = `${API_CONFIG.BACKEND_BASE_URL}/api/fred/calendar`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      events: data.events || [],
      cached: data.cached || false,
      startDate: data.start_date,
      endDate: data.end_date,
      error: null,
    };
  } catch (error) {
    console.error('Errore nel recupero del calendario economico:', error);
    return {
      events: [],
      cached: false,
      startDate: null,
      endDate: null,
      error: error.message,
    };
  }
}

/**
 * Formatta la data per visualizzazione
 * @param {string} dateString - Data in formato YYYY-MM-DD
 * @returns {string} Data formattata
 */
export function formatCalendarDate(dateString) {
  try {
    const date = new Date(dateString);
    
    // Verifica che Intl sia disponibile
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return new Intl.DateTimeFormat('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    
    // Fallback se Intl non è disponibile
    const days = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
    const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
    
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName} ${day} ${month} ${year}`;
  } catch (error) {
    console.error('Errore nella formattazione della data:', error);
    return dateString; // Restituisci la stringa originale in caso di errore
  }
}

/**
 * Raggruppa gli eventi per data
 * @param {Array} events - Array di eventi
 * @returns {Object} Oggetto con date come chiavi e array di eventi come valori
 */
export function groupEventsByDate(events) {
  return events.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {});
}

/**
 * Ordina gli eventi per data e orario
 * @param {Array} events - Array di eventi
 * @returns {Array} Eventi ordinati
 */
export function sortEventsByDateTime(events) {
  return [...events].sort((a, b) => {
    // Prima ordina per data
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    
    // Poi ordina per orario
    return a.time.localeCompare(b.time);
  });
}

/**
 * Filtra gli eventi per importanza
 * @param {Array} events - Array di eventi
 * @param {Array<string>} importanceLevels - Array di livelli di importanza da includere
 * @returns {Array} Eventi filtrati
 */
export function filterEventsByImportance(events, importanceLevels) {
  if (!importanceLevels || importanceLevels.length === 0) {
    return events;
  }
  return events.filter(event => importanceLevels.includes(event.importance));
}
