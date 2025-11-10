import { useState, useEffect, useMemo } from 'react';
import {
  getCalendarEvents,
  formatCalendarDate as formatDate,
  groupEventsByDate,
  sortEventsByDateTime,
  filterEventsByImportance,
} from '../services/calendarService';
import './CalendarPage.css';

/**
 * Pagina Calendario Economico
 * Mostra tutti gli eventi economici FRED con data, orario, importanza, valori actual/previous
 */
export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: getTodayDate(),
    end: getNextWeekDate(),
  });
  const [selectedImportance, setSelectedImportance] = useState(['high', 'medium', 'low']);
  const [groupByDate, setGroupByDate] = useState(true);

  // Carica eventi all'avvio e quando cambiano i filtri di data
  useEffect(() => {
    loadCalendarEvents();
  }, [dateRange]);

  // Funzione per caricare gli eventi
  const loadCalendarEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📅 Caricamento calendario con date:', dateRange);
      const result = await getCalendarEvents(dateRange.start, dateRange.end);
      console.log('📅 Risposta dal backend:', result);

      if (result.error) {
        setError(result.error);
      } else {
        console.log('📅 Eventi ricevuti:', result.events?.length || 0);
        setEvents(result.events || []);
        setCached(result.cached);
      }
    } catch (err) {
      console.error('❌ Errore nel caricamento calendario:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ordina eventi per data e orario
  const sortedEvents = useMemo(() => {
    return sortEventsByDateTime(events);
  }, [events]);

  // Filtra eventi per importanza
  const filteredEvents = useMemo(() => {
    const filtered = filterEventsByImportance(sortedEvents, selectedImportance);
    console.log('🔍 Filtraggio:', {
      totalEvents: events.length,
      sortedEvents: sortedEvents.length,
      filteredEvents: filtered.length,
      selectedImportance,
    });
    return filtered;
  }, [sortedEvents, selectedImportance, events.length]);

  function handleImportanceToggle(level) {
    setSelectedImportance(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  }

  function handleDateRangeChange(field, value) {
    setDateRange(prev => ({ ...prev, [field]: value }));
  }

  function resetToToday() {
    setDateRange({
      start: getTodayDate(),
      end: getNextWeekDate(),
    });
  }

  // Raggruppa eventi per data se richiesto
  const displayEvents = groupByDate ? groupEventsByDate(filteredEvents) : { all: filteredEvents };

  return (
    <div className="calendar-page">
      <header className="calendar-header">
        <h1>📅 Calendario Economico FRED</h1>
        <p>Eventi economici pubblicati dalla Federal Reserve Economic Data</p>
      </header>

      {/* Filtri e controlli */}
      <div className="calendar-controls">
        <div className="date-range-selector">
          <label>
            Da:
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </label>
          <label>
            A:
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </label>
          <button onClick={resetToToday} className="btn-reset">
            Oggi
          </button>
        </div>

        <div className="importance-filters">
          <span>Importanza:</span>
          <label className="importance-checkbox">
            <input
              type="checkbox"
              checked={selectedImportance.includes('high')}
              onChange={() => handleImportanceToggle('high')}
            />
            <span className="importance-badge high">Alta</span>
          </label>
          <label className="importance-checkbox">
            <input
              type="checkbox"
              checked={selectedImportance.includes('medium')}
              onChange={() => handleImportanceToggle('medium')}
            />
            <span className="importance-badge medium">Media</span>
          </label>
          <label className="importance-checkbox">
            <input
              type="checkbox"
              checked={selectedImportance.includes('low')}
              onChange={() => handleImportanceToggle('low')}
            />
            <span className="importance-badge low">Bassa</span>
          </label>
        </div>

        <div className="view-toggle">
          <label>
            <input
              type="checkbox"
              checked={groupByDate}
              onChange={(e) => setGroupByDate(e.target.checked)}
            />
            Raggruppa per data
          </label>
        </div>
      </div>

      {/* Stato di caricamento ed errori */}
      {loading && (
        <div className="calendar-loading">
          <div className="spinner"></div>
          <p>Caricamento eventi economici...</p>
        </div>
      )}

      {error && (
        <div className="calendar-error">
          <p>❌ Errore: {error}</p>
          <button onClick={loadCalendarEvents}>Riprova</button>
        </div>
      )}

      {/* Lista eventi */}
      {!loading && !error && (
        <div className="calendar-content">
          {filteredEvents.length === 0 ? (
            <div className="calendar-empty">
              <p>Nessun evento trovato per i filtri selezionati.</p>
            </div>
          ) : (
            <div className="calendar-events">
              {groupByDate ? (
                // Vista raggruppata per data
                Object.entries(displayEvents)
                  .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                  .map(([date, dateEvents]) => (
                    <div key={date} className="date-group">
                      <h2 className="date-header">{formatDate(date)}</h2>
                      <div className="events-list">
                        {dateEvents.map((event, idx) => (
                          <EventCard key={`${event.series_id}-${idx}`} event={event} />
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                // Vista lista singola
                <div className="events-list">
                  {filteredEvents.map((event, idx) => (
                    <EventCard
                      key={`${event.series_id}-${idx}`}
                      event={event}
                      showDate={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistiche */}
          {filteredEvents.length > 0 && (
            <div className="calendar-stats">
              <p>
                Visualizzati {filteredEvents.length} eventi su {events.length} totali
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Card singolo evento economico
 */
function EventCard({ event, showDate = false }) {
  const importanceClass = `importance-${event.importance}`;
  
  // Calcola la variazione tra actual e previous
  const change = event.actual && event.previous
    ? ((parseFloat(event.actual) - parseFloat(event.previous)) / parseFloat(event.previous) * 100).toFixed(2)
    : null;

  return (
    <div className={`event-card ${importanceClass}`}>
      <div className="event-header">
        <div className="event-time">
          {showDate && <span className="event-date">{formatDate(event.date)}</span>}
          <span className="event-time-value">🕐 {event.time}</span>
        </div>
        <span className={`importance-badge ${event.importance}`}>
          {event.importance === 'high' && '🔴'}
          {event.importance === 'medium' && '🟡'}
          {event.importance === 'low' && '🟢'}
          {' '}
          {event.importance === 'high' ? 'Alta' : event.importance === 'medium' ? 'Media' : 'Bassa'}
        </span>
      </div>

      <div className="event-title">
        <h3>{event.release_name}</h3>
        <span className="event-country">{event.country}</span>
      </div>

      <div className="event-details">
        <div className="event-series-info">
          <span className="series-id">ID: {event.series_id}</span>
          <span className="series-frequency">Freq: {event.frequency}</span>
        </div>
      </div>

      <div className="event-values">
        <div className="value-item">
          <span className="value-label">Effettivo:</span>
          <span className="value-number actual">
            {event.actual ? formatValue(event.actual, event.unit) : 'N/D'}
          </span>
        </div>
        <div className="value-item">
          <span className="value-label">Precedente:</span>
          <span className="value-number previous">
            {event.previous ? formatValue(event.previous, event.unit) : 'N/D'}
          </span>
        </div>
        <div className="value-item">
          <span className="value-label">Previsione:</span>
          <span className="value-number forecast">
            {event.forecast ? formatValue(event.forecast, event.unit) : 'N/D'}
          </span>
        </div>
        {change !== null && (
          <div className="value-item change">
            <span className="value-label">Variazione:</span>
            <span className={`value-number ${parseFloat(change) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(change) >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>

      {event.unit && (
        <div className="event-unit">
          <small>Unità: {event.unit}</small>
        </div>
      )}
    </div>
  );
}

/**
 * Formatta un valore numerico con l'unità appropriata
 */
function formatValue(value, unit) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;

  // Formatta in base all'unità
  if (unit?.includes('%')) {
    return numValue.toFixed(2);
  } else if (unit?.includes('$')) {
    return numValue.toLocaleString('en-US', { maximumFractionDigits: 2 });
  } else if (unit?.includes('Mil.') || unit?.includes('Bil.')) {
    return numValue.toLocaleString('en-US', { maximumFractionDigits: 0 });
  } else {
    return numValue.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}

/**
 * Ottiene la data di oggi in formato YYYY-MM-DD
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Ottiene la data di una settimana nel futuro in formato YYYY-MM-DD
 */
function getNextWeekDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}
