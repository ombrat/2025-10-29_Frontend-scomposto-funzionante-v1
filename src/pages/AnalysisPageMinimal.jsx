import React from 'react';

/**
 * 🚨 ULTRA MINIMAL ANALYSIS PAGE
 * Zero dependencies, zero imports complessi, zero chiamate API
 */
export default function AnalysisPageMinimal() {
  
  // Dati statici hardcoded per test
  // 🏛️ Eventi Macro Economici Realistici
  const mockEvents = [
    {
      title: "FOMC Rate Decision",
      description: "Federal Reserve mantiene Fed Funds Rate al 5.25%, segnala possibile pausa nei rialzi",
      date: "2025-11-01",
      impact: "high",
      category: "Monetary Policy"
    },
    {
      title: "Nonfarm Payrolls Report", 
      description: "Occupazione cresce di 150K unità, tasso disoccupazione scende al 3.8%",
      date: "2025-10-30",
      impact: "high",
      category: "Labor Market"
    },
    {
      title: "GDP Preliminary Estimate",
      description: "PIL USA cresce del 2.1% trimestrale, sopra le aspettative del 1.8%",
      date: "2025-10-28",
      impact: "medium", 
      category: "Economic Growth"
    },
    {
      title: "Core CPI Inflation",
      description: "Inflazione core rallenta al 3.2% annuo, verso target Fed del 2%",
      date: "2025-10-25",
      impact: "medium",
      category: "Inflation"
    },
    {
      title: "Consumer Sentiment Index",
      description: "Fiducia consumatori sale a 68.2, primo rialzo dopo 3 mesi di calo",
      date: "2025-10-23",
      impact: "medium",
      category: "Consumer Sentiment"
    },
    {
      title: "Manufacturing PMI",
      description: "PMI manifatturiero scende a 49.8, sotto soglia espansione di 50",
      date: "2025-10-20",
      impact: "medium",
      category: "Manufacturing"
    }
  ];

  // 🏛️ Solo Indicatori Macro Economici Reali
  const mockIndicators = [
    { name: "Unemployment Rate", value: "3.8%", change: -0.2, unit: "percent", category: "Labor" },
    { name: "Consumer Sentiment", value: "68.2", change: 2.1, unit: "index", category: "Sentiment" },
    { name: "GDP Growth (QoQ)", value: "2.1%", change: 0.3, unit: "percent", category: "Growth" },
    { name: "Core Inflation (CPI)", value: "3.2%", change: -0.1, unit: "percent", category: "Inflation" },
    { name: "Fed Funds Rate", value: "5.25%", change: 0.0, unit: "percent", category: "Monetary" },
    { name: "Manufacturing PMI", value: "49.8", change: -1.2, unit: "index", category: "Production" },
    { name: "Consumer Confidence", value: "102.6", change: 3.4, unit: "index", category: "Sentiment" },
    { name: "Housing Starts", value: "1.35M", change: -2.8, unit: "million units", category: "Housing" },
    { name: "Trade Balance", value: "-$68.9B", change: 4.2, unit: "billion USD", category: "Trade" }
  ];

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      color: '#fff',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* Header Fisso */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#4a9eff',
          marginBottom: '10px'
        }}>
          📊 Analisi Macro Economica
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>
          🏛️ Indicatori Macro Economici Essenziali • {mockIndicators.length} Metriche • 6 Eventi
        </p>
      </div>

      {/* Eventi Row 1 */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '1.8rem', 
          marginBottom: '20px',
          borderBottom: '2px solid #333',
          paddingBottom: '10px',
          color: '#fff'
        }}>
          📈 Eventi Macro Recenti
        </h2>
        
        <div style={{ display: 'grid', gap: '15px' }}>
          {mockEvents.map((event, index) => (
            <div key={index} style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              padding: '20px',
              borderLeft: `4px solid ${event.impact === 'high' ? '#ff6b6b' : '#ffa726'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#fff' }}>
                  {event.title}
                </h3>
                <span style={{ 
                  backgroundColor: event.impact === 'high' ? '#ff6b6b' : '#ffa726',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {event.impact.toUpperCase()}
                </span>
              </div>
              <p style={{ color: '#ccc', margin: '10px 0', lineHeight: '1.5' }}>
                {event.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#888' }}>
                <span>📅 {event.date}</span>
                <span>🏷️ {event.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicatori Row 2 */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '1.8rem', 
          marginBottom: '20px',
          borderBottom: '2px solid #333',
          paddingBottom: '10px',
          color: '#fff'
        }}>
          📊 Indicatori Principali
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {mockIndicators.map((indicator, index) => {
            const categoryColors = {
              'Labor': '#4caf50',
              'Sentiment': '#2196f3', 
              'Growth': '#ff9800',
              'Inflation': '#f44336',
              'Monetary': '#9c27b0',
              'Production': '#607d8b',
              'Housing': '#795548',
              'Trade': '#009688'
            };
            
            return (
              <div key={index} style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #333',
                borderTop: `4px solid ${categoryColors[indicator.category] || '#666'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#fff' }}>
                    {indicator.name}
                  </h3>
                  <span style={{ 
                    backgroundColor: categoryColors[indicator.category] || '#666',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    {indicator.category}
                  </span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px', textAlign: 'center' }}>
                  {indicator.value}
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  color: indicator.change >= 0 ? '#4caf50' : '#ff6b6b',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  {indicator.change >= 0 ? '↗' : '↘'} {Math.abs(indicator.change)}%
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', marginTop: '5px' }}>
                  {indicator.unit}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Footer */}
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        marginTop: '40px'
      }}>
        <p style={{ color: '#4caf50', fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          ✅ Layout Stabile Garantito
        </p>
        <p style={{ color: '#888', margin: 0 }}>
          🏛️ <strong>Macro Economics Focus</strong>: Unemployment • GDP • Inflation • Consumer Sentiment • Fed Policy
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem', margin: '10px 0 0 0' }}>
          Test Date: {new Date().toLocaleString()} • Status: STABLE
        </p>
      </div>

    </div>
  );
}