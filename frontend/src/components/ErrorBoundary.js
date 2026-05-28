import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
          fontFamily: '"Inter", sans-serif',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', marginBottom: '12px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', marginBottom: '24px', lineHeight: '1.6' }}>
            A temporary runtime error occurred. This is usually caused by an unexpected response from the server.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}
          >
            Refresh System
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              marginTop: '40px',
              padding: '16px',
              background: '#F1F5F9',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#EF4444',
              textAlign: 'left',
              overflow: 'auto',
              maxWidth: '90vw'
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
