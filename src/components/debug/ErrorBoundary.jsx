import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log error to an external service here
    console.error('ErrorBoundary caught an error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ color: '#ef5350' }}>Si è verificato un errore nella pagina</h2>
          <p style={{ color: '#999' }}>Riprova a ricaricare la pagina o contatta il team di sviluppo.</p>
          <details style={{ textAlign: 'left', margin: '20px auto', maxWidth: 800 }}>
            <summary>Dettagli errore</summary>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#333', background: '#fff', padding: 12, borderRadius: 6 }}>
              {this.state.error && this.state.error.toString()}
              {this.state.info?.componentStack}
            </pre>
          </details>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: '#66bb6a', color: '#fff', border: 'none' }}>Ricarica</button>
        </div>
      );
    }

    return this.props.children;
  }
}
