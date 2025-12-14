/**
 * _app.tsx
 * Next.js App Component - Root component for all pages.
 * 
 * This component wraps all pages in the application and can be used
 * for global styles, providers, and shared layout components.
 */

import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { AuthProvider } from '@/stores/auth';
import { initializeAnalytics } from '@/lib/analytics/trackEvent';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  // Initialize analytics on app mount
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Suppress known browser extension errors that are not actionable
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Suppress the common browser extension message channel error
      // This error occurs when extensions inject scripts and the message channel closes
      // before a response is received - it's not actionable and just creates noise
      if (
        event.message &&
        typeof event.message === 'string' &&
        (event.message.includes('message channel closed') ||
         event.message.includes('asynchronous response by returning true'))
      ) {
        event.preventDefault();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress the same error when it appears as an unhandled promise rejection
      if (
        event.reason &&
        typeof event.reason === 'object' &&
        'message' in event.reason &&
        typeof event.reason.message === 'string' &&
        (event.reason.message.includes('message channel closed') ||
         event.reason.message.includes('asynchronous response by returning true'))
      ) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

