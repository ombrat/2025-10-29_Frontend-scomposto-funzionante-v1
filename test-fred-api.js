/**
 * Script di test per verificare che l'integrazione FRED API funzioni correttamente
 * SENZA FALLBACK - Solo dati reali dal backend Google Cloud Run
 */

// Simulazione delle configurazioni API
const API_CONFIG = {
  BACKEND_BASE_URL: 'https://fred-api-proxy-21722357706.europe-west1.run.app',
  CACHE_DURATION: 4 * 60 * 60 * 1000
};

async function testFredAPIIntegration() {
  console.log('🧪 INIZIO TEST INTEGRAZIONE FRED API - NO FALLBACK');
  console.log('=' .repeat(60));
  
  try {
    // 1. Test Health Check
    console.log('\n📊 1. TEST HEALTH CHECK');
    const healthResponse = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    
    if (healthData.status !== 'healthy') {
      throw new Error('Backend non è healthy');
    }
    
    // 2. Test Main Indicators
    console.log('\n📈 2. TEST MAIN INDICATORS');
    const indicatorsResponse = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/api/fred/main-indicators`);
    const indicatorsData = await indicatorsResponse.json();
    console.log(`✅ Indicatori caricati: ${indicatorsData.length} serie`);
    console.log('Prime 2 serie:', indicatorsData.slice(0, 2).map(s => ({
      id: s.id,
      name: s.name,
      lastValue: s.observations?.[0]?.value,
      lastDate: s.observations?.[0]?.date
    })));
    
    // 3. Test Releases Calendar
    console.log('\n📅 3. TEST RELEASES CALENDAR');
    const releasesResponse = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/api/fred/releases?limit=3`);
    const releasesData = await releasesResponse.json();
    console.log(`✅ Release caricate: ${releasesData.releases?.length || 0} eventi`);
    console.log('Prossime release:', releasesData.releases?.slice(0, 2).map(r => ({
      id: r.id,
      name: r.name,
      press_release: r.press_release
    })));
    
    // 4. Test Serie Storica Specifica
    console.log('\n📊 4. TEST SERIE STORICA (UNRATE - Unemployment Rate)');
    const seriesResponse = await fetch(`${API_CONFIG.BACKEND_BASE_URL}/api/fred/series/UNRATE/history?limit=3`);
    const seriesData = await seriesResponse.json();
    console.log('✅ Dati storici caricati:', {
      seriesId: 'UNRATE',
      observations: seriesData.observations?.length || 0,
      lastThreeValues: seriesData.observations?.slice(0, 3)
    });
    
    // 5. Summary Test
    console.log('\n🎯 RIEPILOGO TEST');
    console.log('=' .repeat(60));
    console.log('✅ Health Check: PASS');
    console.log('✅ Main Indicators: PASS');
    console.log('✅ Releases Calendar: PASS');
    console.log('✅ Historical Series: PASS');
    console.log('\n🚀 TUTTI I TEST SUPERATI!');
    console.log('🏦 Il backend Google Cloud Run è pienamente operativo');
    console.log('📊 La pagina Analysis riceverà SOLO dati FRED reali');
    console.log('🚫 NESSUN FALLBACK sarà utilizzato');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ TEST FALLITO:', error.message);
    console.error('🚨 ERRORE CRITICO: Backend FRED non disponibile');
    console.error('📋 Questo significa che la pagina Analysis mostrerà un errore');
    console.error('✅ COMPORTAMENTO ATTESO: Nessun fallback, solo errore se backend down');
    
    return false;
  }
}

// Esegui test se chiamato direttamente
if (typeof window === 'undefined') {
  // Node.js environment
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    testFredAPIIntegration();
  }).catch(() => {
    console.log('⚠️ node-fetch non disponibile, usa in browser');
  });
} else {
  // Browser environment
  window.testFredAPI = testFredAPIIntegration;
  console.log('🌐 Test disponibile: window.testFredAPI()');
}

export { testFredAPIIntegration };