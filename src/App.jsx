import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import Spinner from './components/ui/Spinner.jsx';
import ErrorBoundary from './components/debug/ErrorBoundary.jsx';

// Lazy loading dei componenti delle pagine
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const BacktestPage = lazy(() => import('./pages/BacktestPage.jsx'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage.jsx'));
const UnifiedAnalysisPage = lazy(() => import('./pages/UnifiedAnalysisPage.jsx'));
const StockAnalysisPage = lazy(() => import('./pages/StockAnalysisPage.jsx')); // Yahoo Finance Stock Analysis
const NewsPage = lazy(() => import('./pages/NewsPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const BackendTestPage = lazy(() => import('./pages/BackendTestPage.jsx')); // Backend Connection Test

export default function App() {
  return (
    <Router>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)', 
        color: '#e6e6e6',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header />
        
        <main style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Suspense fallback={
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <Spinner />
              <div style={{ color: '#999', fontSize: '16px' }}>
                Caricamento pagina...
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/backtest" element={<BacktestPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/analysis" element={
                <ErrorBoundary>
                  <UnifiedAnalysisPage />
                </ErrorBoundary>
              } />
              <Route path="/stocks" element={<StockAnalysisPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/backend-test" element={<BackendTestPage />} />
              <Route path="/about" element={<AboutPage />} />
              {/* Fallback route per pagine non trovate */}
              <Route path="*" element={
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  <h1 style={{ 
                    color: '#66bb6a', 
                    fontSize: '48px',
                    margin: '0 0 20px 0'
                  }}>404</h1>
                  <h2 style={{ 
                    color: '#fff',
                    fontSize: '24px',
                    margin: '0 0 20px 0'
                  }}>Pagina non trovata</h2>
                  <p style={{ 
                    color: '#999',
                    fontSize: '16px',
                    lineHeight: 1.6,
                    margin: '0 0 30px 0'
                  }}>
                    La pagina che stai cercando non esiste o è stata spostata.
                  </p>
                  <a 
                    href="/" 
                    style={{
                      color: '#66bb6a',
                      textDecoration: 'none',
                      fontSize: '18px',
                      fontWeight: '500',
                      padding: '12px 24px',
                      border: '2px solid #66bb6a',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      display: 'inline-block'
                    }}
                  >
                    🏠 Torna alla Home
                  </a>
                </div>
              } />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
}