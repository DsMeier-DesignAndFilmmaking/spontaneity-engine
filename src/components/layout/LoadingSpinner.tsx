/**
 * LoadingSpinner.tsx
 * Full-screen loading spinner component for authentication checks.
 * 
 * Provides a minimal, full-screen placeholder that blocks rendering
 * during authentication state initialization.
 */

import React from 'react';

/**
 * LoadingSpinner Component
 * 
 * Full-screen loading indicator used during authentication checks.
 * Blocks all rendering until auth state is confirmed.
 */
export default function LoadingSpinner() {
  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={spinnerStyle}></div>
        <p style={textStyle}>Loading...</p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f5f5f5',
  zIndex: 9999,
};

const contentStyle: React.CSSProperties = {
  textAlign: 'center',
};

const spinnerStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  border: '5px solid #e0e0e0',
  borderTop: '5px solid #667eea',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 1rem',
};

const textStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  color: '#666',
  margin: 0,
};

// Add spinner animation globally
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('spinner-keyframes');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'spinner-keyframes';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

