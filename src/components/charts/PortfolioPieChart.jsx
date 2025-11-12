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

  // Effetto per pre-caricare dati geografici
  useEffect(() => {
    if (assets && assets.length > 0) {
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
  }, [assets]);

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

  // Calcola i dati per tutti e tre i grafici
  const pieDataSets = useMemo(() => {
    if (!assets || !Array.isArray(assets)) return { assets: [], currency: [], geography: [] };
    
    // Filtra solo gli asset con peso > 0
    const validAssets = assets.filter(asset => Number(asset.weight) > 0);
    
    if (validAssets.length === 0) return { assets: [], currency: [], geography: [] };
    
    // Palette moderna ed elegante con contrasto
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
      '#14b8a6', '#eab308', '#f43f5e', '#a855f7', '#22d3ee',
      '#65a30d', '#dc2626', '#7c3aed', '#059669', '#d97706'
    ];
    
    // 1. Dati per grafico Asset
    const totalWeight = validAssets.reduce((sum, asset) => sum + Number(asset.weight), 0);
    let currentAngle = 0;
    
    const assetsData = validAssets.map((asset, index) => {
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
        assets: [asset]
      };
    });
    
    // 2. Dati per grafico Valuta
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
    
    const currencyInfo = {
      'EUR': { name: 'Euro', color: '#3b82f6' },        // Blu moderno
      'USD': { name: 'Dollaro USA', color: '#10b981' },  // Verde smeraldo
      'GBP': { name: 'Sterlina', color: '#f59e0b' },     // Ambra elegante
      'CHF': { name: 'Franco Svizzero', color: '#ef4444' }, // Rosso vivace
      'JPY': { name: 'Yen', color: '#8b5cf6' },          // Viola moderno
      'CAD': { name: 'Dollaro Canadese', color: '#06b6d4' }, // Ciano
      'AUD': { name: 'Dollaro Australiano', color: '#84cc16' }, // Verde lime
      'SEK': { name: 'Corona Svedese', color: '#f97316' }, // Arancione
      'NOK': { name: 'Corona Norvegese', color: '#ec4899' }, // Rosa magenta
      'DKK': { name: 'Corona Danese', color: '#6366f1' },   // Indaco
      'HKD': { name: 'Dollaro Hong Kong', color: '#14b8a6' }, // Teal
      'SGD': { name: 'Dollaro Singapore', color: '#eab308' }, // Giallo
      'KRW': { name: 'Won Coreano', color: '#f43f5e' },     // Rosa
      'TWD': { name: 'Dollaro Taiwan', color: '#a855f7' },   // Viola chiaro
      'CNY': { name: 'Yuan Cinese', color: '#22d3ee' },     // Ciano chiaro
      'INR': { name: 'Rupia Indiana', color: '#65a30d' },   // Verde oliva
      'BRL': { name: 'Real Brasiliano', color: '#dc2626' }, // Rosso scuro
    };

    currentAngle = 0;
    const currencyData = Object.values(currencyGroups).map((group, index) => {
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
    
    // 3. Dati per grafico Geografia
    const geographyGroups = {};
    
    validAssets.forEach(asset => {
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
    
    const regionColors = {
      'Nord America': '#3b82f6',      // Blu principale - mercato dominante
      'Europa': '#10b981',            // Verde smeraldo - stabilità
      'Asia-Pacifico': '#f59e0b',     // Ambra - crescita dinamica
      'Mercati Emergenti': '#ef4444', // Rosso - volatilità/opportunità
      'Sud America': '#8b5cf6',       // Viola - diversificazione
      'Africa': '#06b6d4',            // Ciano - potenziale
      'Medio Oriente': '#f97316',     // Arancione - energia/risorse
      'Altri': '#6b7280'              // Grigio neutro
    };
    
    currentAngle = 0;
    const geographyData = Object.values(geographyGroups).map((group, index) => {
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
    
    return {
      assets: assetsData,
      currency: currencyData,
      geography: geographyData
    };
  }, [assets, geoCache]);

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

  // Funzione per renderizzare un singolo grafico completo
  const renderSingleChart = (pieData, chartTitle, chartSize = 280) => {
    if (!pieData || pieData.length === 0) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: chartSize + 40
        }}>
          <h4 style={{
            color: '#bdbdbd',
            margin: '0 0 15px 0',
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {chartTitle}
          </h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: chartSize,
            background: 'rgba(0, 0, 0, 0.15)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.03)',
            color: '#999'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 8, color: '#6b7280' }}>Nessun dato disponibile</div>
            </div>
          </div>
        </div>
      );
    }

    const radius = (chartSize - 40) / 2;
    const centerX = chartSize / 2;
    const centerY = chartSize / 2;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: chartSize + 40
      }}>
        <h4 style={{
          color: '#bdbdbd',
          margin: '0 0 15px 0',
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {chartTitle}
        </h4>
        
        <div style={{ position: 'relative' }}>
          <svg width={chartSize} height={chartSize} style={{ display: 'block' }}>
            {pieData.map((slice) => 
              createPieSlice(slice, centerX, centerY, radius)
            )}
            
            <circle
              cx={centerX}
              cy={centerY}
              r={radius * 0.4}
              fill="#1a1a1a"
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="1"
            />
            
            <text
              x={centerX}
              y={centerY - 2}
              textAnchor="middle"
              fill="#3b82f6"
              fontSize="11"
              fontWeight="600"
            >
              {pieData.length}
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="9"
            >
              {pieData.length === 1 ? 'elemento' : 'elementi'}
            </text>
          </svg>
        </div>

        {/* Legenda compatta */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          marginTop: 15,
          maxWidth: chartSize,
          maxHeight: 150,
          overflowY: 'auto'
        }}>
          {pieData.slice(0, 8).map((slice, index) => (
            <div
              key={slice.ticker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                background: 'rgba(0, 0, 0, 0.15)',
                borderRadius: 6,
                fontSize: 11,
                border: '1px solid rgba(255, 255, 255, 0.03)'
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: slice.color,
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#e6e6e6',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: 11
                }}>
                  {slice.ticker}
                </div>
              </div>
              <div style={{
                color: slice.color,
                fontSize: 11,
                fontWeight: 600
              }}>
                {slice.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
          {pieData.length > 8 && (
            <div style={{
              textAlign: 'center',
              color: '#6b7280',
              fontSize: 10,
              padding: '4px'
            }}>
              + {pieData.length - 8} altri
            </div>
          )}
        </div>
      </div>
    );
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
          stroke={isHovered ? '#f8fafc' : 'rgba(0, 0, 0, 0.2)'}
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
        stroke={isHovered ? '#f8fafc' : 'rgba(0, 0, 0, 0.2)'}
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

  if (!pieDataSets || (pieDataSets.assets.length === 0 && pieDataSets.currency.length === 0 && pieDataSets.geography.length === 0)) {
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
          <div style={{ fontSize: 16, color: '#6b7280' }}>Nessun dato disponibile</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: 0,
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <h3 style={{
        color: '#bdbdbd',
        margin: '0 0 25px 0',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </h3>
      
      {/* Contenitore per tutti e tre i grafici */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 40,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Grafico Per Asset */}
        {renderSingleChart(pieDataSets.assets, 'Per Asset', 340)}
        
        {/* Grafico Per Valuta */}
        {renderSingleChart(pieDataSets.currency, 'Per Valuta', 340)}
        
        {/* Grafico Per Geografia */}
        {geoLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 380
          }}>
            <h4 style={{
              color: '#bdbdbd',
              margin: '0 0 15px 0',
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Per Geografia
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 280,
              background: 'rgba(0, 0, 0, 0.15)',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.03)',
              color: '#999'
            }}>
              <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                Caricamento dati geografici...
              </div>
            </div>
          </div>
        ) : (
          renderSingleChart(pieDataSets.geography, 'Per Geografia', 340)
        )}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y - 60,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#e6e6e6',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 12,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            pointerEvents: 'none',
            minWidth: 150
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: tooltip.data.color }}>
            {tooltip.data.ticker}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>
            {tooltip.data.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11 }}>Peso:</span>
            <span style={{ fontWeight: 600, color: tooltip.data.color, fontSize: 11 }}>
              {tooltip.data.percentage.toFixed(1)}%
            </span>
          </div>
          
          {/* Mostra asset inclusi per valuta e geografia */}
          {tooltip.data.assets && tooltip.data.assets.length > 1 && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 3 }}>Asset inclusi:</div>
              {tooltip.data.assets.slice(0, 3).map((asset, index) => (
                <div key={index} style={{ fontSize: 10, color: '#9ca3af' }}>
                  {asset.ticker} ({((asset.weight / tooltip.data.weight) * 100).toFixed(1)}%)
                </div>
              ))}
              {tooltip.data.assets.length > 3 && (
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                  +{tooltip.data.assets.length - 3} altri
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}