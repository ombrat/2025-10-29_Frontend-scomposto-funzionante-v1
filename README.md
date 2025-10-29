# Simulatore di Backtest Finanziario (Frontend)

Questa repo contiene il frontend (Vite + React) per il simulatore di backtest finanziario.

Struttura principale:
- public/ - file statici (index.html, svg ecc.)
- src/ - codice sorgente React (componenti, feature, api, styles)
- src/features/legacy/AppFull.jsx - versione "pesante" originale dell'app (non inclusa qui)

Setup:
1. Installa dipendenze:
   - npm install

2. Avvia in modalità sviluppo:
   - npm run dev

3. Build di produzione:
   - npm run build
   - npm run preview per servire la build localmente

Note:
- L'API base è impostata in `src/api/api.js` (variabile BASE_URL). Se usi un backend differente, aggiorna quella variabile o usa una variabile d'ambiente.
- Il file `src/features/legacy/AppFull.jsx` non è incluso in questi stub: copia la tua versione originale in `src/features/legacy/AppFull.jsx` per mantenere tutta la logica e il comportamento precedente.

Hai bisogno che generi anche i file direttamente nella tua repository su GitHub o preferisci incollare i file manualmente? Se vuoi posso preparare una patch o un branch con tutti i file.