import { API_CONFIG } from '../config/apiConfig.js';

/**
 * Servizio per gestire le news finanziarie da Alpha Vantage
 */
class NewsService {
  constructor() {
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.apiKey = API_CONFIG.ALPHA_VANTAGE_KEY;
    this.cacheKey = 'portfoliolab_news_cache';
    this.cacheDuration = API_CONFIG.CACHE_DURATION; // 24 ore
  }

  /**
   * Categorizza un articolo basandosi sul titolo e contenuto
   */
  categorizeArticle(title, summary) {
    const text = `${title} ${summary}`.toLowerCase();
    
    // Parole chiave per categorizzazione
    if (text.match(/fed|federal reserve|interest rate|monetary policy|central bank/i)) {
      return 'monetary-policy';
    }
    if (text.match(/nvidia|tesla|apple|microsoft|stock|earnings|ipo/i)) {
      return 'stocks';
    }
    if (text.match(/bitcoin|crypto|ethereum|blockchain|digital currency/i)) {
      return 'crypto';
    }
    if (text.match(/euro|dollar|currency|forex|exchange rate/i)) {
      return 'currencies';
    }
    if (text.match(/gold|oil|commodity|silver|copper/i)) {
      return 'commodities';
    }
    if (text.match(/green|renewable|solar|sustainable|climate/i)) {
      return 'sustainability';
    }
    if (text.match(/analysis|outlook|forecast|prediction|market/i)) {
      return 'analysis';
    }
    if (text.match(/ipo|initial public offering|listing|debut/i)) {
      return 'ipos';
    }
    
    // Default fallback
    return 'analysis';
  }

  /**
   * Genera emoji basato sulla categoria
   */
  getCategoryEmoji(category) {
    const emojiMap = {
      'monetary-policy': '📈',
      'stocks': '🚀',
      'crypto': '₿',
      'currencies': '💱',
      'commodities': '🏅',
      'sustainability': '🌱',
      'analysis': '📊',
      'ipos': '🎯'
    };
    return emojiMap[category] || '📰';
  }

  /**
   * Calcola il tempo di lettura stimato
   */
  calculateReadTime(text) {
    const wordsPerMinute = 200;
    const wordCount = text.split(' ').length;
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return `${minutes} min`;
  }

