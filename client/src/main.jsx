import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { CartProvider } from './context/CartContext'
import { LibraryProvider } from './context/LibraryContext'

// Error boundary for the entire app
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      // Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#e74c3c', marginBottom: '20px' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            We're sorry, but something unexpected happened.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3498db',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
          {import.meta.env.DEV && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error Details (Development)</summary>
              <pre style={{
                background: '#f8f8f8',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
                maxWidth: '80vw'
              }}>
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <CartProvider>
          <LibraryProvider>
            <App />
          </LibraryProvider>
        </CartProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
