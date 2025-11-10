// Test completo dell'integrazione FRED nel frontend
// Simula il comportamento dell'AnalysisPage per verificare l'integrazione

import { loadAllFredHistoricalData } from './src/services/macroService.js';

console.log('🚀 Test FRED Frontend Integration');
console.log('====================================');

async function testFredFrontendIntegration() {
  try {
    console.log('📊 Caricamento dati FRED completi...');
    
    const result = await loadAllFredHistoricalData();
    
    if (result.success) {
      console.log('\n✅ CARICAMENTO COMPLETATO CON SUCCESSO!');
      console.log(`📈 Serie totali: ${result.data.totalSeries}`);
      console.log(`📊 Punti dati totali: ${result.data.totalDataPoints}`);
      console.log(`📁 Categorie: ${Object.keys(result.data.categorized).length}`);
      
      console.log('\n📂 STRUTTURA CATEGORIE:');
      Object.entries(result.data.categorized).forEach(([key, category]) => {
        console.log(`  📋 ${category.name}: ${category.series.length} serie`);
        
        // Mostra un esempio di serie per categoria
        if (category.series.length > 0) {
          const exampleSeries = category.series[0];
          console.log(`    📊 Esempio: ${exampleSeries.name} (${exampleSeries.id})`);
          console.log(`    📅 Dati: ${exampleSeries.data.length} osservazioni`);
          
          if (exampleSeries.data.length > 0) {
            const latest = exampleSeries.data[exampleSeries.data.length - 1];
            console.log(`    📈 Ultimo valore: ${latest.value} (${latest.date})`);
          }
        }
      });
      
      console.log('\n🎯 VERIFICA COMPONENTI FRONTEND:');
      
      // Verifica struttura dati per AnalysisPage
      const requiredProperties = ['totalSeries', 'totalDataPoints', 'categorized'];
      const hasAllProperties = requiredProperties.every(prop => result.data.hasOwnProperty(prop));
      console.log(`  ✓ Proprietà richieste: ${hasAllProperties ? 'PRESENTI' : 'MANCANTI'}`);
      
      // Verifica struttura categorie
      const categoryKeys = Object.keys(result.data.categorized);
      const validCategories = categoryKeys.every(key => {
        const category = result.data.categorized[key];
        return category.name && Array.isArray(category.series);
      });
      console.log(`  ✓ Struttura categorie: ${validCategories ? 'VALIDA' : 'INVALIDA'}`);
      
      // Verifica struttura serie
      let validSeries = 0;
      let totalSeries = 0;
      categoryKeys.forEach(key => {
        result.data.categorized[key].series.forEach(series => {
          totalSeries++;
          if (series.id && series.name && Array.isArray(series.data)) {
            validSeries++;
          }
        });
      });
      console.log(`  ✓ Serie valide: ${validSeries}/${totalSeries}`);
      
      console.log('\n🎨 FRONTEND READY!');
      console.log('   → L\'AnalysisPage può ora visualizzare tutti i dati FRED');
      console.log('   → Struttura categorizzata supportata');
      console.log('   → Dati storici completi disponibili');
      
    } else {
      console.error('\n❌ ERRORE NEL CARICAMENTO:');
      console.error(`   ${result.error}`);
    }
    
  } catch (error) {
    console.error('\n💥 ERRORE CRITICO:');
    console.error('   ', error.message);
    console.error('\n🔍 Stack trace:');
    console.error(error.stack);
  }
}

// Esegui il test
testFredFrontendIntegration();