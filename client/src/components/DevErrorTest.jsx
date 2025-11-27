import React, { useState } from 'react';
import { captureException, captureMessage } from '../lib/sentry';

/**
 * DevErrorTest - Component for testing error monitoring
 * Only rendered in development mode
 */
export default function DevErrorTest() {
  const [showPanel, setShowPanel] = useState(false);

  if (import.meta.env.PROD) {
    return null;
  }

  const testFrontendError = () => {
    try {
      throw new Error('Test Frontend Error - This is a test error for Sentry monitoring');
    } catch (error) {
      captureException(error, {
        test: true,
        source: 'DevErrorTest',
        timestamp: new Date().toISOString()
      });
      alert('Test error sent to Sentry! Check console and Sentry dashboard.');
    }
  };

  const testFrontendMessage = () => {
    captureMessage('Test Frontend Message', 'info', {
      test: true,
      source: 'DevErrorTest',
      timestamp: new Date().toISOString()
    });
    alert('Test message sent to Sentry! Check console and Sentry dashboard.');
  };

  const testUncaughtError = () => {
    // This will trigger the ErrorBoundary
    throw new Error('Test Uncaught Error - This should be caught by ErrorBoundary');
  };

  const testBackendError = async () => {
    try {
      const response = await fetch('/api/test-error', {
        method: 'POST'
      });
      
      if (!response.ok) {
        alert('Backend error triggered! Check server logs and Sentry.');
      }
    } catch (error) {
      alert('Failed to trigger backend error: ' + error.message);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Test Error Monitoring"
      >
        🐛
      </button>

      {/* Test Panel */}
      {showPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            zIndex: 9998,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            maxWidth: '300px'
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
            Error Monitoring Tests
          </h3>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            Development mode only
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={testFrontendError}
              style={{
                background: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Frontend Error
            </button>
            
            <button
              onClick={testFrontendMessage}
              style={{
                background: '#2ecc71',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Info Message
            </button>
            
            <button
              onClick={testUncaughtError}
              style={{
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Uncaught Error
            </button>
            
            <button
              onClick={testBackendError}
              style={{
                background: '#9b59b6',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Backend Error
            </button>
            
            <button
              onClick={() => setShowPanel(false)}
              style={{
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
