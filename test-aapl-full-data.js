/**
 * 🧪 Test per vedere TUTTI i dati disponibili per AAPL dal backend
 * 
 * Esegui: node test-aapl-full-data.js
 */

const BACKEND_URL = 'https://backtest-server-final-453907803757.europe-west3.run.app';

async function testAAPLData() {
  console.log('🔍 Recupero TUTTI i dati per AAPL dal backend...\n');

  try {
    const response = await fetch(`${BACKEND_URL}/api/ticker_info?ticker=AAPL`);
    
    if (!response.ok) {
      console.error('❌ Errore:', response.status, response.statusText);
      console.log('\n⚠️  Il backend non è ancora stato deployato con gli endpoint Yahoo Finance.');
      console.log('📝 Vedi: DEPLOY_YAHOO_FINANCE.md per le istruzioni di deploy.\n');
      return;
    }

    const data = await response.json();
    
    console.log('✅ Dati recuperati con successo!\n');
    console.log('📊 TOTALE CAMPI DISPONIBILI:', Object.keys(data).length);
    console.log('=' .repeat(80));
    
    // Organizza i dati per categoria
    const categories = {
      '💼 BILANCIO': [
        'totalAssets',
        'totalLiabilities', 
        'totalLiabilitiesNetMinorityInterest',
        'totalEquityGross',
        'stockholdersEquity',
        'tangibleBookValue',
        'netTangibleAssets',
        'workingCapital',
        'investedCapital',
        'totalDebt',
        'netDebt',
        'shortLongTermDebt',
        'shortTermDebt',
        'longTermDebt',
        'totalCurrentAssets',
        'totalNonCurrentAssets',
        'totalCurrentLiabilities',
        'totalNonCurrentLiabilitiesNetMinorityInterest',
        'cashAndCashEquivalents',
        'cash',
        'cashCashEquivalentsAndShortTermInvestments'
      ],
      
      '📊 CONTO ECONOMICO': [
        'totalRevenue',
        'revenuePerShare',
        'grossProfits',
        'grossMargins',
        'ebitda',
        'ebitdaMargins',
        'operatingRevenue',
        'operatingIncome',
        'operatingMargins',
        'netIncomeToCommon',
        'netIncome',
        'trailingEps',
        'forwardEps',
        'earningsGrowth',
        'earningsQuarterlyGrowth',
        'revenueGrowth',
        'revenueQuarterlyGrowth'
      ],
      
      '💰 CASH FLOW': [
        'operatingCashflow',
        'freeCashflow',
        'leveredFreeCashFlow',
        'financialCurrency',
        'totalCashPerShare',
        'totalCash'
      ],
      
      '📈 VALUTAZIONE': [
        'marketCap',
        'enterpriseValue',
        'enterpriseToRevenue',
        'enterpriseToEbitda',
        'priceToBook',
        'priceToSalesTrailing12Months',
        'forwardPE',
        'trailingPE',
        'pegRatio',
        'bookValue',
        'priceHint'
      ],
      
      '💸 DIVIDENDI': [
        'dividendRate',
        'dividendYield',
        'exDividendDate',
        'payoutRatio',
        'fiveYearAvgDividendYield',
        'trailingAnnualDividendRate',
        'trailingAnnualDividendYield',
        'lastDividendValue',
        'lastDividendDate'
      ],
      
      '📊 MARGINI E RENDIMENTI': [
        'profitMargins',
        'grossMargins',
        'operatingMargins',
        'returnOnAssets',
        'returnOnEquity',
        'currentRatio',
        'quickRatio',
        'debtToEquity'
      ],
      
      '🎯 STIME ANALISTI': [
        'targetHighPrice',
        'targetLowPrice',
        'targetMeanPrice',
        'targetMedianPrice',
        'recommendationKey',
        'recommendationMean',
        'numberOfAnalystOpinions',
        'earningsEstimate',
        'revenueEstimate'
      ],
      
      '📉 RISCHIO': [
        'beta',
        'beta3Year',
        'auditRisk',
        'boardRisk',
        'compensationRisk',
        'shareHolderRightsRisk',
        'overallRisk'
      ],
      
      '📊 AZIONI': [
        'sharesOutstanding',
        'floatShares',
        'impliedSharesOutstanding',
        'sharesShort',
        'sharesShortPriorMonth',
        'sharesShortPreviousMonthDate',
        'dateShortInterest',
        'sharesPercentSharesOut',
        'heldPercentInsiders',
        'heldPercentInstitutions',
        'shortRatio',
        'shortPercentOfFloat'
      ],
      
      '📅 DATE IMPORTANTI': [
        'lastFiscalYearEnd',
        'nextFiscalYearEnd',
        'mostRecentQuarter',
        'lastSplitDate',
        'lastSplitFactor',
        'exDividendDate',
        'lastDividendDate',
        'dateShortInterest',
        'earningsTimestamp',
        'earningsTimestampStart',
        'earningsTimestampEnd'
      ],
      
      '🏢 INFO AZIENDA': [
        'symbol',
        'shortName',
        'longName',
        'sector',
        'industry',
        'industryKey',
        'sectorKey',
        'website',
        'address1',
        'city',
        'state',
        'zip',
        'country',
        'phone',
        'longBusinessSummary',
        'fullTimeEmployees',
        'companyOfficers'
      ],
      
      '💹 TRADING': [
        'currentPrice',
        'regularMarketPrice',
        'regularMarketOpen',
        'regularMarketDayHigh',
        'regularMarketDayLow',
        'regularMarketVolume',
        'regularMarketPreviousClose',
        'bid',
        'ask',
        'bidSize',
        'askSize',
        'volume',
        'averageVolume',
        'averageVolume10days',
        'averageDailyVolume10Day',
        'fiftyTwoWeekLow',
        'fiftyTwoWeekHigh',
        'fiftyDayAverage',
        'twoHundredDayAverage'
      ]
    };

    // Mostra i dati per ogni categoria
    for (const [categoryName, fields] of Object.entries(categories)) {
      console.log('\n' + categoryName);
      console.log('-'.repeat(80));
      
      let foundCount = 0;
      for (const field of fields) {
        if (data[field] !== undefined && data[field] !== null) {
          console.log(`  ✓ ${field}: ${formatValue(data[field])}`);
          foundCount++;
        }
      }
      
      if (foundCount === 0) {
        console.log('  (Nessun dato disponibile in questa categoria)');
      } else {
        console.log(`  📊 ${foundCount}/${fields.length} campi disponibili`);
      }
    }

    // Mostra anche i campi non categorizzati
    console.log('\n🔍 ALTRI CAMPI DISPONIBILI');
    console.log('-'.repeat(80));
    const allCategorizedFields = Object.values(categories).flat();
    const otherFields = Object.keys(data).filter(key => !allCategorizedFields.includes(key));
    
    if (otherFields.length > 0) {
      console.log(`Trovati ${otherFields.length} campi aggiuntivi:`);
      otherFields.slice(0, 20).forEach(field => {
        console.log(`  • ${field}: ${formatValue(data[field])}`);
      });
      
      if (otherFields.length > 20) {
        console.log(`  ... e altri ${otherFields.length - 20} campi`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test completato!\n');
    
    // Salva i dati completi in un file JSON
    const fs = require('fs');
    fs.writeFileSync('aapl-full-data.json', JSON.stringify(data, null, 2));
    console.log('📁 Dati completi salvati in: aapl-full-data.json\n');

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    console.log('\n⚠️  Assicurati che:');
    console.log('1. Il backend sia deployato su Cloud Run');
    console.log('2. Gli endpoint /api/ticker_info siano attivi');
    console.log('3. La libreria yfinance sia installata nel backend\n');
  }
}

function formatValue(value) {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 100) + '...';
  if (typeof value === 'number') {
    if (value > 1000000000) return `$${(value / 1e9).toFixed(2)}B`;
    if (value > 1000000) return `$${(value / 1e6).toFixed(2)}M`;
    return value.toLocaleString();
  }
  return String(value).substring(0, 100);
}

// Esegui il test
testAAPLData();
