import React, { useState, useMemo, useEffect } from 'react';
import AssetRow from '../../components/forms/AssetRow';
import TickerSearch from '../../components/forms/TickerSearch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { postBacktest } from '../../api/api';
import '../../styles/components.css';

/**
 * BacktestForm - layout aggiornato per riprodurre impaginazione legacy (come da screenshot)
 */
export default function BacktestForm({ onResult, onFormChange }) {
  const [assets, setAssets] = useState([
    { ticker: 'SPY', name: 'S&P 500 ETF', weight: 0.7, entry_fee_percent: 0, annual_fee_percent: 0 },
    { ticker: 'BND', name: 'Total Bond Market', weight: 0.3, entry_fee_percent: 0, annual_fee_percent: 0 }
  ]);
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [annualContribution, setAnnualContribution] = useState(1200);
  const [frequency, setFrequency] = useState('Mensile');
  const [startDate, setStartDate] = useState('2015-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Notifica AppMain dei parametri del form per la simulazione
  useEffect(() => {
    if (onFormChange) {
      const formParams = {
        assets,
        initial_investment: initialInvestment,
        annual_contribution: annualContribution,
        contribution_frequency: frequency === 'Mensile' ? 'monthly' : frequency === 'Trimestrale' ? 'quarterly' : 'none',
        start_date: startDate,
        end_date: endDate
      };
      onFormChange(formParams);
    }
  }, [assets, initialInvestment, annualContribution, frequency, startDate, endDate, onFormChange]);

  function handleAddTicker(ticker, name) {
    if (assets.some(a => a.ticker === ticker)) return;
    setAssets(prev => [...prev, { 
      ticker, 
      name, 
      weight: 0, 
      entry_fee_percent: 0, 
      annual_fee_percent: 0 
    }]);
  }

  function updateAsset(i, field, v) {
    setAssets(prev => {
      const copy = [...prev];
      if (field === 'weight') {
        const parsed = parseFloat(String(v).replace(',', '.'));
        copy[i][field] = isNaN(parsed) ? 0 : (parsed > 1 ? parsed / 100 : parsed);
      } else {
        copy[i][field] = Number(String(v).replace(',', '.')) || 0;
      }
      return copy;
    });
  }

  function removeAsset(i) {
    setAssets(prev => prev.filter((_, idx) => idx !== i));
  }



  function normalizeWeights() {
    const total = assets.reduce((s, a) => s + (Number(a.weight) || 0), 0);
    if (total <= 0) return;
    const normalized = assets.map(a => ({ ...a, weight: Number(((a.weight / total) || 0).toFixed(6)) }));
    setAssets(normalized);
  }

  async function handleRunBacktest(e) {
    e && e.preventDefault && e.preventDefault();
    setError(null);

    // basic validation: total weights ~ 1
    const total = assets.reduce((s, a) => s + (Number(a.weight) || 0), 0);
    if (assets.length > 0 && (total < 0.995 || total > 1.005)) {
      setError('La somma dei pesi deve essere circa 100% prima di eseguire il backtest.');
      return;
    }

    // date validation
    if (new Date(startDate) > new Date(endDate)) {
      setError('La data di inizio deve essere precedente o uguale alla data di fine.');
      return;
    }

    // Map Italian frequency to English backend format
    const frequencyMap = {
      'Mensile': 'monthly',
      'Annuale': 'yearly',
      'Mensile (x12)': 'monthly'
    };

    // Calculate weighted average fees using only individual asset fees
    const weightedFeeTotals = assets.reduce((acc, a) => {
      const weight = Number(a.weight) || 0;
      acc.entry += (Number(a.entry_fee_percent) || 0) * weight;
      acc.annual += (Number(a.annual_fee_percent) || 0) * weight;
      return acc;
    }, { entry: 0, annual: 0 });

    const payload = {
      assets: assets.map(a => ({ 
        ticker: a.ticker, 
        weight: a.weight, 
        entry_fee_percent: Number(a.entry_fee_percent) || 0, 
        annual_fee_percent: Number(a.annual_fee_percent) || 0 
      })),
      initial_investment: Number(initialInvestment),
      annual_contribution: Number(annualContribution),
      contribution_frequency: frequencyMap[frequency] || 'monthly',
      start_date: startDate,
      end_date: endDate,
      // Use only weighted fees from individual assets
      entry_fee_percent: weightedFeeTotals.entry,
      annual_fee_percent: weightedFeeTotals.annual
    };

    // Verifica commissioni nel payload
    console.log('💳 Commissioni inviate:', {
      assets: payload.assets.map(a => ({
        ticker: a.ticker,
        entry_fee: a.entry_fee_percent,
        annual_fee: a.annual_fee_percent
      }))
    });

    // diagnostic: save last request to window for debugging
    try { window.__lastBacktestRequest = payload; } catch (e) {}

    setLoading(true);
    try {
      const result = await postBacktest(payload);
      try { window.__lastApiResponse = result; } catch (e) {}
      if (onResult) onResult(result);
    } catch (err) {
      const msg = err?.message || (err?.response?.data?.error) || 'Errore nella chiamata backtest';
      setError(msg);
      console.error('backtest error', err);
    } finally {
      setLoading(false);
    }
  }

  // percentuale allocata per barra di stato
  const totalPercent = useMemo(() => Math.round(assets.reduce((s, a) => s + (Number(a.weight) || 0), 0) * 100), [assets]);
  const weightBarClass = (totalPercent < 99 || totalPercent > 101) ? 'weight-bar weight-bar-warning' : 'weight-bar';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      padding: '0',
      animation: 'fadeIn 0.6s ease-out',
      position: 'relative'
    }}>
      {loading && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '28px',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 12px 40px rgba(99, 102, 241, 0.5), 0 4px 16px rgba(139, 92, 246, 0.3)',
          animation: 'bounceIn 0.6s ease-out',
          zIndex: 1000,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            width: '14px', 
            height: '14px', 
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #ffffff 0%, #e0e7ff 100%)',
            animation: 'spin 2s linear infinite',
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
          }} />
          Elaborando Backtest
        </div>
      )}
      
      <div style={{
        textAlign: 'center',
        marginBottom: '8px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 50%, transparent 100%)',
          zIndex: 0
        }} />
        <h2 style={{ 
          color: '#f8fafc', 
          margin: 0,
          fontSize: '28px',
          fontWeight: '800',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          position: 'relative',
          zIndex: 1,
          padding: '0 24px',
          backgroundColor: '#0a0a0a'
        }}>
          Configurazione Backtest
        </h2>
        <div style={{
          fontSize: '14px',
          color: '#64748b',
          fontWeight: '500',
          marginTop: '6px',
          letterSpacing: '0.05em'
        }}>
          Imposta i parametri per l'analisi del portafoglio
        </div>
      </div>

      {/* Parametri Finanziari */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)',
        borderRadius: '20px',
        padding: '28px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'slideInUp 0.6s ease-out'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 32px 80px rgba(0, 0, 0, 0.3), 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.04) 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)';
      }}>
        {/* Badge decorativo */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '20px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.4)',
          boxShadow: '0 0 12px rgba(255, 255, 255, 0.3)'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <h3 style={{
            color: '#f8fafc',
            fontSize: '16px',
            fontWeight: '700',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            Parametri Investimento
          </h3>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
            marginLeft: '12px'
          }} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ 
              color: '#64748b', 
              fontSize: '11px', 
              fontWeight: '600',
              display: 'block', 
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Investimento Iniziale
            </label>
            <div style={{ position: 'relative' }}>
              <Input 
                type="number" 
                value={initialInvestment} 
                onChange={(e) => setInitialInvestment(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  paddingRight: '50px',
                  color: '#f8fafc',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(0, 0, 0, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                }}
              />
              <span style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                EUR
              </span>
            </div>
          </div>
          
          <div>
            <label style={{ 
              color: '#64748b', 
              fontSize: '11px', 
              fontWeight: '600',
              display: 'block', 
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Contributo Annuo
            </label>
            <div style={{ position: 'relative' }}>
              <Input 
                type="number" 
                value={annualContribution} 
                onChange={(e) => setAnnualContribution(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  paddingRight: '80px',
                  color: '#f8fafc',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(0, 0, 0, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                }}
              />
              <span style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: '700',
                textShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
              }}>
                EUR/anno
              </span>
            </div>
          </div>
          
          <div>
            <label style={{ 
              color: '#64748b', 
              fontSize: '11px', 
              fontWeight: '600',
              display: 'block', 
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Frequenza Contributi
            </label>
            <select 
              value={frequency} 
              onChange={(e) => setFrequency(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                borderRadius: '12px', 
                background: 'rgba(0, 0, 0, 0.3)', 
                color: '#f8fafc', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(0, 0, 0, 0.4)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'rgba(0, 0, 0, 0.3)';
              }}
            >
              <option>Mensile</option>
              <option>Annuale</option>
              <option>Mensile (x12)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Periodo Temporale */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)',
        borderRadius: '20px',
        padding: '28px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'slideInUp 0.8s ease-out'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 32px 80px rgba(0, 0, 0, 0.3), 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.04) 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)';
      }}>
        {/* Badge decorativo */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '20px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.4)',
          boxShadow: '0 0 12px rgba(255, 255, 255, 0.3)'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <h3 style={{
            color: '#f8fafc',
            fontSize: '16px',
            fontWeight: '700',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            Periodo di Analisi
          </h3>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
            marginLeft: '12px'
          }} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ 
              color: '#64748b', 
              fontSize: '11px', 
              fontWeight: '600',
              display: 'block', 
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Data Inizio
            </label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#f8fafc',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(0, 0, 0, 0.4)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'rgba(0, 0, 0, 0.3)';
              }}
            />
          </div>
          <div>
            <label style={{ 
              color: '#64748b', 
              fontSize: '11px', 
              fontWeight: '600',
              display: 'block', 
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Data Fine
            </label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#f8fafc',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(0, 0, 0, 0.4)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'rgba(0, 0, 0, 0.3)';
              }}
            />
          </div>
        </div>
      </div>

      {/* Selezione Assets e Pesi */}
      <div style={{ 
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)',
        borderRadius: '20px',
        padding: '28px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'slideInUp 1s ease-out'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 32px 80px rgba(0, 0, 0, 0.3), 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.04) 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)';
      }}>
        {/* Badge decorativo */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '20px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.6) 100%)',
          boxShadow: '0 0 16px rgba(255, 255, 255, 0.3)'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <h3 style={{
            color: '#f8fafc',
            fontSize: '16px',
            fontWeight: '700',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            Composizione Portafoglio
          </h3>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
            marginLeft: '12px'
          }} />
        </div>

        {/* Controls + Weight bar */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto 280px', 
          gap: '16px', 
          alignItems: 'center', 
          marginBottom: '16px',
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <TickerSearch 
              onSelect={handleAddTicker} 
              placeholder="Aggiungi asset..."
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px'
              }}
            />
          </div>
          
          <Button 
            onClick={normalizeWeights} 
            variant="secondary" 
            disabled={loading}
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              color: '#6366f1',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            Normalizza
          </Button>
          
          <div style={{ width: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ 
                flex: 1, 
                height: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${Math.min(100, Math.max(0, totalPercent))}%`, 
                  height: '100%',
                  background: totalPercent >= 99 && totalPercent <= 101 
                    ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '3px',
                  transition: 'all 0.3s ease'
                }} />
              </div>
              <div style={{
                minWidth: '48px',
                textAlign: 'center',
                color: totalPercent >= 99 && totalPercent <= 101 ? '#22c55e' : '#f59e0b',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                {totalPercent}%
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
              Allocazione totale (target: 100%)
            </div>
          </div>
        </div>

        {/* Tabella Assets - Design moderno */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.02)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '80px 1fr 100px 90px 90px 60px',
              gap: '12px',
              alignItems: 'center',
              color: '#64748b',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Ticker</div>
              <div>Nome Asset</div>
              <div>Peso %</div>
              <div>Entry %</div>
              <div>Annual %</div>
              <div></div>
            </div>
          </div>
          
          <div>
            {assets.map((a, i) => (
              <div 
                key={`${a.ticker}-${i}`} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '80px 1fr 100px 90px 90px 60px',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom: i < assets.length - 1 ? '1px solid rgba(255, 255, 255, 0.02)' : 'none',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.02)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <div style={{ 
                  fontWeight: '700', 
                  color: '#f8fafc',
                  fontSize: '13px'
                }}>
                  {a.ticker}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#94a3b8',
                  fontWeight: '500'
                }}>
                  {a.name}
                </div>
                <Input 
                  type="number" 
                  value={(Number(a.weight) * 100).toFixed(2)} 
                  onChange={(e) => updateAsset(i, 'weight', e.target.value)}
                  style={{ 
                    padding: '6px 8px', 
                    fontSize: '12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: '#f8fafc'
                  }}
                />
                <Input 
                  type="number" 
                  step="0.01" 
                  value={a.entry_fee_percent} 
                  onChange={(e) => updateAsset(i, 'entry_fee_percent', e.target.value)}
                  style={{ 
                    padding: '6px 8px', 
                    fontSize: '12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: '#f8fafc'
                  }}
                />
                <Input 
                  type="number" 
                  step="0.01" 
                  value={a.annual_fee_percent} 
                  onChange={(e) => updateAsset(i, 'annual_fee_percent', e.target.value)}
                  style={{ 
                    padding: '6px 8px', 
                    fontSize: '12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: '#f8fafc'
                  }}
                />
                <button
                  onClick={() => removeAsset(i)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ 
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

      {/* Hero Action Button */}
      <div style={{ 
        marginTop: '40px',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Decorative background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          borderRadius: '20px',
          filter: 'blur(20px)'
        }} />
        
        <Button 
          onClick={handleRunBacktest} 
          variant="primary" 
          disabled={loading}
          style={{
            position: 'relative',
            background: loading 
              ? 'rgba(71, 85, 105, 0.5)' 
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.25) 80%, rgba(255, 255, 255, 0.3) 100%)',
            color: '#ffffff',
            padding: '16px 40px',
            fontSize: '15px',
            fontWeight: '800',
            border: loading ? '1px solid rgba(71, 85, 105, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '280px',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: loading 
              ? '0 8px 20px rgba(0, 0, 0, 0.2)' 
              : '0 16px 40px rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            transform: loading ? 'scale(0.98)' : 'scale(1)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'scale(1.05) translateY(-2px)';
              e.target.style.boxShadow = '0 24px 60px rgba(255, 255, 255, 0.3), 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.35) 80%, rgba(255, 255, 255, 0.4) 100%)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 16px 40px rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.25) 80%, rgba(255, 255, 255, 0.3) 100%)';
            }
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Elaborando
            </>
          ) : (
            <>
              Esegui Backtest
            </>
          )}
        </Button>
      </div>
    </div>
  );
}