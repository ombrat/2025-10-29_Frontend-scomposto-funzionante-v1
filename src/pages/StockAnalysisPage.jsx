import React, { useState, useCallback, useEffect } from 'react';
import yahooFinanceService from '../services/yahooFinanceService';
import Spinner from '../components/ui/Spinner';

/**
 * 🏦 Stock Analysis Page
 * Pagina per cercare e analizzare azioni tramite Yahoo Finance API
 */
export default function StockAnalysisPage() {
  // Stati search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Stati ticker selezionato
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [tickerData, setTickerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stati navigazione tabs
  const [activeMainTab, setActiveMainTab] = useState('report'); // report, statistiche, stime
  const [activeReportTab, setActiveReportTab] = useState('income'); // income, balance, cashflow

  /**
   * 🔍 Gestione ricerca ticker
   */
  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const results = await yahooFinanceService.searchTicker(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Errore ricerca:', err);
      setError('Errore durante la ricerca. Riprova.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  /**
   * Debounce della ricerca
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  /**
   * 📊 Carica dati ticker selezionato
   */
  const loadTickerData = async (ticker) => {
    setLoading(true);
    setError(null);
    setSelectedTicker(ticker);
    setSearchResults([]); // Chiudi i risultati di ricerca
    setSearchQuery(ticker.ticker);

    try {
      const info = await yahooFinanceService.getTickerInfo(ticker.ticker);
      const metrics = yahooFinanceService.extractKeyMetrics(info);
      const organizedMetrics = yahooFinanceService.organizeMetricsByCategory(metrics);
      
      setTickerData({
        raw: info,
        metrics: metrics,
        organized: organizedMetrics
      });
      
      console.log('✅ Dati ticker caricati:', metrics);
    } catch (err) {
      console.error('Errore caricamento ticker:', err);
      setError(`Impossibile caricare i dati per ${ticker.ticker}. ${err.message}`);
      setTickerData(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🗑️ Reset ricerca
   */
  const handleReset = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedTicker(null);
    setTickerData(null);
    setError(null);
  };

  return (
    <div style={{
      padding: '40px',
      background: '#0a0a0a',
      minHeight: 'calc(100vh - 160px)',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          margin: '0 0 20px 0',
          background: 'linear-gradient(45deg, #1e88e5, #66bb6a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🏦 Analisi Azioni
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#999',
          margin: 0
        }}>
          Cerca e analizza qualsiasi azione tramite ISIN, Ticker o Nome
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 40px',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Cerca per ISIN, Ticker o Nome (es: AAPL, Apple, US0378331005)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                fontSize: '16px',
                background: '#1a1a1a',
                border: '2px solid #333',
                borderRadius: '12px',
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e88e5'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
            
            {searching && (
              <div style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #333',
                  borderTop: '2px solid #1e88e5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            )}
          </div>

          {(selectedTicker || searchQuery) && (
            <button
              onClick={handleReset}
              style={{
                padding: '15px 30px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#444'}
              onMouseLeave={(e) => e.target.style.background = '#333'}
            >
              🗑️ Reset
            </button>
          )}
        </div>

        {/* Risultati Ricerca */}
        {searchResults.length > 0 && !selectedTicker && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '10px',
            background: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => loadTickerData(result)}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #333' : 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#252525'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <div style={{
                  fontWeight: '600',
                  color: '#1e88e5',
                  marginBottom: '5px'
                }}>
                  {result.ticker}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#999'
                }}>
                  {result.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 40px',
          padding: '20px',
          background: 'rgba(239, 83, 80, 0.1)',
          border: '1px solid rgba(239, 83, 80, 0.3)',
          borderRadius: '12px',
          color: '#ef5350'
        }}>
          <strong>❌ Errore:</strong> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px'
        }}>
          <Spinner />
          <p style={{
            marginTop: '20px',
            fontSize: '18px',
            color: '#999'
          }}>
            Caricamento dati per {selectedTicker?.ticker}...
          </p>
        </div>
      )}

      {/* Dati Ticker */}
      {!loading && tickerData && (
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          {/* Header Ticker Compatto */}
          <div style={{
            background: '#0a0a0a',
            borderRadius: '12px',
            padding: '25px 30px',
            marginBottom: '30px',
            border: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div>
                <h2 style={{
                  fontSize: '28px',
                  margin: '0 0 5px 0',
                  color: '#fff'
                }}>
                  {tickerData.metrics.symbol}
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#999',
                  margin: 0
                }}>
                  {tickerData.metrics.longName}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#66bb6a',
                marginBottom: '5px'
              }}>
                {yahooFinanceService.formatValue(tickerData.metrics.currentPrice, 'currency')}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {tickerData.metrics.sector} · {tickerData.metrics.country}
              </div>
            </div>
          </div>

          {/* Tab Navigation Principale */}
          <div style={{
            background: '#0a0a0a',
            borderRadius: '12px 12px 0 0',
            border: '1px solid #333',
            borderBottom: 'none',
            padding: '0',
            display: 'flex',
            gap: '0'
          }}>
            {[
              { id: 'report', label: '📊 REPORT' },
              { id: 'statistiche', label: '📈 STATISTICHE' },
              { id: 'stime', label: '🎯 STIME' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '20px',
                  background: activeMainTab === tab.id ? '#1e88e5' : 'transparent',
                  color: activeMainTab === tab.id ? '#fff' : '#999',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  borderRadius: activeMainTab === tab.id ? '12px 12px 0 0' : '0'
                }}
                onMouseEnter={(e) => {
                  if (activeMainTab !== tab.id) {
                    e.target.style.background = '#1a1a1a';
                    e.target.style.color = '#ccc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeMainTab !== tab.id) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#999';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub-Tab Navigation per REPORT */}
          {activeMainTab === 'report' && (
            <div style={{
              background: '#1a1a1a',
              padding: '15px 30px',
              borderLeft: '1px solid #333',
              borderRight: '1px solid #333',
              display: 'flex',
              gap: '20px'
            }}>
              {[
                { id: 'income', label: 'Conto Economico' },
                { id: 'balance', label: 'Bilancio' },
                { id: 'cashflow', label: 'Free Cash Flow' }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveReportTab(subTab.id)}
                  style={{
                    padding: '10px 20px',
                    background: activeReportTab === subTab.id ? '#66bb6a' : '#0a0a0a',
                    color: activeReportTab === subTab.id ? '#000' : '#ccc',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeReportTab !== subTab.id) {
                      e.target.style.background = '#252525';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeReportTab !== subTab.id) {
                      e.target.style.background = '#0a0a0a';
                    }
                  }}
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          )}

          {/* Contenuto Tabs */}
          <div style={{
            background: '#0a0a0a',
            borderRadius: activeMainTab === 'report' ? '0 0 12px 12px' : '0 0 12px 12px',
            border: '1px solid #333',
            borderTop: activeMainTab === 'report' ? 'none' : '1px solid #333',
            padding: '30px',
            minHeight: '500px'
          }}>
            {/* TAB REPORT */}
            {activeMainTab === 'report' && (
              <div>
                <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                  {activeReportTab === 'income' && '📊 Conto Economico (TTM - Trailing Twelve Months)'}
                  {activeReportTab === 'balance' && '💼 Stato Patrimoniale / Bilancio'}
                  {activeReportTab === 'cashflow' && '💰 Rendiconto Finanziario / Cash Flow'}
                </h3>
                
                {/* CONTO ECONOMICO - COMPLETO */}
                {activeReportTab === 'income' && (
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                      <thead>
                        <tr style={{ background: '#1a1a1a', borderBottom: '2px solid #333' }}>
                          <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontWeight: '600' }}>Metrica</th>
                          <th style={{ padding: '15px', textAlign: 'right', color: '#999', fontWeight: '600' }}>Valore (TTM)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* REVENUE */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#1e88e5', fontWeight: '700', fontSize: '14px' }}>
                            📊 RICAVI
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Revenue Totale</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalRevenue, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Operating Revenue</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.operatingRevenue, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Revenue per Share</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.revenuePerShare, 'currency')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Revenue Growth (YoY)</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: tickerData.metrics.revenueGrowth > 0 ? '#66bb6a' : '#ef5350', fontWeight: '700', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.revenueGrowth, 'percent')}
                          </td>
                        </tr>

                        {/* PROFITTI */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#66bb6a', fontWeight: '700', fontSize: '14px' }}>
                            💰 PROFITTI
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Gross Profit</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.grossProfits, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Gross Margin</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.grossMargins, 'percent')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>EBITDA</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.ebitda, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>EBITDA Margin</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.ebitdaMargins, 'percent')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Operating Income</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.operatingIncome, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Operating Margin</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.operatingMargins, 'percent')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Profit Margin</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.profitMargins, 'percent')}
                          </td>
                        </tr>

                        {/* NET INCOME */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#ffa726', fontWeight: '700', fontSize: '14px' }}>
                            📈 UTILE NETTO
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Net Income</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.netIncome, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Net Income to Common</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.netIncomeToCommon, 'large_number')}
                          </td>
                        </tr>

                        {/* EPS */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#9c27b0', fontWeight: '700', fontSize: '14px' }}>
                            📊 EPS (Earnings Per Share)
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>EPS (Trailing)</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.trailingEps, 'currency')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>EPS (Forward)</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.forwardEps, 'currency')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>EPS Current Year</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.epsCurrentYear, 'currency')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Earnings Growth (YoY)</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: tickerData.metrics.earningsGrowth > 0 ? '#66bb6a' : '#ef5350', fontWeight: '700', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.earningsGrowth, 'percent')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Earnings Growth (Quarterly)</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: tickerData.metrics.earningsQuarterlyGrowth > 0 ? '#66bb6a' : '#ef5350', fontWeight: '700', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.earningsQuarterlyGrowth, 'percent')}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '8px', color: '#999', fontSize: '13px' }}>
                      ℹ️ <strong>Nota:</strong> Dati TTM (Trailing Twelve Months). Per storico trimestrale/annuale completo, richiede endpoint backend aggiuntivi.
                    </div>
                  </div>
                )}

                {/* BILANCIO / STATO PATRIMONIALE - COMPLETO */}
                {activeReportTab === 'balance' && (
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                      <thead>
                        <tr style={{ background: '#1a1a1a', borderBottom: '2px solid #333' }}>
                          <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontWeight: '600' }}>Metrica</th>
                          <th style={{ padding: '15px', textAlign: 'right', color: '#999', fontWeight: '600' }}>Valore</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* ASSETS */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#1e88e5', fontWeight: '700', fontSize: '14px' }}>
                            💎 ATTIVITÀ (ASSETS)
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Total Assets</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalAssets, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '40px' }}>→ Current Assets</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalCurrentAssets, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '50px' }}>Cash & Cash Equivalents</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.cashAndCashEquivalents, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '50px' }}>Total Cash</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalCash, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '50px' }}>Cash per Share</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalCashPerShare, 'currency')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '40px' }}>→ Non-Current Assets</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalNonCurrentAssets, 'large_number')}
                          </td>
                        </tr>

                        {/* LIABILITIES */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#ef5350', fontWeight: '700', fontSize: '14px' }}>
                            ⚠️ PASSIVITÀ (LIABILITIES)
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Total Liabilities</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalLiabilities, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '40px' }}>→ Current Liabilities</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalCurrentLiabilities, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '40px' }}>→ Non-Current Liabilities</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalNonCurrentLiabilitiesNetMinorityInterest, 'large_number')}
                          </td>
                        </tr>

                        {/* DEBT */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#ff9800', fontWeight: '700', fontSize: '14px' }}>
                            💳 DEBITO (DEBT)
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Total Debt</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalDebt, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '40px' }}>→ Short Term Debt</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.shortTermDebt, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '40px' }}>→ Long Term Debt</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.longTermDebt, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Net Debt</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.netDebt, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Debt to Equity Ratio</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.debtToEquity, 'ratio')}
                          </td>
                        </tr>

                        {/* EQUITY */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#66bb6a', fontWeight: '700', fontSize: '14px' }}>
                            🏛️ PATRIMONIO NETTO (EQUITY)
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Stockholders' Equity</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.stockholdersEquity, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Total Equity Gross</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.totalEquityGross, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Tangible Book Value</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.tangibleBookValue, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Net Tangible Assets</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.netTangibleAssets, 'large_number')}
                          </td>
                        </tr>

                        {/* WORKING CAPITAL */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#9c27b0', fontWeight: '700', fontSize: '14px' }}>
                            ⚙️ CAPITALE CIRCOLANTE
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Working Capital</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.workingCapital, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Invested Capital</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.investedCapital, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Current Ratio</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.currentRatio, 'ratio')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Quick Ratio</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.quickRatio, 'ratio')}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '8px', color: '#999', fontSize: '13px' }}>
                      ℹ️ <strong>Nota:</strong> Dati più recenti disponibili. Per storico trimestrale/annuale completo, richiede endpoint backend aggiuntivi.
                    </div>
                  </div>
                )}

                {/* CASH FLOW - COMPLETO */}
                {activeReportTab === 'cashflow' && (
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                      <thead>
                        <tr style={{ background: '#1a1a1a', borderBottom: '2px solid #333' }}>
                          <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontWeight: '600' }}>Metrica</th>
                          <th style={{ padding: '15px', textAlign: 'right', color: '#999', fontWeight: '600' }}>Valore (TTM)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* OPERATING CASH FLOW */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#1e88e5', fontWeight: '700', fontSize: '14px' }}>
                            💰 FLUSSO DI CASSA OPERATIVO
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Operating Cash Flow</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.operatingCashflow, 'large_number')}
                          </td>
                        </tr>

                        {/* FREE CASH FLOW */}
                        <tr style={{ background: '#1a1a1a' }}>
                          <td colSpan={2} style={{ padding: '12px 15px', color: '#66bb6a', fontWeight: '700', fontSize: '14px' }}>
                            🚀 FREE CASH FLOW
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Free Cash Flow</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.freeCashflow, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Levered Free Cash Flow</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.leveredFreeCashFlow, 'large_number')}
                          </td>
                        </tr>

                        {/* CAPEX (calcolato) */}
                        {tickerData.metrics.operatingCashflow && tickerData.metrics.freeCashflow && (
                          <>
                            <tr style={{ background: '#1a1a1a' }}>
                              <td colSpan={2} style={{ padding: '12px 15px', color: '#ffa726', fontWeight: '700', fontSize: '14px' }}>
                                🏗️ INVESTIMENTI (CAPEX)
                              </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #333' }}>
                              <td style={{ padding: '12px 15px', color: '#ccc', paddingLeft: '30px' }}>Capital Expenditures (stimato)</td>
                              <td style={{ padding: '12px 15px', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                                {yahooFinanceService.formatValue(
                                  tickerData.metrics.operatingCashflow - tickerData.metrics.freeCashflow,
                                  'large_number'
                                )}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>

                    <div style={{ padding: '15px', background: '#1a1a1a', borderRadius: '8px', color: '#999', fontSize: '13px' }}>
                      ℹ️ <strong>Nota:</strong> Dati TTM (Trailing Twelve Months). Capital Expenditures calcolato come differenza tra Operating e Free Cash Flow.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB STATISTICHE */}
            {activeMainTab === 'statistiche' && (
              <div>
                <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                  📈 Metriche di Valutazione e Marginalità
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
                  {/* Colonna 1: Valutazione */}
                  <div>
                    <h4 style={{ color: '#1e88e5', fontSize: '16px', marginBottom: '15px' }}>Valutazione</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Market Cap</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.marketCap, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Enterprise Value</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.enterpriseValue, 'large_number')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>P/E Ratio (Trailing)</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.trailingPE, 'ratio')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>P/E Ratio (Forward)</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.forwardPE, 'ratio')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>PEG Ratio</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.pegRatio, 'ratio')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Price to Book</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.priceToBook, 'ratio')}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Price to Sales</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.priceToSales, 'ratio')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Colonna 2: Marginalità e Rendimenti */}
                  <div>
                    <h4 style={{ color: '#66bb6a', fontSize: '16px', marginBottom: '15px' }}>Marginalità e Rendimenti</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Profit Margin</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.profitMargins, 'percent')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Operating Margin</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.operatingMargins, 'percent')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>ROA (Return on Assets)</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.returnOnAssets, 'percent')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>ROE (Return on Equity)</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.returnOnEquity, 'percent')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Dividend Yield</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.dividendYield, 'percent')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Dividend Rate</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.dividendRate, 'currency')}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Debt to Equity</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.debtToEquity, 'ratio')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Crescita */}
                <div style={{ marginTop: '30px' }}>
                  <h4 style={{ color: '#ffa726', fontSize: '16px', marginBottom: '15px' }}>Crescita</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px 0', color: '#ccc' }}>Revenue Growth</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                          {yahooFinanceService.formatValue(tickerData.metrics.revenueGrowth, 'percent')}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 0', color: '#ccc' }}>Earnings Growth (Quarterly)</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                          {yahooFinanceService.formatValue(tickerData.metrics.earningsQuarterlyGrowth, 'percent')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB STIME */}
            {activeMainTab === 'stime' && (
              <div>
                <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                  🎯 Stime e Previsioni Analisti
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
                  {/* Colonna 1: Target Price */}
                  <div>
                    <h4 style={{ color: '#1e88e5', fontSize: '16px', marginBottom: '15px' }}>Target Price</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Target Medio</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#66bb6a', fontWeight: '700', fontFamily: 'monospace', fontSize: '18px' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.targetMeanPrice, 'currency')}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Target Alto</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.targetHighPrice, 'currency')}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Target Basso</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.targetLowPrice, 'currency')}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Upside/Downside Potenziale */}
                    {tickerData.metrics.targetMeanPrice && tickerData.metrics.currentPrice && (
                      <div style={{ marginTop: '20px', padding: '15px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                        <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>Potenziale Upside/Downside</div>
                        <div style={{ 
                          fontSize: '24px', 
                          fontWeight: 'bold',
                          color: ((tickerData.metrics.targetMeanPrice - tickerData.metrics.currentPrice) / tickerData.metrics.currentPrice) > 0 ? '#66bb6a' : '#ef5350'
                        }}>
                          {(((tickerData.metrics.targetMeanPrice - tickerData.metrics.currentPrice) / tickerData.metrics.currentPrice) * 100).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Colonna 2: Raccomandazioni Analisti */}
                  <div>
                    <h4 style={{ color: '#66bb6a', fontSize: '16px', marginBottom: '15px' }}>Raccomandazioni</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Raccomandazione</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '700', fontSize: '16px', textTransform: 'uppercase' }}>
                            {tickerData.metrics.recommendationKey || 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px 0', color: '#ccc' }}>Numero Analisti</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                            {yahooFinanceService.formatValue(tickerData.metrics.numberOfAnalystOpinions, 'number')}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Beta (Rischio) */}
                    <div style={{ marginTop: '30px' }}>
                      <h4 style={{ color: '#ffa726', fontSize: '16px', marginBottom: '15px' }}>Rischio di Mercato</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '12px 0', color: '#ccc' }}>Beta</td>
                            <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                              {yahooFinanceService.formatValue(tickerData.metrics.beta, 'ratio')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: '10px', padding: '10px', background: '#1a1a1a', borderRadius: '6px', fontSize: '13px', color: '#999' }}>
                        {tickerData.metrics.beta !== null && tickerData.metrics.beta !== undefined ? (
                          tickerData.metrics.beta > 1 
                            ? '⚠️ Più volatile del mercato' 
                            : tickerData.metrics.beta < 1 
                              ? '✅ Meno volatile del mercato'
                              : '➡️ Allineato al mercato'
                        ) : 'Beta non disponibile'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prezzi 52 Settimane */}
                <div style={{ marginTop: '30px' }}>
                  <h4 style={{ color: '#9c27b0', fontSize: '16px', marginBottom: '15px' }}>Range 52 Settimane</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px 0', color: '#ccc' }}>52-Week High</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                          {yahooFinanceService.formatValue(tickerData.metrics.fiftyTwoWeekHigh, 'currency')}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 0', color: '#ccc' }}>52-Week Low</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                          {yahooFinanceService.formatValue(tickerData.metrics.fiftyTwoWeekLow, 'currency')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placeholder iniziale */}
      {!loading && !tickerData && !error && searchResults.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#666'
        }}>
          <div style={{
            fontSize: '72px',
            marginBottom: '20px'
          }}>
            🔍
          </div>
          <p style={{
            fontSize: '20px',
            marginBottom: '10px'
          }}>
            Inizia la ricerca
          </p>
          <p style={{
            fontSize: '16px',
            color: '#555'
          }}>
            Inserisci un ISIN, Ticker o Nome per cercare un'azione
          </p>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