  /**
   * Estrae tags dal titolo e summary
   */
  extractTags(title, summary) {
    const text = `${title} ${summary}`;
    const tags = [];
    
    // Lista di possibili tag finanziari
    const tagPatterns = [
      { pattern: /fed|federal reserve/i, tag: 'Fed' },
      { pattern: /nvidia/i, tag: 'Nvidia' },
      { pattern: /tesla/i, tag: 'Tesla' },
      { pattern: /bitcoin/i, tag: 'Bitcoin' },
      { pattern: /ethereum/i, tag: 'Ethereum' },
      { pattern: /ai|artificial intelligence/i, tag: 'AI' },
      { pattern: /gold/i, tag: 'Oro' },
      { pattern: /oil/i, tag: 'Petrolio' },
      { pattern: /euro/i, tag: 'EUR' },
      { pattern: /dollar/i, tag: 'USD' },
      { pattern: /earnings/i, tag: 'Earnings' },
      { pattern: /ipo/i, tag: 'IPO' },
      { pattern: /market/i, tag: 'Mercati' },
      { pattern: /technology/i, tag: 'Tecnologia' }
    ];
    
    tagPatterns.forEach(({ pattern, tag }) => {
      if (pattern.test(text) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
    
    // Assicurati di avere almeno 2-3 tags
    if (tags.length === 0) {
      tags.push('Finanza', 'Mercati');
    } else if (tags.length === 1) {
      tags.push('Finanza');
    }
    
    return tags.slice(0, 3); // Max 3 tags
  }

  /**
   * Trasforma un articolo Alpha Vantage nel nostro formato
   */
  transformArticle(article, index) {
    const category = this.categorizeArticle(article.title, article.summary);
    
    return {
      id: index + 1,
      title: article.title,
      summary: article.summary,
      source: article.source || 'Financial News',
      date: article.time_published ? article.time_published.substring(0, 8) : new Date().toISOString().substring(0, 10).replace(/-/g, ''),
      category: category,
      readTime: this.calculateReadTime(article.summary),
      image: this.getCategoryEmoji(category),
      link: article.url || '#',
      tags: this.extractTags(article.title, article.summary)
    };
  }

  /**
   * Verifica se la cache è ancora valida
   */
  isCacheValid() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return false;
      
      const { timestamp } = JSON.parse(cached);
      const now = Date.now();
      return (now - timestamp) < this.cacheDuration;
    } catch (error) {
      console.error('Errore verifica cache:', error);
      return false;
    }
  }

  /**
   * Salva i dati nella cache
   */
  saveToCache(data) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Errore salvataggio cache:', error);
    }
  }

  /**
   * Legge i dati dalla cache
   */
  getFromCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;
      
      const { data } = JSON.parse(cached);
      return data;
    } catch (error) {
      console.error('Errore lettura cache:', error);
      return null;
    }
  }

  /**
   * Dati statici di fallback - almeno 5 notizie per categoria
   */
  getFallbackNews() {
    return [
      // MONETARY POLICY (5 notizie)
      {
        id: 1,
        title: 'Fed Mantiene i Tassi Stabili: Mercati in Rialzo',
        summary: 'La Federal Reserve ha confermato la pausa nei rialzi dei tassi, alimentando l\'ottimismo degli investitori sui mercati azionari.',
        source: 'Financial Times',
        date: '2025-11-03',
        category: 'monetary-policy',
        readTime: '3 min',
        image: '📈',
        link: 'https://www.ft.com',
        tags: ['Fed', 'Tassi', 'Mercati']
      },
      {
        id: 2,
        title: 'BCE Segnala Possibili Rialzi per il 2026',
        summary: 'Christine Lagarde indica che la Banca Centrale Europea potrebbe alzare i tassi nel primo trimestre 2026 se l\'inflazione persiste.',
        source: 'Reuters',
        date: '2025-11-02',
        category: 'monetary-policy',
        readTime: '4 min',
        image: '📈',
        link: 'https://www.reuters.com',
        tags: ['BCE', 'EUR', 'Inflazione']
      },
      {
        id: 3,
        title: 'Bank of Japan Mantiene Politica Ultra-Espansiva',
        summary: 'La BoJ conferma i tassi negativi e il controllo della curva dei rendimenti, supportando la crescita economica giapponese.',
        source: 'Nikkei Asia',
        date: '2025-11-01',
        category: 'monetary-policy',
        readTime: '3 min',
        image: '📈',
        link: '#',
        tags: ['BoJ', 'Yen', 'Giappone']
      },
      {
        id: 4,
        title: 'Bank of England: Inflazione Sotto Controllo',
        summary: 'La Banca d\'Inghilterra celebra il raggiungimento dell\'obiettivo di inflazione al 2%, aprendo spazio per tagli futuri.',
        source: 'BBC Business',
        date: '2025-10-31',
        category: 'monetary-policy',
        readTime: '2 min',
        image: '📈',
        link: '#',
        tags: ['BoE', 'GBP', 'Inflazione']
      },
      {
        id: 5,
        title: 'Reserve Bank of Australia: Tassi Invariati',
        summary: 'La RBA mantiene i tassi al 4.35%, bilanciando crescita economica e pressioni inflazionistiche nel mercato australiano.',
        source: 'Australian Financial Review',
        date: '2025-10-30',
        category: 'monetary-policy',
        readTime: '3 min',
        image: '📈',
        link: '#',
        tags: ['RBA', 'AUD', 'Australia']
      },

      // STOCKS (5 notizie)
      {
        id: 6,
        title: 'Nvidia Supera le Aspettative Q3: AI Boom Continua',
        summary: 'I risultati trimestrali di Nvidia mostrano una crescita del 200% nei ricavi AI, con guidance ottimista per Q4 2025.',
        source: 'Bloomberg',
        date: '2025-11-03',
        category: 'stocks',
        readTime: '4 min',
        image: '🚀',
        link: 'https://www.bloomberg.com',
        tags: ['Nvidia', 'AI', 'Tecnologia']
      },
      {
        id: 7,
        title: 'Tesla Raggiunge 2 Milioni di Veicoli Annui',
        summary: 'Tesla celebra la produzione record di 2 milioni di veicoli elettrici nel 2025, superando tutte le previsioni degli analisti.',
        source: 'TechCrunch',
        date: '2025-11-02',
        category: 'stocks',
        readTime: '5 min',
        image: '🚀',
        link: '#',
        tags: ['Tesla', 'EV', 'Produzione']
      },
      {
        id: 8,
        title: 'Apple Annuncia iPhone 17: Rivoluzione AI',
        summary: 'La nuova gamma iPhone 17 integra chip AI proprietari, promettendo funzionalità di intelligenza artificiale avanzate.',
        source: 'Wall Street Journal',
        date: '2025-11-01',
        category: 'stocks',
        readTime: '6 min',
        image: '🚀',
        link: '#',
        tags: ['Apple', 'iPhone', 'AI']
      },
      {
        id: 9,
        title: 'Microsoft Azure: Crescita del 35% YoY',
        summary: 'I servizi cloud di Microsoft registrano crescite eccezionali, guidati dall\'adozione AI e dalle partnership enterprise.',
        source: 'MarketWatch',
        date: '2025-10-31',
        category: 'stocks',
        readTime: '4 min',
        image: '🚀',
        link: '#',
        tags: ['Microsoft', 'Cloud', 'Azure']
      },
      {
        id: 10,
        title: 'Amazon Prime Day: Record di Vendite Globali',
        summary: 'Amazon registra vendite record durante il Prime Day 2025, con crescita del 40% rispetto all\'anno precedente.',
        source: 'CNBC',
        date: '2025-10-30',
        category: 'stocks',
        readTime: '3 min',
        image: '🚀',
        link: '#',
        tags: ['Amazon', 'E-commerce', 'Vendite']
      },

      // CRYPTO (5 notizie)
      {
        id: 11,
        title: 'Bitcoin Sfonda $45,000: Nuovo Bull Run',
        summary: 'Bitcoin raggiunge i $45,000 spinto dall\'adozione istituzionale e dalle aspettative per gli ETF Bitcoin spot approvati.',
        source: 'CoinDesk',
        date: '2025-11-03',
        category: 'crypto',
        readTime: '5 min',
        image: '₿',
        link: '#',
        tags: ['Bitcoin', 'Bull Run', 'ETF']
      },
      {
        id: 12,
        title: 'Ethereum 2.0: Staking Supera $50 Miliardi',
        summary: 'Il valore totale bloccato nel staking di Ethereum raggiunge i $50 miliardi, confermando la fiducia nella rete.',
        source: 'Decrypt',
        date: '2025-11-02',
        category: 'crypto',
        readTime: '4 min',
        image: '₿',
        link: '#',
        tags: ['Ethereum', 'Staking', 'DeFi']
      },
      {
        id: 13,
        title: 'Binance Lancia Trading di Commodity Tokenizzate',
        summary: 'Binance introduce il trading di oro, petrolio e argento tokenizzati, collegando crypto e mercati tradizionali.',
        source: 'CoinTelegraph',
        date: '2025-11-01',
        category: 'crypto',
        readTime: '6 min',
        image: '₿',
        link: '#',
        tags: ['Binance', 'Tokenizzazione', 'Commodity']
      },
      {
        id: 14,
        title: 'El Salvador: Bitcoin Riserva Strategica Nazionale',
        summary: 'El Salvador annuncia l\'acquisizione di altri 500 Bitcoin per le riserve nazionali, portando il totale a 3,000 BTC.',
        source: 'Bitcoin Magazine',
        date: '2025-10-31',
        category: 'crypto',
        readTime: '3 min',
        image: '₿',
        link: '#',
        tags: ['El Salvador', 'Bitcoin', 'Riserve']
      },
      {
        id: 15,
        title: 'PayPal Integra Pagamenti Crypto in Europa',
        summary: 'PayPal estende i pagamenti in criptovalute a tutti i paesi europei, supportando Bitcoin, Ethereum e stablecoin.',
        source: 'The Block',
        date: '2025-10-30',
        category: 'crypto',
        readTime: '4 min',
        image: '₿',
        link: '#',
        tags: ['PayPal', 'Europa', 'Pagamenti']
      },

      // CURRENCIES (5 notizie)
      {
        id: 16,
        title: 'Euro Forte: EUR/USD Raggiunge 1.12',
        summary: 'L\'euro si rafforza contro il dollaro raggiungendo quota 1.12, sostenuto dalle aspettative sui tassi BCE.',
        source: 'FXStreet',
        date: '2025-11-03',
        category: 'currencies',
        readTime: '3 min',
        image: '💱',
        link: '#',
        tags: ['EUR', 'USD', 'Forex']
      },
      {
        id: 17,
        title: 'Yen Giapponese: Intervento BoJ Sul Cambio',
        summary: 'La Bank of Japan interviene per sostenere lo yen, che aveva toccato minimi di 6 mesi contro il dollaro americano.',
        source: 'Reuters',
        date: '2025-11-02',
        category: 'currencies',
        readTime: '4 min',
        image: '💱',
        link: '#',
        tags: ['JPY', 'BoJ', 'Intervento']
      },
      {
        id: 18,
        title: 'Sterlina Britannica: Brexit Deal Boost',
        summary: 'La sterlina guadagna terreno dopo l\'annuncio di nuovi accordi commerciali post-Brexit con mercati asiatici.',
        source: 'Financial Times',
        date: '2025-11-01',
        category: 'currencies',
        readTime: '5 min',
        image: '💱',
        link: '#',
        tags: ['GBP', 'Brexit', 'Commercio']
      },
      {
        id: 19,
        title: 'Franco Svizzero: Safe Haven Appeal',
        summary: 'Il franco svizzero beneficia dello status di bene rifugio mentre crescono le tensioni geopolitiche globali.',
        source: 'SwissInfo',
        date: '2025-10-31',
        category: 'currencies',
        readTime: '3 min',
        image: '💱',
        link: '#',
        tags: ['CHF', 'Safe Haven', 'Rifugio']
      },
      {
        id: 20,
        title: 'Yuan Cinese: Digitale CBDC Expansion',
        summary: 'La Cina espande il pilota dello yuan digitale a 50 nuove città, accelerando verso l\'adozione nazionale.',
        source: 'China Daily',
        date: '2025-10-30',
        category: 'currencies',
        readTime: '4 min',
        image: '💱',
        link: '#',
        tags: ['CNY', 'CBDC', 'Digitale']
      },

      // COMMODITIES (5 notizie)
      {
        id: 21,
        title: 'Oro Tocca Record: $2,180/oz',
        summary: 'L\'oro raggiunge nuovi massimi storici a $2,180 per oncia, spinto dall\'inflazione e dalle tensioni geopolitiche.',
        source: 'MarketWatch',
        date: '2025-11-03',
        category: 'commodities',
        readTime: '3 min',
        image: '🏅',
        link: '#',
        tags: ['Oro', 'Record', 'Inflazione']
      },
      {
        id: 22,
        title: 'Petrolio WTI: OPEC+ Estende Tagli Produzione',
        summary: 'L\'OPEC+ prolunga i tagli alla produzione fino a marzo 2026, sostenendo i prezzi del petrolio sopra i $85/barile.',
        source: 'Oil Price',
        date: '2025-11-02',
        category: 'commodities',
        readTime: '4 min',
        image: '🏅',
        link: '#',
        tags: ['Petrolio', 'OPEC', 'Produzione']
      },
      {
        id: 23,
        title: 'Argento: Boom della Domanda Industriale',
        summary: 'I prezzi dell\'argento salgono del 15% mensile grazie alla crescente domanda nei pannelli solari e nell\'elettronica.',
        source: 'Silver Institute',
        date: '2025-11-01',
        category: 'commodities',
        readTime: '3 min',
        image: '🏅',
        link: '#',
        tags: ['Argento', 'Industriale', 'Solare']
      },
      {
        id: 24,
        title: 'Rame: Shortage Globale Previsto per 2026',
        summary: 'Gli analisti prevedono una carenza globale di rame nel 2026, spingendo i prezzi verso nuovi massimi pluriennali.',
        source: 'Mining.com',
        date: '2025-10-31',
        category: 'commodities',
        readTime: '5 min',
        image: '🏅',
        link: '#',
        tags: ['Rame', 'Shortage', 'Mining']
      },
      {
        id: 25,
        title: 'Gas Naturale: Inverno Europeo Mite Riduce Prezzi',
        summary: 'Le previsioni di un inverno mite in Europa spingono i prezzi del gas naturale ai minimi di 2 anni.',
        source: 'Natural Gas World',
        date: '2025-10-30',
        category: 'commodities',
        readTime: '4 min',
        image: '🏅',
        link: '#',
        tags: ['Gas', 'Europa', 'Inverno']
      },

      // SUSTAINABILITY (5 notizie)
      {
        id: 26,
        title: 'Green Energy: $2 Trilioni di Investimenti 2025',
        summary: 'Gli investimenti globali nelle energie rinnovabili raggiungono $2 trilioni nel 2025, record storico assoluto.',
        source: 'Bloomberg New Energy Finance',
        date: '2025-11-03',
        category: 'sustainability',
        readTime: '6 min',
        image: '🌱',
        link: '#',
        tags: ['Rinnovabili', 'Investimenti', 'Record']
      },
      {
        id: 27,
        title: 'Tesla Gigafactory: 100% Energia Solare',
        summary: 'La nuova Gigafactory Tesla in Texas raggiunge l\'autosufficienza energetica completa tramite pannelli solari.',
        source: 'Electrek',
        date: '2025-11-02',
        category: 'sustainability',
        readTime: '4 min',
        image: '🌱',
        link: '#',
        tags: ['Tesla', 'Solare', 'Autosufficienza']
      },
      {
        id: 28,
        title: 'Carbon Credits: Mercato Supera $100 Miliardi',
        summary: 'Il mercato globale dei crediti di carbonio supera per la prima volta i $100 miliardi di capitalizzazione.',
        source: 'Carbon Pulse',
        date: '2025-11-01',
        category: 'sustainability',
        readTime: '5 min',
        image: '🌱',
        link: '#',
        tags: ['Carbonio', 'ESG', 'Mercato']
      },
      {
        id: 29,
        title: 'Offshore Wind: Boom in Asia-Pacifico',
        summary: 'La regione Asia-Pacifico guida la crescita mondiale dell\'eolico offshore con 50 GW di nuova capacità installata.',
        source: 'Wind Power Monthly',
        date: '2025-10-31',
        category: 'sustainability',
        readTime: '4 min',
        image: '🌱',
        link: '#',
        tags: ['Eolico', 'Asia', 'Offshore']
      },
      {
        id: 30,
        title: 'Green Bonds: Emissioni Record da Corporate',
        summary: 'Le aziende private emettono green bonds per $500 miliardi nel 2025, superando le emissioni governative.',
        source: 'Environmental Finance',
        date: '2025-10-30',
        category: 'sustainability',
        readTime: '3 min',
        image: '🌱',
        link: '#',
        tags: ['Green Bonds', 'Corporate', 'Finanza']
      },

      // ANALYSIS (5 notizie)
      {
        id: 31,
        title: 'Wall Street 2026: Outlook Rialzista degli Analisti',
        summary: 'Le principali banche d\'investimento prevedono un 2026 positivo per Wall Street, con target S&P 500 a 6,500 punti.',
        source: 'Goldman Sachs Research',
        date: '2025-11-03',
        category: 'analysis',
        readTime: '8 min',
        image: '🌍',
        link: '#',
        tags: ['Wall Street', 'Outlook', 'S&P 500']
      },
      {
        id: 32,
        title: 'Mercati Emergenti: Il Ritorno degli Investimenti',
        summary: 'JPMorgan prevede un ritorno massiccio di capitali verso i mercati emergenti nel primo semestre 2026.',
        source: 'JPMorgan Research',
        date: '2025-11-02',
        category: 'analysis',
        readTime: '7 min',
        image: '🌍',
        link: '#',
        tags: ['Emergenti', 'JPMorgan', 'Capitali']
      },
      {
        id: 33,
        title: 'Artificial Intelligence: $10 Trilioni Market Cap',
        summary: 'Morgan Stanley prevede che il settore AI raggiungerà una capitalizzazione complessiva di $10 trilioni entro il 2030.',
        source: 'Morgan Stanley',
        date: '2025-11-01',
        category: 'analysis',
        readTime: '9 min',
        image: '🌍',
        link: '#',
        tags: ['AI', 'Valutazione', 'Futuro']
      },
      {
        id: 34,
        title: 'Recessione USA: Probabilità Scende al 15%',
        summary: 'Gli economisti riducono la probabilità di recessione USA al 15%, il minimo degli ultimi 18 mesi.',
        source: 'Federal Reserve Bank',
        date: '2025-10-31',
        category: 'analysis',
        readTime: '6 min',
        image: '🌍',
        link: '#',
        tags: ['Recessione', 'USA', 'Economisti']
      },
      {
        id: 35,
        title: 'Inflazione Globale: Trend Discendente Confermato',
        summary: 'Il FMI conferma il trend discendente dell\'inflazione globale, prevista al 2.8% nel 2026 dal 4.1% del 2024.',
        source: 'International Monetary Fund',
        date: '2025-10-30',
        category: 'analysis',
        readTime: '5 min',
        image: '🌍',
        link: '#',
        tags: ['Inflazione', 'FMI', 'Globale']
      },

      // IPOS (5 notizie)
      {
        id: 36,
        title: 'SpaceX IPO: Valutazione $200 Miliardi',
        summary: 'SpaceX valuta l\'IPO nel 2026 con una capitalizzazione stimata di $200 miliardi, la più grande tech IPO mai vista.',
        source: 'IPO Edge',
        date: '2025-11-03',
        category: 'ipos',
        readTime: '6 min',
        image: '🎯',
        link: '#',
        tags: ['SpaceX', 'IPO', 'Valutazione']
      },
      {
        id: 37,
        title: 'Stripe IPO: Fintech Unicorn Pronto al Debutto',
        summary: 'Stripe finalizza i piani per l\'IPO nel Q2 2026, puntando a una valutazione di $100 miliardi nel settore fintech.',
        source: 'TechCrunch',
        date: '2025-11-02',
        category: 'ipos',
        readTime: '5 min',
        image: '�',
        link: '#',
        tags: ['Stripe', 'Fintech', 'Unicorn']
      },
      {
        id: 38,
        title: 'ByteDance: IPO Doppia Listing USA-Hong Kong',
        summary: 'ByteDance (TikTok) pianifica una IPO doppia su NYSE e Hong Kong Exchange per raccogliere $50 miliardi.',
        source: 'South China Morning Post',
        date: '2025-11-01',
        category: 'ipos',
        readTime: '7 min',
        image: '🎯',
        link: '#',
        tags: ['ByteDance', 'TikTok', 'Doppia IPO']
      },
      {
        id: 39,
        title: 'Canva IPO: Design Platform da $40 Miliardi',
        summary: 'La piattaforma di design Canva deposita per l\'IPO con valutazione target di $40 miliardi, guidando il settore SaaS.',
        source: 'Renaissance Capital',
        date: '2025-10-31',
        category: 'ipos',
        readTime: '4 min',
        image: '🎯',
        link: '#',
        tags: ['Canva', 'SaaS', 'Design']
      },
      {
        id: 40,
        title: 'Databricks: AI Data Platform IPO $50B',
        summary: 'Databricks accelera verso l\'IPO con valutazione di $50 miliardi, cavalcando il boom dell\'AI e big data analytics.',
        source: 'IPO Scoop',
        date: '2025-10-30',
        category: 'ipos',
        readTime: '5 min',
        image: '🎯',
        link: '#',
        tags: ['Databricks', 'AI', 'Big Data']
      }
    ];
  }

  /**
   * Fetch news da Alpha Vantage API tramite proxy backend
   */
  async fetchNewsFromAPI() {
    try {
      const params = new URLSearchParams({
        tickers: 'NVDA,TSLA,AAPL,MSFT,GOOGL,AMZN,META,BTC,ETH,SPY,QQQ',
        topics: 'financial_markets,earnings,ipo,mergers_and_acquisitions,technology',
        limit: 10
      });

      const response = await fetch(`http://localhost:8001/api/news?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Controlla se ci sono errori nell'API
      if (data['Error Message'] || data['Note']) {
        throw new Error(data['Error Message'] || data['Note']);
      }

      // Trasforma gli articoli nel nostro formato
      const articles = (data.feed || [])
        .slice(0, 8) // Prendiamo solo i primi 8
        .map((article, index) => this.transformArticle(article, index));

      return articles;

    } catch (error) {
      console.error('Errore fetch Alpha Vantage:', error);
      throw error;
    }
  }

  /**
   * Ottieni le news (con cache e fallback)
   */
  async getNews(forceRefresh = false) {
    try {
      // Se non è un refresh forzato, controlla la cache
      if (!forceRefresh && this.isCacheValid()) {
        console.log('📰 News caricate dalla cache');
        return this.getFromCache();
      }

      console.log('📡 Caricamento news da API tramite proxy backend...');
      
      // Fetch da API tramite proxy
      const newsFromAPI = await this.fetchNewsFromAPI();
      
      if (newsFromAPI && newsFromAPI.length > 0) {
        // Salva in cache e ritorna
        this.saveToCache(newsFromAPI);
        console.log(`✅ ${newsFromAPI.length} news caricate da Alpha Vantage tramite proxy`);
        return newsFromAPI;
      } else {
        throw new Error('Nessun articolo ricevuto dall\'API');
      }

    } catch (error) {
      console.error('⚠️ Errore caricamento news API, uso fallback:', error);
      
      // Fallback ai dati statici
      const fallbackNews = this.getFallbackNews();
      
      // Se abbiamo dati in cache (anche se scaduti), usiamo quelli
      const cachedNews = this.getFromCache();
      if (cachedNews && cachedNews.length > 0) {
        console.log('📰 Uso news dalla cache scaduta');
        return cachedNews;
      }
      
      console.log('📰 Uso news statiche di fallback');
      return fallbackNews;
    }
  }

  /**
   * Pulisce la cache
   */
  clearCache() {
    try {
      localStorage.removeItem(this.cacheKey);
      console.log('🗑️ Cache news pulita');
    } catch (error) {
      console.error('Errore pulizia cache:', error);
    }
  }

  /**
   * Info sulla cache
   */
  getCacheInfo() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) {
        return { hasCache: false, timestamp: null, isValid: false };
      }
      
      const { timestamp } = JSON.parse(cached);
      const isValid = this.isCacheValid();
      
      return {
        hasCache: true,
        timestamp: new Date(timestamp),
        isValid: isValid,
        expiresIn: Math.max(0, this.cacheDuration - (Date.now() - timestamp))
      };
    } catch (error) {
      return { hasCache: false, timestamp: null, isValid: false };
    }
  }
}

// Istanza singleton del servizio
export const newsService = new NewsService();

export default newsService;