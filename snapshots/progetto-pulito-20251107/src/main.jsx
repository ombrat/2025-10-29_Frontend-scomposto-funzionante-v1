import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

// Proteggiamo side-effects: eseguiamo solo in ambiente browser
if (typeof document !== 'undefined') {
  // Caricamento sicuro di font e stili globali (solo se non già presenti)
  const loadRobotoAndGlobals = () => {
    const fontId = 'roboto-font'
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link')
      link.id = fontId
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap'
      document.head.appendChild(link)
    }

    const styleId = 'app-global-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #070707;
          color: #e0e0e0;
          font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        * { box-sizing: border-box; }
        img, svg { max-width: 100%; height: auto; display: block; }
      `
      document.head.appendChild(style)
    }
  }

  loadRobotoAndGlobals()

  // Assicuriamoci che l'elemento root esista prima di creare la root di React
  const rootEl = document.getElementById('root')
  if (rootEl) {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  } else {
    // fallback utile per debugging in ambienti particolari
    console.warn('React root element not found: #root')
  }
}

// NOTA: registra service worker SOLO in production, se presente nel progetto:
// if (typeof navigator !== 'undefined' && process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/sw.js').catch(() => {})
// }