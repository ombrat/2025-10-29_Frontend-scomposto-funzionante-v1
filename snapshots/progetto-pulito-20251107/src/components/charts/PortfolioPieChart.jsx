import React, { useMemo, useState, useEffect } from 'react';
import { API_CONFIG } from '../../config/apiConfig.js';

/**
 * PortfolioPieChart - Grafico a torta per mostrare la composizione del portafoglio
 * @param {Object} props
 * @param {Array} props.assets - Array di asset con ticker, name e weight
 * @param {string} props.title - Titolo del grafico (opzionale)
 * @param {number} props.size - Dimensione del grafico (default: 300)
 */
export default function PortfolioPieChart({ assets, title = "Composizione Portafoglio", size = 300 }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  const [viewMode, setViewMode] = useState('assets'); // 'assets', 'currency' o 'geography'
  const [geoLoading, setGeoLoading] = useState(false);
  
  // Mapping delle valute basato sui ticker e borse di quotazione
  const getCurrency = (ticker) => {
    // Mapping esplicito per ticker specifici (override dei suffissi)
    const explicitCurrencyMap = {
      // ETF Europei in EUR
      'VWCE.DE': 'EUR', 'EUNL.DE': 'EUR', 'IUSN.DE': 'EUR', 'VUSA.L': 'EUR', 'CSPX.L': 'EUR', 'SWDA.L': 'EUR',
      // Azioni europee specifiche
      'ASML.AS': 'EUR', 'ASML': 'USD', // ASML: EUR ad Amsterdam, USD al NASDAQ
      'SAP.DE': 'EUR', 'SAP': 'USD',   // SAP: EUR in Germania, USD negli USA (ADR)
      'OR.PA': 'EUR', 'NESN.SW': 'CHF', 'NOVO.CO': 'DKK',
      // ETF con denominazione europea
      'IEMM.L': 'EUR', 'IEUR.L': 'EUR', 'IDWM.L': 'EUR', 'IDEM.L': 'EUR',
      
      // ETF americani in USD
      'VTI': 'USD', 'VOO': 'USD', 'SPY': 'USD', 'QQQ': 'USD', 'VEA': 'USD', 'VWO': 'USD', 'BND': 'USD', 'VXUS': 'USD',
      // Azioni americane
      'AAPL': 'USD', 'MSFT': 'USD', 'GOOGL': 'USD', 'AMZN': 'USD', 'TSLA': 'USD', 'META': 'USD', 'NVDA': 'USD', 'NFLX': 'USD',
      // Altri ETF USD
      'IVV': 'USD', 'SCHB': 'USD', 'ITOT': 'USD', 'IXUS': 'USD', 'IEFA': 'USD', 'IEMG': 'USD'
    };

    // Controllo esatto del ticker (per override specifici)
    if (explicitCurrencyMap[ticker]) {
      return explicitCurrencyMap[ticker];
    }
    
    // Regole basate sui suffissi delle borse (valuta di quotazione)
    // Europa - EUR
    if (ticker.includes('.DE')) return 'EUR';  // Germania (Xetra)
    if (ticker.includes('.PA')) return 'EUR';  // Francia (Euronext Paris)
    if (ticker.includes('.AS')) return 'EUR';  // Paesi Bassi (Amsterdam)
    if (ticker.includes('.MI')) return 'EUR';  // Italia (Borsa Italiana) - MANCAVA QUESTO!
    if (ticker.includes('.MC')) return 'EUR';  // Spagna (BME)
    if (ticker.includes('.F')) return 'EUR';   // Germania (Francoforte)
    if (ticker.includes('.BR')) return 'EUR';  // Belgio (Euronext Brussels)
    if (ticker.includes('.VI')) return 'EUR';  // Austria (Wiener Börse)
    
    // Regno Unito - GBP (ma molti ETF sono in USD, quindi controllo caso per caso)
    if (ticker.includes('.L')) {
      // ETF internazionali quotati a Londra sono spesso in USD
      if (ticker.includes('USD') || ticker.includes('UCITS')) return 'USD';
      return 'GBP'; // Azioni UK native
    }
    
    // Svizzera - CHF
    if (ticker.includes('.SW')) return 'CHF';  // Svizzera (SIX)
    
    // Scandinavia - valute locali
    if (ticker.includes('.ST')) return 'SEK';  // Svezia (Nasdaq Stockholm)
    if (ticker.includes('.OL')) return 'NOK';  // Norvegia (Oslo Børs)
    if (ticker.includes('.HE')) return 'EUR';  // Finlandia (Nasdaq Helsinki) - EUR
    if (ticker.includes('.CO')) return 'DKK';  // Danimarca (Nasdaq Copenhagen)
    
    // Nord America - USD/CAD
    if (ticker.includes('.TO')) return 'CAD';  // Canada (TSX)
    if (ticker.includes('.V')) return 'CAD';   // Canada (TSX Venture)
    
    // Asia-Pacifico - valute locali
    if (ticker.includes('.T')) return 'JPY';   // Giappone (Tokyo)
    if (ticker.includes('.AX')) return 'AUD';  // Australia (ASX)
    if (ticker.includes('.HK')) return 'HKD';  // Hong Kong
    if (ticker.includes('.KS')) return 'KRW';  // Corea del Sud (KOSPI)
    if (ticker.includes('.SI')) return 'SGD';  // Singapore
    if (ticker.includes('.TW')) return 'TWD';  // Taiwan
    
    // Mercati Emergenti - valute locali
    if (ticker.includes('.SS')) return 'CNY';  // Cina (Shanghai)
    if (ticker.includes('.SZ')) return 'CNY';  // Cina (Shenzhen)
    if (ticker.includes('.BO')) return 'INR';  // India (Bombay/Mumbai)
    if (ticker.includes('.NS')) return 'INR';  // India (NSE)
    if (ticker.includes('.SA')) return 'BRL';  // Brasile (B3)
    
    // Default: presume USD per ticker senza suffisso (probabilmente USA)
    return 'USD';
  };

  // Cache per evitare richieste duplicate
  const [geoCache, setGeoCache] = useState({});

  // Effetto per pre-caricare dati geografici quando serve
  useEffect(() => {
    if (viewMode === 'geography' && assets && assets.length > 0) {
      const loadGeographyData = async () => {
        setGeoLoading(true);
        try {
          // Carica i dati per tutti i ticker non ancora in cache
          const tickersToLoad = assets
            .filter(asset => asset.ticker && !geoCache[asset.ticker])
            .map(asset => asset.ticker);

          if (tickersToLoad.length > 0) {
            // Carica in parallelo (max configurabili alla volta per rispettare i rate limits)
            const chunks = [];
            for (let i = 0; i < tickersToLoad.length; i += API_CONFIG.MAX_CONCURRENT_REQUESTS) {
              chunks.push(tickersToLoad.slice(i, i + API_CONFIG.MAX_CONCURRENT_REQUESTS));
            }

            for (const chunk of chunks) {
              await Promise.all(chunk.map(async (ticker) => {
                try {
                  const region = await getGeography(ticker);
                  setGeoCache(prev => ({ ...prev, [ticker]: region }));
                } catch (error) {
                  console.warn(`Failed to load geography for ${ticker}:`, error);
                  // Fallback
                  setGeoCache(prev => ({ ...prev, [ticker]: getGeographyFallback(ticker) }));
                }
              }));
              // Piccola pausa tra i chunk per rispettare i rate limits
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        } finally {
          setGeoLoading(false);
        }
      };

      loadGeographyData();
    }
  }, [viewMode, assets]);

  // Funzione per ottenere dati geografici da API esterna
  const fetchGeographyFromAPI = async (ticker) => {
    // Se già in cache, usa quello
    if (geoCache[ticker]) {
      return geoCache[ticker];
    }

    try {
      // Prova prima con Alpha Vantage (richiede API key gratuita)
      const response = await fetch(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${API_CONFIG.ALPHA_VANTAGE_KEY}`,
        { 
          signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.Country) {
          const region = countryToRegion(data.Country);
          // Salva in cache
          setGeoCache(prev => ({ ...prev, [ticker]: region }));
          return region;
        }
      }
    } catch (error) {
      console.warn(`API call failed for ${ticker}:`, error);
    }

    // Fallback alla mappatura manuale
    return getGeographyFallback(ticker);
  };

  // Converte nome paese a regione macro
  const countryToRegion = (country) => {
    const regionMapping = {
      // Nord America
      'USA': 'Nord America',
      'United States': 'Nord America', 
      'US': 'Nord America',
      'Canada': 'Nord America',
      'CA': 'Nord America',

      // Europa
      'Germany': 'Europa', 'Deutschland': 'Europa', 'DE': 'Europa',
      'France': 'Europa', 'FR': 'Europa',
      'United Kingdom': 'Europa', 'UK': 'Europa', 'GB': 'Europa',
      'Netherlands': 'Europa', 'NL': 'Europa',
      'Switzerland': 'Europa', 'CH': 'Europa',
      'Italy': 'Europa', 'IT': 'Europa',
      'Spain': 'Europa', 'ES': 'Europa',
      'Sweden': 'Europa', 'SE': 'Europa',
      'Denmark': 'Europa', 'DK': 'Europa',
      'Norway': 'Europa', 'NO': 'Europa',
      'Finland': 'Europa', 'FI': 'Europa',
      'Austria': 'Europa', 'AT': 'Europa',
      'Belgium': 'Europa', 'BE': 'Europa',
      'Ireland': 'Europa', 'IE': 'Europa',
      'Portugal': 'Europa', 'PT': 'Europa',

      // Asia-Pacifico
      'Japan': 'Asia-Pacifico', 'JP': 'Asia-Pacifico',
      'Australia': 'Asia-Pacifico', 'AU': 'Asia-Pacifico',
      'South Korea': 'Asia-Pacifico', 'KR': 'Asia-Pacifico',
      'Taiwan': 'Asia-Pacifico', 'TW': 'Asia-Pacifico',
      'Singapore': 'Asia-Pacifico', 'SG': 'Asia-Pacifico',
      'Hong Kong': 'Asia-Pacifico', 'HK': 'Asia-Pacifico',
      'New Zealand': 'Asia-Pacifico', 'NZ': 'Asia-Pacifico',

      // Mercati Emergenti
      'China': 'Mercati Emergenti', 'CN': 'Mercati Emergenti',
      'India': 'Mercati Emergenti', 'IN': 'Mercati Emergenti',
      'Thailand': 'Mercati Emergenti', 'TH': 'Mercati Emergenti',
      'Indonesia': 'Mercati Emergenti', 'ID': 'Mercati Emergenti',
      'Malaysia': 'Mercati Emergenti', 'MY': 'Mercati Emergenti',
      'Mexico': 'Mercati Emergenti', 'MX': 'Mercati Emergenti',
      'Turkey': 'Mercati Emergenti', 'TR': 'Mercati Emergenti',

      // Sud America
      'Brazil': 'Sud America', 'BR': 'Sud America',
      'Chile': 'Sud America', 'CL': 'Sud America',
      'Argentina': 'Sud America', 'AR': 'Sud America',
      'Colombia': 'Sud America', 'CO': 'Sud America',
      'Peru': 'Sud America', 'PE': 'Sud America',

      // Africa
      'South Africa': 'Africa', 'ZA': 'Africa',
      'Egypt': 'Africa', 'EG': 'Africa',
      'Nigeria': 'Africa', 'NG': 'Africa',
      'Kenya': 'Africa', 'KE': 'Africa',

      // Medio Oriente
      'Saudi Arabia': 'Medio Oriente', 'SA': 'Medio Oriente',
      'UAE': 'Medio Oriente', 'AE': 'Medio Oriente',
      'Qatar': 'Medio Oriente', 'QA': 'Medio Oriente',
      'Israel': 'Medio Oriente', 'IL': 'Medio Oriente',
    };

    return regionMapping[country] || 'Altri';
  };

  // Mapping geografico basato sul paese di origine delle società (fallback)
  const getGeographyFallback = (ticker) => {
    // Mapping diretto per regioni geografiche (basato sul paese di origine delle società)
    const companyRegionMap = {
      // Società europee (indipendentemente dalla borsa di quotazione)
      'ASML': 'Europa',        // ASML - Paesi Bassi
      'SAP': 'Europa',         // SAP SE - Germania
      'NESN': 'Europa',        // Nestlé - Svizzera
      'OR': 'Europa',          // L'Oréal - Francia
      'NOVO': 'Europa',        // Novo Nordisk - Danimarca
      'ADYEN': 'Europa',       // Adyen - Paesi Bassi
      'PROSUS': 'Europa',      // Prosus - Paesi Bassi
      'SHELL': 'Europa',       // Shell - Paesi Bassi
      'RDSA': 'Europa',        // Royal Dutch Shell A
      'RDSB': 'Europa',        // Royal Dutch Shell B
      'ULVR': 'Europa',        // Unilever - Regno Unito
      'LVMH': 'Europa',        // LVMH - Francia
      'MC': 'Europa',          // LVMH (ticker francese)
      'HERMES': 'Europa',      // Hermès - Francia
      'KERING': 'Europa',      // Kering - Francia
      'TOTALENERGIES': 'Europa', // TotalEnergies - Francia
      'TTE': 'Europa',         // TotalEnergies
      'SANOFI': 'Europa',      // Sanofi - Francia
      'SAN': 'Europa',         // Sanofi
      'AIRBUS': 'Europa',      // Airbus SE - Paesi Bassi
      'AIR': 'Europa',         // Airbus
      'EADS': 'Europa',        // Airbus (vecchio nome)
      'SIEMENS': 'Europa',     // Siemens - Germania
      'SIE': 'Europa',         // Siemens
      'BMW': 'Europa',         // BMW - Germania
      'DAI': 'Europa',         // Daimler/Mercedes - Germania
      'MBG': 'Europa',         // Mercedes-Benz Group - Germania
      'VOW': 'Europa',         // Volkswagen - Germania
      'BAS': 'Europa',         // BASF - Germania
      'ALV': 'Europa',         // Allianz - Germania
      'DBK': 'Europa',         // Deutsche Bank - Germania
      'DTE': 'Europa',         // Deutsche Telekom - Germania
      'MUV2': 'Europa',        // Munich Re - Germania
      'NOKIA': 'Europa',       // Nokia - Finlandia
      'ERICSSON': 'Europa',    // Ericsson - Svezia
      'H&M': 'Europa',         // H&M - Svezia
      'VOLVO': 'Europa',       // Volvo - Svezia
      'SPOTIFY': 'Europa',     // Spotify - Svezia
      
      // Società nordamericane
      'AAPL': 'Nord America', 'MSFT': 'Nord America', 'GOOGL': 'Nord America', 'GOOG': 'Nord America', 'AMZN': 'Nord America',
      'TSLA': 'Nord America', 'META': 'Nord America', 'NVDA': 'Nord America', 'NFLX': 'Nord America', 'JPM': 'Nord America',
      'JNJ': 'Nord America', 'UNH': 'Nord America', 'PG': 'Nord America', 'HD': 'Nord America', 'V': 'Nord America', 'MA': 'Nord America',
      'DIS': 'Nord America', 'ADBE': 'Nord America', 'CRM': 'Nord America', 'INTC': 'Nord America', 'AMD': 'Nord America',
      'BRKB': 'Nord America', 'XOM': 'Nord America', 'PFE': 'Nord America', 'KO': 'Nord America', 'WMT': 'Nord America',
      'IBM': 'Nord America', 'ORCL': 'Nord America', 'CSCO': 'Nord America', 'CVX': 'Nord America', 'ABT': 'Nord America',
      'SHOPIFY': 'Nord America', // Shopify - Canada
      'CNR': 'Nord America',     // Canadian National Railway - Canada
      'RY': 'Nord America',      // Royal Bank of Canada - Canada
      
      // Società Asia-Pacifico
      'TSM': 'Asia-Pacifico',        // Taiwan Semiconductor - Taiwan
      'TSMC': 'Asia-Pacifico',       // Taiwan Semiconductor - Taiwan
      'TM': 'Asia-Pacifico',         // Toyota - Giappone
      'SONY': 'Asia-Pacifico',       // Sony - Giappone
      'NTT': 'Asia-Pacifico',        // NTT - Giappone
      'SFT': 'Asia-Pacifico',        // SoftBank - Giappone
      '9984': 'Asia-Pacifico',       // SoftBank (ticker giapponese)
      'SAMSUNG': 'Asia-Pacifico',    // Samsung - Corea del Sud
      'BHP': 'Asia-Pacifico',        // BHP - Australia
      'CSL': 'Asia-Pacifico',        // CSL - Australia
      'CBA': 'Asia-Pacifico',        // Commonwealth Bank - Australia
      'TENCENT': 'Asia-Pacifico',    // Tencent - Cina
      'ALIBABA': 'Asia-Pacifico',    // Alibaba - Cina
      
      // Mercati Emergenti - Asia
      'TCEHY': 'Mercati Emergenti',  // Tencent ADR - Cina
      'BABA': 'Mercati Emergenti',   // Alibaba ADR - Cina
      'JD': 'Mercati Emergenti',     // JD.com ADR - Cina
      'NTES': 'Mercati Emergenti',   // NetEase ADR - Cina
      'PDD': 'Mercati Emergenti',    // PDD ADR - Cina
      'BIDU': 'Mercati Emergenti',   // Baidu ADR - Cina
      'NIO': 'Mercati Emergenti',    // NIO ADR - Cina
      'XPEV': 'Mercati Emergenti',   // XPeng ADR - Cina
      'LI': 'Mercati Emergenti',     // Li Auto ADR - Cina
      'INFOSYS': 'Mercati Emergenti', // Infosys - India
      'WIT': 'Mercati Emergenti',    // Wipro - India
      'RELI': 'Mercati Emergenti',   // Reliance - India
      'TCS': 'Mercati Emergenti',    // Tata Consultancy - India
      
      // Sud America
      'VALE': 'Sud America',         // Vale - Brasile
      'ITUB': 'Sud America',         // Itau - Brasile
      'PETR4': 'Sud America',        // Petrobras - Brasile
      'BBDC4': 'Sud America',        // Bradesco - Brasile
      'ABEV': 'Sud America',         // Ambev - Brasile
      
      // Africa
      'NPN': 'Africa',               // Naspers - Sudafrica
      'SHP': 'Africa',               // Shoprite - Sudafrica
      'MTN': 'Africa',               // MTN - Sudafrica
      
      // Medio Oriente
      'ARAMCO': 'Medio Oriente',     // Saudi Aramco
      '2222': 'Medio Oriente',       // Saudi Aramco (ticker saudita)
      
      // ETF e fondi (basati sulla strategia di investimento)
      'SPY': 'Nord America',         // S&P 500
      'VTI': 'Nord America',         // US Total Stock Market
      'QQQ': 'Nord America',         // Nasdaq 100
      'IVV': 'Nord America',         // S&P 500
      'VOO': 'Nord America',         // S&P 500
      'VEA': 'Europa',               // Developed Europe
      'VWO': 'Mercati Emergenti',    // Emerging Markets
      'EFA': 'Europa',               // Europe, Far East
      'IEFA': 'Europa',              // Developed Europe
      'IEMG': 'Mercati Emergenti',   // Emerging Markets
      'VGK': 'Europa',               // European Stock Index
      'FEZ': 'Europa',               // Eurozone
      'EWJ': 'Asia-Pacifico',        // Japan
      'EWG': 'Europa',               // Germany
      'EWU': 'Europa',               // UK
      'EWP': 'Europa',               // Spain
      'EWI': 'Europa',               // Italy
      'EWQ': 'Europa',               // France
      'EWL': 'Europa',               // Switzerland
      'EWN': 'Europa',               // Netherlands
      'VPL': 'Asia-Pacifico',        // Pacific ex-Japan
      'VGE': 'Mercati Emergenti',    // Emerging Markets
      'EEM': 'Mercati Emergenti',    // Emerging Markets
      'FM': 'Mercati Emergenti',     // Frontier Markets
    };

    // Rimuovi suffissi di borsa per il matching
    const baseTicker = ticker.replace(/\.(AS|L|PA|DE|SW|MI|MC|TO|AX|HK|T|F)$/i, '');
    
    // Cerca nel mapping diretto (già mappato alle regioni)
    if (companyRegionMap[ticker.toUpperCase()]) {
      return companyRegionMap[ticker.toUpperCase()];
    }
    if (companyRegionMap[baseTicker.toUpperCase()]) {
      return companyRegionMap[baseTicker.toUpperCase()];
    }

    // Fallback: euristiche basate sui suffissi di borsa
    // Europa
    if (ticker.includes('.DE')) return 'Europa';        // Germania (Xetra)
    if (ticker.includes('.PA')) return 'Europa';        // Francia (Euronext Paris)
    if (ticker.includes('.L')) return 'Europa';         // Regno Unito (Londra)
    if (ticker.includes('.AS')) return 'Europa';        // Paesi Bassi (Amsterdam)
    if (ticker.includes('.SW')) return 'Europa';        // Svizzera (SIX)
    if (ticker.includes('.MI')) return 'Europa';        // Italia (Borsa Italiana)
    if (ticker.includes('.MC')) return 'Europa';        // Spagna (BME)
    if (ticker.includes('.F')) return 'Europa';         // Germania (Francoforte)
    if (ticker.includes('.BR')) return 'Europa';        // Belgio (Euronext Brussels)
    if (ticker.includes('.VI')) return 'Europa';        // Austria (Wiener Börse)
    if (ticker.includes('.ST')) return 'Europa';        // Svezia (Nasdaq Stockholm)
    if (ticker.includes('.OL')) return 'Europa';        // Norvegia (Oslo Børs)
    if (ticker.includes('.HE')) return 'Europa';        // Finlandia (Nasdaq Helsinki)
    if (ticker.includes('.CO')) return 'Europa';        // Danimarca (Nasdaq Copenhagen)
    
    // Nord America
    if (ticker.includes('.TO')) return 'Nord America';  // Canada (TSX)
    if (ticker.includes('.V')) return 'Nord America';   // Canada (TSX Venture)
    
    // Asia-Pacifico
    if (ticker.includes('.AX')) return 'Asia-Pacifico'; // Australia (ASX)
    if (ticker.includes('.HK')) return 'Asia-Pacifico'; // Hong Kong
    if (ticker.includes('.T')) return 'Asia-Pacifico';  // Giappone (Tokyo)
    if (ticker.includes('.KS')) return 'Asia-Pacifico'; // Corea del Sud (KOSPI)
    if (ticker.includes('.SI')) return 'Asia-Pacifico'; // Singapore
    if (ticker.includes('.NZ')) return 'Asia-Pacifico'; // Nuova Zelanda
    if (ticker.includes('.TW')) return 'Asia-Pacifico'; // Taiwan
    
    // Mercati Emergenti
    if (ticker.includes('.SS')) return 'Mercati Emergenti'; // Cina (Shanghai)
    if (ticker.includes('.SZ')) return 'Mercati Emergenti'; // Cina (Shenzhen)
    if (ticker.includes('.BO')) return 'Mercati Emergenti'; // India (Bombay/Mumbai)
    if (ticker.includes('.NS')) return 'Mercati Emergenti'; // India (NSE)
    if (ticker.includes('.BK')) return 'Mercati Emergenti'; // Thailandia (Bangkok)
    if (ticker.includes('.JK')) return 'Mercati Emergenti'; // Indonesia (Jakarta)
    if (ticker.includes('.KL')) return 'Mercati Emergenti'; // Malaysia (Kuala Lumpur)
    if (ticker.includes('.MX')) return 'Mercati Emergenti'; // Messico
    if (ticker.includes('.IS')) return 'Mercati Emergenti'; // Turchia (Istanbul)
    
    // Sud America
    if (ticker.includes('.SA')) return 'Sud America';       // Brasile (B3)
    if (ticker.includes('.SN')) return 'Sud America';       // Cile (Santiago)
    if (ticker.includes('.BA')) return 'Sud America';       // Argentina (Buenos Aires)
    
    // Africa
    if (ticker.includes('.JO')) return 'Africa';           // Sudafrica (Johannesburg)
    
    // Medio Oriente
    if (ticker.includes('.SAU')) return 'Medio Oriente';   // Arabia Saudita (Tadawul)
    if (ticker.includes('.QA')) return 'Medio Oriente';    // Qatar
    if (ticker.includes('.AE')) return 'Medio Oriente';    // Emirati Arabi Uniti
    
    // Default: presume Nord America per ticker senza suffisso (probabilmente USA)
    return 'Nord America';
  };

  // Funzione principale che combina API e fallback
  const getGeography = async (ticker) => {
    // Prima prova con l'API (se disponibile)
    try {
      return await fetchGeographyFromAPI(ticker);
    } catch (error) {
      // Se l'API fallisce, usa il mapping manuale
      return getGeographyFallback(ticker);
    }
  };

  // Calcola i dati per il grafico a torta
  const pieData = useMemo(() => {
    if (!assets || !Array.isArray(assets)) return [];
    
    // Filtra solo gli asset con peso > 0
    const validAssets = assets.filter(asset => Number(asset.weight) > 0);
    
    if (validAssets.length === 0) return [];
    
    // Genera colori per ogni categoria
    const colors = [
      '#66bb6a', '#42a5f5', '#ff7043', '#ffca28', '#ab47bc', 
      '#26c6da', '#66bb6a', '#8d6e63', '#78909c', '#ff8a65',
      '#a1c181', '#ffd54f', '#81c784', '#64b5f6', '#f06292'
    ];
    
    if (viewMode === 'assets') {
      // Modalità asset: visualizza ogni singolo asset
      const totalWeight = validAssets.reduce((sum, asset) => sum + Number(asset.weight), 0);
      let currentAngle = 0;
      
      return validAssets.map((asset, index) => {
        const percentage = (Number(asset.weight) / totalWeight) * 100;
        const angle = (percentage / 100) * 360;
        const color = colors[index % colors.length];
        
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;
        
        return {
          ticker: asset.ticker,
          name: asset.name || asset.ticker,
          weight: Number(asset.weight),
          percentage: percentage,
          startAngle,
          endAngle,
          color,
          currency: getCurrency(asset.ticker),
          assets: [asset] // Per mostrare nel tooltip
        };
      });
    } else if (viewMode === 'currency') {
      // Modalità valuta: raggruppa per valuta
      const currencyGroups = {};
      
      validAssets.forEach(asset => {
        const currency = getCurrency(asset.ticker);
        if (!currencyGroups[currency]) {
          currencyGroups[currency] = {
            currency,
            totalWeight: 0,
            assets: []
          };
        }
        currencyGroups[currency].totalWeight += Number(asset.weight);
        currencyGroups[currency].assets.push(asset);
      });
      
      const totalWeight = Object.values(currencyGroups).reduce((sum, group) => sum + group.totalWeight, 0);
      let currentAngle = 0;
      
      // Colori e nomi per le valute
      const currencyInfo = {
        'EUR': { name: 'Euro (€)', color: '#66bb6a' },       // Verde
        'USD': { name: 'Dollaro USA ($)', color: '#42a5f5' }, // Blu
        'GBP': { name: 'Sterlina (£)', color: '#ff9800' },    // Arancione
        'CHF': { name: 'Franco Svizzero (CHF)', color: '#9c27b0' }, // Viola
        'JPY': { name: 'Yen (¥)', color: '#f44336' },        // Rosso
        'CAD': { name: 'Dollaro Canadese (C$)', color: '#4caf50' }, // Verde scuro
        'AUD': { name: 'Dollaro Australiano (A$)', color: '#ff5722' }, // Arancione rosso
        'SEK': { name: 'Corona Svedese (SEK)', color: '#795548' }, // Marrone
        'NOK': { name: 'Corona Norvegese (NOK)', color: '#607d8b' }, // Blu-grigio
        'DKK': { name: 'Corona Danese (DKK)', color: '#e91e63' }, // Rosa
        'HKD': { name: 'Dollaro Hong Kong (HK$)', color: '#009688' }, // Teal
        'SGD': { name: 'Dollaro Singapore (S$)', color: '#3f51b5' }, // Indigo
        'KRW': { name: 'Won Coreano (₩)', color: '#cddc39' }, // Lime
        'TWD': { name: 'Dollaro Taiwan (NT$)', color: '#ffc107' }, // Ambra
        'CNY': { name: 'Yuan Cinese (¥)', color: '#8bc34a' }, // Verde chiaro
        'INR': { name: 'Rupia Indiana (₹)', color: '#ff6f00' }, // Arancione scuro
        'BRL': { name: 'Real Brasiliano (R$)', color: '#388e3c' }, // Verde
      };

      return Object.values(currencyGroups).map((group, index) => {
        const percentage = (group.totalWeight / totalWeight) * 100;
        const angle = (percentage / 100) * 360;
        const currInfo = currencyInfo[group.currency] || { name: group.currency, color: '#757575' };
        
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;
        
        return {
          ticker: group.currency,
          name: currInfo.name,
          weight: group.totalWeight,
          percentage: percentage,
          startAngle,
          endAngle,
          color: currInfo.color,
          currency: group.currency,
          assets: group.assets
        };
      });
    } else {
      // Modalità geografia: raggruppa per regione geografica
      const geographyGroups = {};
      
      validAssets.forEach(asset => {
        // Usa la cache o il fallback se non disponibile
        const region = geoCache[asset.ticker] || getGeographyFallback(asset.ticker);
        if (!geographyGroups[region]) {
          geographyGroups[region] = {
            region,
            totalWeight: 0,
            assets: []
          };
        }
        geographyGroups[region].totalWeight += Number(asset.weight);
        geographyGroups[region].assets.push(asset);
      });
      
      // Colori per le regioni
      const regionColors = {
        'Nord America': '#1e88e5',        // Blu
        'Europa': '#66bb6a',              // Verde
        'Asia-Pacifico': '#ff9800',       // Arancione
        'Mercati Emergenti': '#9c27b0',   // Viola
        'Sud America': '#e91e63',         // Rosa/Magenta
        'Africa': '#795548',              // Marrone
        'Medio Oriente': '#607d8b',       // Blu-grigio
        'Altri': '#757575'                // Grigio
      };
      
      const totalWeight = Object.values(geographyGroups).reduce((sum, group) => sum + group.totalWeight, 0);
      let currentAngle = 0;
      
      return Object.values(geographyGroups).map((group, index) => {
        const percentage = (group.totalWeight / totalWeight) * 100;
        const angle = (percentage / 100) * 360;
        const color = regionColors[group.region] || '#757575';
        
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;
        
        return {
          ticker: group.region,
          name: group.region,
          weight: group.totalWeight,
          percentage: percentage,
          startAngle,
          endAngle,
          color,
          region: group.region,
          assets: group.assets
        };
      });
    }
  }, [assets, viewMode, geoCache]);

  // Gestione hover e click
  const handleSliceMouseEnter = (slice, event) => {
    setHoveredSlice(slice.ticker);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      data: slice
    });
  };

  const handleSliceMouseLeave = () => {
    setHoveredSlice(null);
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  };

  const handleSliceMouseMove = (event) => {
    if (tooltip.visible) {
      setTooltip(prev => ({
        ...prev,
        x: event.clientX,
        y: event.clientY
      }));
    }
  };

  // Funzione per creare il path SVG per ogni settore
  const createPieSlice = (slice, centerX, centerY, radius) => {
    const { startAngle, endAngle, color, ticker } = slice;
    const isHovered = hoveredSlice === ticker;
    
    // Calcola il raggio con effetto hover
    const currentRadius = isHovered ? radius * 1.05 : radius;
    
    // Caso speciale: se la fetta occupa l'intero cerchio (360 gradi)
    if (endAngle - startAngle >= 360) {
      return (
        <circle
          key={ticker}
          cx={centerX}
          cy={centerY}
          r={currentRadius}
          fill={color}
          stroke={isHovered ? '#fff' : '#1a1a1a'}
          strokeWidth={isHovered ? 2 : 1}
          style={{
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
          }}
          className="pie-slice"
          onMouseEnter={(e) => handleSliceMouseEnter(slice, e)}
          onMouseLeave={handleSliceMouseLeave}
          onMouseMove={handleSliceMouseMove}
        />
      );
    }
    
    const startAngleRad = (startAngle - 90) * Math.PI / 180;
    const endAngleRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = centerX + currentRadius * Math.cos(startAngleRad);
    const y1 = centerY + currentRadius * Math.sin(startAngleRad);
    const x2 = centerX + currentRadius * Math.cos(endAngleRad);
    const y2 = centerY + currentRadius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${currentRadius} ${currentRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return (
      <path
        key={ticker}
        d={pathData}
        fill={color}
        stroke={isHovered ? '#fff' : '#1a1a1a'}
        strokeWidth={isHovered ? 2 : 1}
        style={{
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
        }}
        className="pie-slice"
        onMouseEnter={(e) => handleSliceMouseEnter(slice, e)}
        onMouseLeave={handleSliceMouseLeave}
        onMouseMove={handleSliceMouseMove}
      />
    );
  };

  if (!pieData || pieData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: size,
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#999'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📊</div>
          <div>Nessun dato disponibile</div>
        </div>
      </div>
    );
  }

  const radius = (size - 40) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.05) 0%, rgba(30, 136, 229, 0.1) 100%)',
      border: '2px solid rgba(30, 136, 229, 0.3)',
      borderRadius: 12,
      padding: 20,
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <h3 style={{
        color: '#fff',
        margin: '0 0 15px 0',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        🥧 {title}
      </h3>
      
      {/* Pulsanti per switchare modalità */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setViewMode('assets')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: viewMode === 'assets' ? '#66bb6a' : 'rgba(255, 255, 255, 0.1)',
            color: viewMode === 'assets' ? '#fff' : '#ccc',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📊 Per Asset
        </button>
        <button
          onClick={() => setViewMode('currency')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: viewMode === 'currency' ? '#66bb6a' : 'rgba(255, 255, 255, 0.1)',
            color: viewMode === 'currency' ? '#fff' : '#ccc',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          💱 Per Valuta
        </button>
        <button
          onClick={() => setViewMode('geography')}
          disabled={geoLoading}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: viewMode === 'geography' ? '#66bb6a' : 'rgba(255, 255, 255, 0.1)',
            color: viewMode === 'geography' ? '#fff' : '#ccc',
            fontSize: '12px',
            fontWeight: '600',
            cursor: geoLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: geoLoading ? 0.6 : 1
          }}
        >
          {geoLoading ? '⏳ Caricamento...' : '🌍 Per Geografia'}
        </button>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 30,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Grafico SVG */}
        <div style={{ position: 'relative' }}>
          <svg width={size} height={size} style={{ display: 'block' }}>
            {pieData.map((slice) => 
              createPieSlice(slice, centerX, centerY, radius)
            )}
            
            {/* Cerchio centrale per effetto donut */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius * 0.4}
              fill="#1a1a1a"
              stroke="rgba(102, 187, 106, 0.3)"
              strokeWidth="2"
            />
            
            {/* Testo centrale */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              fill="#66bb6a"
              fontSize="14"
              fontWeight="600"
            >
              Portfolio
            </text>
            <text
              x={centerX}
              y={centerY + 12}
              textAnchor="middle"
              fill="#999"
              fontSize="12"
            >
              {pieData.length} asset{pieData.length !== 1 ? 's' : ''}
            </text>
          </svg>
        </div>

        {/* Legenda */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 200
        }}>
          <div style={{
            color: '#bdbdbd',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: 8
          }}>
            Allocazione
          </div>
          
          {pieData.map((slice, index) => {
            const isHovered = hoveredSlice === slice.ticker;
            
            return (
            <div
              key={slice.ticker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: isHovered ? `${slice.color}15` : 'rgba(0, 0, 0, 0.2)',
                borderRadius: 8,
                border: `1px solid ${slice.color}30`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
              }}
              onMouseEnter={(e) => {
                setHoveredSlice(slice.ticker);
              }}
              onMouseLeave={(e) => {
                setHoveredSlice(null);
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: slice.color,
                  flexShrink: 0,
                  border: '2px solid #1a1a1a'
                }}
              />
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {slice.ticker}
                </div>
                <div style={{
                  color: '#999',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {slice.name}
                </div>
              </div>
              
              <div style={{
                color: slice.color,
                fontSize: 16,
                fontWeight: 700,
                textAlign: 'right'
              }}>
                {slice.percentage.toFixed(1)}%
              </div>
            </div>
          );
          })}
          
          {/* Totale */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            background: 'rgba(102, 187, 106, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(102, 187, 106, 0.3)',
            marginTop: 8
          }}>
            <span style={{ color: '#66bb6a', fontWeight: 600 }}>
              Totale
            </span>
            <span style={{ color: '#66bb6a', fontWeight: 700, fontSize: 16 }}>
              100.0%
            </span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y - 60,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 14,
            border: `2px solid ${tooltip.data.color}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            pointerEvents: 'none',
            minWidth: 180
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 6, color: tooltip.data.color }}>
            {tooltip.data.ticker}
          </div>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 8 }}>
            {tooltip.data.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Peso:</span>
            <span style={{ fontWeight: 'bold', color: tooltip.data.color }}>
              {tooltip.data.percentage.toFixed(1)}%
            </span>
          </div>
          
          {/* Mostra asset inclusi nella modalità valuta */}
          {viewMode === 'currency' && tooltip.data.assets && tooltip.data.assets.length > 1 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #333' }}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Asset inclusi:</div>
              {tooltip.data.assets.map((asset, index) => (
                <div key={index} style={{ fontSize: 11, color: '#ccc' }}>
                  • {asset.ticker} ({((asset.weight / tooltip.data.weight) * 100).toFixed(1)}%)
                </div>
              ))}
            </div>
          )}
          
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
            Clicca per selezionare
          </div>
        </div>
      )}
    </div>
  );
}