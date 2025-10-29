import React, { useState, useEffect, useRef } from 'react';
import { searchTickers } from '../../api/api';
import Spinner from '../ui/Spinner';

/**
 * TickerSearch component:
 *  - onSelect(ticker, name)
 */
export default function TickerSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null);
  const [focused, setFocused] = useState(-1);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]); setLoading(false);
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const result = await searchTickers(query, controller.signal);
        setSuggestions(Array.isArray(result) ? result : []);
      } catch (e) {
        if (e?.name === 'CanceledError' || e?.message?.toLowerCase?.().includes('aborted')) {
          // ignore
        } else {
          console.error(e);
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      try { controller.abort(); } catch (e) {}
    };
  }, [query]);

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(i => Math.min(suggestions.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') {
      if (focused >= 0 && focused < suggestions.length) {
        const it = suggestions[focused];
        onSelect(it.ticker, it.name);
        setQuery(''); setSuggestions([]); setFocused(-1);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]); setFocused(-1);
    }
  };

  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Cerca Ticker (es. SPY, BND)"
        style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#1f1f1f', border: '1px solid #333', color: '#fff' }}
      />
      {loading && <div style={{ position: 'absolute', right: 10, top: 10 }}><Spinner size={14} /></div>}
      {suggestions.length > 0 && (
        <ul style={{ position: 'absolute', left: 0, right: 0, top: '44px', zIndex: 60, background: '#1b1b1b', maxHeight: 260, overflowY: 'auto', listStyle: 'none', padding: 8, margin: 0, border: '1px solid #2a2a2a', borderRadius: 8 }}>
          {suggestions.map((it, idx) => (
            <li key={`${it.ticker}-${it.isin ?? idx}`} style={{ padding: 8, cursor: 'pointer', background: focused === idx ? '#2d2d2d' : 'transparent' }} onMouseEnter={() => setFocused(idx)} onMouseLeave={() => setFocused(-1)} onClick={() => { onSelect(it.ticker, it.name); setQuery(''); setSuggestions([]); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div><strong style={{ color: '#fff' }}>{it.ticker}</strong> <span style={{ color: '#ccc' }}> - {it.name}</span></div>
                {it.isin && <div style={{ color: '#aaa', fontSize: 12 }}>ISIN: {it.isin}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}