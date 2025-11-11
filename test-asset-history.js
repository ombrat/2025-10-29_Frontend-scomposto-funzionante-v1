/**
 * Script di test per verificare il caricamento dati asset tramite endpoint backtest
 */

const BASE_URL = 'https://backtest-server-final-453907803757.europe-west3.run.app/api';

async function testAssetHistory() {
  console.log('🧪 Test Asset History via Backtest API\n');
  
  const testCases = [
    { ticker: 'AAPL', name: 'Apple' },
    { ticker: 'SPY', name: 'S&P 500 ETF' }
  ];

  for (const test of testCases) {
    console.log(`📊 Testing ${test.name} (${test.ticker})...`);
    
    try {
      const payload = {
        assets: [{ 
          ticker: test.ticker, 
          weight: 1.0, 
          entry_fee_percent: 0, 
          annual_fee_percent: 0 
        }],
        initial_investment: 10000,
        annual_contribution: 0,
        contribution_frequency: 'none',
        start_date: '2023-01-01',
        end_date: '2024-01-01',
        optimization_target: ''
      };
      
      const url = `${BASE_URL}/backtest`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`   Response: ${text.substring(0, 200)}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.log(`   ❌ API Error: ${data.error}`);
        continue;
      }
      
      if (data.individual_assets && Array.isArray(data.individual_assets)) {
        const asset = data.individual_assets[0];
        console.log(`   ✅ Success with individual_assets!`);
        console.log(`   Ticker: ${asset.ticker}`);
        console.log(`   Daily data points: ${asset.daily?.length || 0}`);
        if (asset.daily && asset.daily.length > 0) {
          console.log(`   Sample data:`, asset.daily[0]);
          console.log(`   Last data:`, asset.daily[asset.daily.length - 1]);
        }
      } else if (data.chart_data && Array.isArray(data.chart_data)) {
        console.log(`   ✅ Success with chart_data!`);
        console.log(`   Chart data points: ${data.chart_data.length}`);
        if (data.chart_data.length > 0) {
          console.log(`   Sample data:`, data.chart_data[0]);
          console.log(`   Last data:`, data.chart_data[data.chart_data.length - 1]);
        }
        console.log(`   Summary:`, data.summary);
      } else {
        console.log(`   ⚠️  Unexpected response structure:`, Object.keys(data));
        console.log(`   Full data:`, JSON.stringify(data, null, 2).substring(0, 500));
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Esegui il test
testAssetHistory().catch(console.error);
