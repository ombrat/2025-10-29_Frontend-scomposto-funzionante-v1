import React from 'react';

const getImportanceColor = (importance) => {
  const colors = { high: '#ef5350', medium: '#ffa726', low: '#66bb6a' };
  return colors[importance] || colors.low;
};

const getCountryFlag = (country) => {
  const flags = { USA: '🇺🇸', EUR: '🇪🇺', UK: '🇬🇧', JP: '🇯🇵', CHN: '🇨🇳', GER: '🇩🇪' };
  return flags[country] || '🌍';
};

function parseHour(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  return Math.max(0, Math.min(23, hh));
}

export default function DayTimeline({ date, events = [] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const eventsByHour = events.reduce((acc, ev) => {
    const h = parseHour(ev.time);
    if (h == null) {
      (acc.allDay = acc.allDay || []).push(ev);
    } else {
      acc[h] = acc[h] || [];
      acc[h].push(ev);
    }
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
      <div style={{ width: 120, color: '#999', fontSize: 13 }}>
        <div style={{ marginBottom: 8, color: '#4fc3f7', fontWeight: 600 }}>Orari</div>
        {hours.map(h => (
          <div key={h} style={{ padding: '6px 0' }}>{String(h).padStart(2, '0')}:00</div>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        {/* All day events */}
        {(eventsByHour.allDay || []).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#66bb6a', fontWeight: 700, marginBottom: 8 }}>Tutta la giornata</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {eventsByHour.allDay.map((ev, idx) => (
                <div key={`allday-${idx}`} style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, minWidth: 220 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{getCountryFlag(ev.country)} {ev.country || ''}</div>
                  </div>
                  <div style={{ marginTop: 6, color: '#ccc', fontSize: 13 }}>{ev.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hour grid */}
        <div style={{ display: 'grid', gridTemplateRows: `repeat(24, 44px)`, gap: 6 }}>
          {hours.map(h => (
            <div key={`row-${h}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 12 }} />
              <div style={{ flex: 1, minHeight: 44 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(eventsByHour[h] || []).length === 0 ? (
                    <div style={{ color: '#444', fontSize: 13 }}>—</div>
                  ) : (
                    (eventsByHour[h] || []).map((ev, i) => (
                      <div key={`${h}-${i}`} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 8, minWidth: 220 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{ev.title}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>{getCountryFlag(ev.country)} {ev.country || ''}</div>
                        </div>
                        <div style={{ marginTop: 6, color: '#ccc', fontSize: 13 }}>{ev.time || '—'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
