import React, { useState, useEffect } from 'react';
import newsService from '../services/newsService.js';
import Spinner from '../components/ui/Spinner.jsx';

/**
 * Pagina dedicata alle news finanziarie
 */
export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Carica le news all'avvio del componente
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const articles = await newsService.getNews(forceRefresh);
      setNewsArticles(articles);
      setLastUpdated(new Date());
      console.log(`✅ Caricate ${articles.length} news`);
    } catch (err) {
      console.error('Errore caricamento news:', err);
      setError('Errore nel caricamento delle news. Riprova più tardi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadNews(true);
  };

  const categories = [
    { id: 'all', label: 'Tutte le News', icon: '📰', count: newsArticles.length },
    { id: 'stocks', label: 'Azioni', icon: '📊', count: newsArticles.filter(a => a.category === 'stocks').length },
    { id: 'monetary-policy', label: 'Politica Monetaria', icon: '🏦', count: newsArticles.filter(a => a.category === 'monetary-policy').length },
    { id: 'currencies', label: 'Valute', icon: '💱', count: newsArticles.filter(a => a.category === 'currencies').length },
    { id: 'crypto', label: 'Crypto', icon: '₿', count: newsArticles.filter(a => a.category === 'crypto').length },
    { id: 'commodities', label: 'Commodities', icon: '🏅', count: newsArticles.filter(a => a.category === 'commodities').length },
    { id: 'sustainability', label: 'Sostenibilità', icon: '🌱', count: newsArticles.filter(a => a.category === 'sustainability').length },
    { id: 'analysis', label: 'Analisi', icon: '📈', count: newsArticles.filter(a => a.category === 'analysis').length },
    { id: 'ipos', label: 'IPO', icon: '🎯', count: newsArticles.filter(a => a.category === 'ipos').length }
  ];

  // Statistiche per categoria
  const getCategoryStats = () => {
    const stats = categories.reduce((acc, cat) => {
      if (cat.id !== 'all') {
        acc[cat.id] = cat.count;
      }
      return acc;
    }, {});
    return stats;
  };

  const filteredArticles = selectedCategory === 'all' 
    ? newsArticles 
    : newsArticles.filter(article => article.category === selectedCategory);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';
    if (diffDays <= 7) return `${diffDays} giorni fa`;
    return date.toLocaleDateString('it-IT');
  };

  const handleArticleClick = (article) => {
    // Simula l'apertura dell'articolo in una nuova finestra
    if (article.link && article.link !== '#') {
      window.open(article.link, '_blank', 'noopener,noreferrer');
    } else {
      // Per demo, mostra un alert con il titolo dell'articolo
      alert(`Articolo demo: "${article.title}"\n\nQuesto è un contenuto di esempio per la demo del sito. In una implementazione reale, qui si aprirebbe l'articolo completo.`);
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      {/* Header della pagina */}
      <div style={{
        textAlign: 'center',
        marginBottom: '50px'
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
          📰 News Finanziarie
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#999',
          lineHeight: 1.6,
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          I migliori articoli finanziari della settimana. Rimani aggiornato su mercati, 
          economia e opportunità di investimento.
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            padding: '10px 20px',
            background: 'rgba(102, 187, 106, 0.1)',
            borderRadius: '20px',
            fontSize: '14px',
            color: '#66bb6a'
          }}>
            📅 Aggiornate {lastUpdated ? 'il ' + lastUpdated.toLocaleDateString('it-IT') + ' alle ' + lastUpdated.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 'automaticamente'}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '8px 16px',
              background: refreshing ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(45deg, #1e88e5, #66bb6a)',
              border: 'none',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '14px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              opacity: refreshing ? 0.7 : 1
            }}
          >
            <span style={{
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              display: 'inline-block'
            }}>
              🔄
            </span>
            {refreshing ? 'Aggiornando...' : 'Aggiorna News'}
          </button>

          {/* Debug Info - rimuovi in produzione */}
          <button
            onClick={() => {
              const cacheInfo = newsService.getCacheInfo();
              alert(`Cache Info:\n${JSON.stringify(cacheInfo, null, 2)}`);
            }}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '15px',
              color: '#999',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🔍 Cache Info
          </button>
        </div>

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>

      {/* Filtri per categoria */}
      <div style={{
        marginBottom: '40px',
        overflowX: 'auto',
        paddingBottom: '10px'
      }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          minWidth: 'max-content'
        }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                background: selectedCategory === category.id 
                  ? 'linear-gradient(45deg, #1e88e5, #66bb6a)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedCategory === category.id 
                  ? 'none'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '25px',
                padding: '12px 20px',
                color: selectedCategory === category.id ? '#fff' : '#ccc',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.color = '#ccc';
                }
              }}
            >
              <span>{category.icon}</span>
              {category.label}
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <Spinner />
          <div style={{ color: '#999', fontSize: '16px' }}>
            Caricamento delle ultime news finanziarie...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'rgba(239, 83, 80, 0.1)',
          border: '1px solid rgba(239, 83, 80, 0.2)',
          borderRadius: '12px',
          marginBottom: '40px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
          <h3 style={{ color: '#ef5350', margin: '0 0 10px 0' }}>Errore Caricamento News</h3>
          <p style={{ color: '#999', margin: '0 0 20px 0' }}>{error}</p>
          <button
            onClick={() => loadNews()}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(45deg, #ef5350, #ff7043)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Riprova
          </button>
        </div>
      )}

      {/* Grid degli articoli */}
      {!loading && !error && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '25px',
          marginBottom: '50px'
        }}>
        {filteredArticles.map((article) => (
          <article
            key={article.id}
            onClick={() => handleArticleClick(article)}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '25px',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Header dell'articolo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '15px'
            }}>
              <div style={{
                fontSize: '32px'
              }}>
                {article.image}
              </div>
              <div style={{
                textAlign: 'right',
                fontSize: '12px',
                color: '#999'
              }}>
                <div>{formatDate(article.date)}</div>
                <div>{article.readTime}</div>
              </div>
            </div>

            {/* Titolo */}
            <h3 style={{
              fontSize: '18px',
              margin: '0 0 12px 0',
              color: '#fff',
              fontWeight: '600',
              lineHeight: 1.3
            }}>
              {article.title}
            </h3>

            {/* Summary */}
            <p style={{
              color: '#ccc',
              fontSize: '14px',
              lineHeight: 1.5,
              margin: '0 0 15px 0'
            }}>
              {article.summary}
            </p>

            {/* Tags */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '15px'
            }}>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(102, 187, 106, 0.1)',
                    color: '#66bb6a',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: '1px solid rgba(102, 187, 106, 0.2)'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer con fonte */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#999',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '15px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                📡 {article.source}
              </div>
              <div style={{
                color: '#1e88e5',
                fontSize: '12px'
              }}>
                Leggi articolo →
              </div>
            </div>
          </article>
        ))}
        </div>
      )}

      {/* Info sulla fonte dei dati */}
      {!loading && !error && (
        <div style={{
          background: 'rgba(30, 136, 229, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>📡</span>
            <h4 style={{ color: '#1e88e5', margin: 0, fontSize: '16px' }}>
              News Automatiche da Alpha Vantage
            </h4>
          </div>
          <p style={{
            color: '#999',
            fontSize: '14px',
            margin: 0,
            lineHeight: 1.4
          }}>
            Le news vengono aggiornate automaticamente ogni 24 ore da fonti finanziarie autoritative. 
            Cache locale per performance ottimali.
          </p>
        </div>
      )}

      {/* Statistiche categorie */}
      {!loading && !error && newsArticles.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <h4 style={{
            fontSize: '16px',
            margin: '0 0 15px 0',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Distribuzione per Categoria
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {categories.slice(1).map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 12px',
                  background: selectedCategory === cat.id 
                    ? 'rgba(102, 187, 106, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  border: selectedCategory === cat.id 
                    ? '1px solid #66bb6a' 
                    : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{
                  fontSize: '20px',
                  marginBottom: '4px'
                }}>
                  {cat.icon}
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: selectedCategory === cat.id ? '#66bb6a' : '#fff',
                  marginBottom: '2px'
                }}>
                  {cat.count}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#999'
                }}>
                  {cat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sezione trending topics */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '40px'
      }}>
        <h3 style={{
          fontSize: '20px',
          margin: '0 0 20px 0',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🔥 Trending Topics
          <span style={{
            fontSize: '12px',
            color: '#999',
            fontWeight: 'normal'
          }}>
            (clicca per filtrare)
          </span>
        </h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {[
            { tag: 'Fed Rate Decision', count: 145, category: 'monetary-policy' },
            { tag: 'AI Revolution', count: 132, category: 'stocks' },
            { tag: 'Bitcoin $45K', count: 98, category: 'crypto' },
            { tag: 'Gold Record High', count: 87, category: 'commodities' },
            { tag: 'Green Energy Boom', count: 76, category: 'sustainability' },
            { tag: 'EUR/USD Rally', count: 65, category: 'currencies' },
            { tag: 'Tesla Production', count: 54, category: 'stocks' },
            { tag: 'SpaceX IPO', count: 48, category: 'ipos' },
            { tag: 'Nvidia Earnings', count: 43, category: 'stocks' },
            { tag: 'Carbon Credits', count: 38, category: 'sustainability' },
            { tag: 'OPEC+ Cuts', count: 32, category: 'commodities' },
            { tag: 'China CBDC', count: 28, category: 'currencies' },
            { tag: 'Ethereum Staking', count: 25, category: 'crypto' },
            { tag: 'Wall Street 2026', count: 22, category: 'analysis' },
            { tag: 'Emerging Markets', count: 18, category: 'analysis' }
          ].map((trend) => (
            <div
              key={trend.tag}
              onClick={() => setSelectedCategory(trend.category)}
              style={{
                background: selectedCategory === trend.category 
                  ? 'linear-gradient(45deg, #1e88e5, #66bb6a)' 
                  : 'linear-gradient(45deg, rgba(30, 136, 229, 0.1), rgba(102, 187, 106, 0.1))',
                border: selectedCategory === trend.category 
                  ? '1px solid #66bb6a' 
                  : '1px solid rgba(102, 187, 106, 0.2)',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '13px',
                color: selectedCategory === trend.category ? '#fff' : '#66bb6a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== trend.category) {
                  e.target.style.background = 'linear-gradient(45deg, rgba(30, 136, 229, 0.2), rgba(102, 187, 106, 0.2))';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== trend.category) {
                  e.target.style.background = 'linear-gradient(45deg, rgba(30, 136, 229, 0.1), rgba(102, 187, 106, 0.1))';
                }
              }}
            >
              #{trend.tag}
              <span style={{
                background: 'rgba(102, 187, 106, 0.2)',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '11px'
              }}>
                {trend.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter signup */}
      <div style={{
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1) 0%, rgba(102, 187, 106, 0.1) 100%)',
        borderRadius: '12px',
        padding: '40px'
      }}>
        <h3 style={{
          fontSize: '24px',
          margin: '0 0 15px 0',
          color: '#fff'
        }}>
          📬 Rimani sempre aggiornato
        </h3>
        <p style={{
          fontSize: '16px',
          color: '#999',
          margin: '0 0 25px 0',
          lineHeight: 1.6
        }}>
          Non perdere le notizie più importanti del mondo finanziario
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <input
            type="email"
            placeholder="La tua email..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '14px'
            }}
          />
          <button style={{
            padding: '12px 20px',
            background: 'linear-gradient(45deg, #1e88e5, #66bb6a)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            Iscriviti
          </button>
        </div>
      </div>
    </div>
  );
}