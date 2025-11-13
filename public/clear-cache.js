/**
 * 🧹 SCRIPT DI PULIZIA CACHE PORTFOLIOLAB
 * 
 * COPIA E INCOLLA QUESTO CODICE NELLA CONSOLE DEL BROWSER (F12)
 * per pulire tutte le cache vecchie e ricaricare la pagina con i 21 indicatori.
 * 
 * ISTRUZIONI:
 * 1. Apri Developer Tools (F12)
 * 2. Vai su "Console"
 * 3. Copia tutto il codice qui sotto
 * 4. Incolla nella console
 * 5. Premi INVIO
 * 
 * La pagina si ricaricherà automaticamente con TUTTI i 21 indicatori!
 */

(function() {
  console.log('🧹 PULIZIA CACHE PORTFOLIOLAB - AVVIO...\n');
  
  // Lista di tutte le chiavi di cache da rimuovere
  const cacheKeys = [
    'portfoliolab_ecb_cache_v1',
    'portfoliolab_ecb_cache_v2',
    'portfoliolab_eurostat_cache_v1',
    'portfoliolab_eurostat_cache_v2',
    'portfoliolab_macro_cache',
    'portfoliolab_fred_cache'
  ];
  
  let removedCount = 0;
  
  // Rimuovi ogni chiave
  cacheKeys.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      console.log(`✅ Rimossa: ${key}`);
      removedCount++;
    }
  });
  
  console.log(`\n📊 Totale cache rimosse: ${removedCount}`);
  
  if (removedCount > 0) {
    console.log('\n🔄 Ricaricamento pagina in 2 secondi...');
    console.log('📊 Aspettati 21 indicatori (10 ECB + 11 Eurostat)!\n');
    
    setTimeout(() => {
      location.reload();
    }, 2000);
  } else {
    console.log('\n✅ Nessuna cache da pulire - tutto pulito!');
    console.log('📊 Se vedi ancora 15 indicatori invece di 21:');
    console.log('   1. Prova un Hard Reload: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)');
    console.log('   2. Oppure ricarica manualmente la pagina\n');
  }
})();
