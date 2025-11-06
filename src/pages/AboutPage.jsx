import React from 'react';

/**
 * Pagina About - informazioni sul progetto
 */
export default function AboutPage() {
  const features = [
    {
      icon: '🚀',
      title: 'Open Source',
      description: 'Codice completamente aperto e modificabile'
    },
    {
      icon: '⚡',
      title: 'Prestazioni Elevate',
      description: 'Interfaccia reattiva con React e Vite'
    },
    {
      icon: '📊',
      title: 'Analisi Avanzate',
      description: 'Monte Carlo, frontiera efficiente, drawdown'
    },
    {
      icon: '🛡️',
      title: 'Privacy First',
      description: 'Tutti i dati rimangono nel tuo browser'
    },
    {
      icon: '🎨',
      title: 'UI Moderna',
      description: 'Interfaccia dark mode ottimizzata'
    },
    {
      icon: '📱',
      title: 'Responsive',
      description: 'Funziona su desktop, tablet e mobile'
    }
  ];

  const techStack = [
    { name: 'React', version: '18.x', description: 'Library UI principale' },
    { name: 'Vite', version: '5.x', description: 'Build tool e dev server' },
    { name: 'D3.js', version: '7.x', description: 'Visualizzazioni dati' },
    { name: 'JavaScript', version: 'ES2022', description: 'Linguaggio principale' },
    { name: 'CSS3', version: '-', description: 'Styling e animazioni' },
    { name: 'Alpha Vantage API', version: 'v1', description: 'Dati finanziari' }
  ];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      {/* Header della pagina */}
      <div style={{
        textAlign: 'center',
        marginBottom: '60px'
      }}>
        <h1 style={{
          fontSize: '36px',
          margin: '0 0 15px 0',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px'
        }}>
          ℹ️ About PortfolioLab
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#999',
          margin: 0,
          lineHeight: 1.6,
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          Un simulatore di backtest finanziario avanzato, costruito con tecnologie moderne 
          per offrire analisi quantitative professionali accessibili a tutti.
        </p>
      </div>

      {/* Missione */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1) 0%, rgba(102, 187, 106, 0.1) 100%)',
        borderRadius: '12px',
        padding: '40px',
        marginBottom: '50px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '28px',
          margin: '0 0 20px 0',
          color: '#fff'
        }}>
          🎯 La Nostra Missione
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#ccc',
          lineHeight: 1.8,
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          Democratizzare l'accesso agli strumenti di analisi finanziaria quantitativa. 
          Crediamo che ogni investitore dovrebbe avere accesso a strumenti di backtesting professionali, 
          simulazioni Monte Carlo e analisi di portafoglio senza dover pagare costosi software proprietari.
        </p>
      </div>

      {/* Features Grid */}
      <div style={{
        marginBottom: '50px'
      }}>
        <h3 style={{
          fontSize: '24px',
          margin: '0 0 40px 0',
          color: '#fff',
          textAlign: 'center'
        }}>
          🌟 Caratteristiche Principali
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px'
        }}>
          {features.map((feature) => (
            <div
              key={feature.title}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '25px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: '32px',
                marginBottom: '15px'
              }}>
                {feature.icon}
              </div>
              <h4 style={{
                fontSize: '18px',
                margin: '0 0 12px 0',
                color: '#66bb6a',
                fontWeight: '600'
              }}>
                {feature.title}
              </h4>
              <p style={{
                fontSize: '15px',
                color: '#999',
                margin: 0,
                lineHeight: 1.5
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        padding: '40px',
        marginBottom: '50px'
      }}>
        <h3 style={{
          fontSize: '24px',
          margin: '0 0 30px 0',
          color: '#fff',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          ⚙️ Stack Tecnologico
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {techStack.map((tech) => (
            <div
              key={tech.name}
              style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}
            >
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#66bb6a'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '16px',
                    color: '#fff',
                    fontWeight: '600'
                  }}>
                    {tech.name}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#1e88e5',
                    background: 'rgba(30, 136, 229, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {tech.version}
                  </span>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#999'
                }}>
                  {tech.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team/Crediti */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        padding: '40px',
        marginBottom: '50px'
      }}>
        <h3 style={{
          fontSize: '24px',
          margin: '0 0 30px 0',
          color: '#fff',
          textAlign: 'center'
        }}>
          👥 Sviluppo e Crediti
        </h3>
        
        <div style={{
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e88e5, #66bb6a)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 20px auto'
          }}>
            🤖
          </div>
          
          <h4 style={{
            fontSize: '20px',
            margin: '0 0 10px 0',
            color: '#fff',
            fontWeight: '600'
          }}>
            Sviluppato con GitHub Copilot
          </h4>
          
          <p style={{
            fontSize: '16px',
            color: '#999',
            lineHeight: 1.6,
            marginBottom: '25px'
          }}>
            Questo progetto è stato sviluppato utilizzando GitHub Copilot per accelerare 
            lo sviluppo e implementare best practices moderne. Un esempio di come l'AI 
            può supportare la creazione di software finanziario avanzato.
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(102, 187, 106, 0.1)',
              borderRadius: '20px',
              fontSize: '14px',
              color: '#66bb6a',
              border: '1px solid rgba(102, 187, 106, 0.2)'
            }}>
              ⭐ Open Source
            </div>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(30, 136, 229, 0.1)',
              borderRadius: '20px',
              fontSize: '14px',
              color: '#1e88e5',
              border: '1px solid rgba(30, 136, 229, 0.2)'
            }}>
              🚀 MIT License
            </div>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(255, 112, 67, 0.1)',
              borderRadius: '20px',
              fontSize: '14px',
              color: '#ff7043',
              border: '1px solid rgba(255, 112, 67, 0.2)'
            }}>
              🔄 In Sviluppo
            </div>
          </div>
        </div>
      </div>

      {/* Versione e Changelog */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        padding: '30px',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '20px',
          margin: '0 0 20px 0',
          color: '#fff'
        }}>
          📋 Informazioni Versione
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#66bb6a',
              marginBottom: '5px'
            }}>
              v8.0
            </div>
            <div style={{
              fontSize: '14px',
              color: '#999'
            }}>
              Versione Corrente
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1e88e5',
              marginBottom: '5px'
            }}>
              2024
            </div>
            <div style={{
              fontSize: '14px',
              color: '#999'
            }}>
              Anno di Sviluppo
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ff7043',
              marginBottom: '5px'
            }}>
              React 18
            </div>
            <div style={{
              fontSize: '14px',
              color: '#999'
            }}>
              Framework UI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}