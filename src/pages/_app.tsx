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

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

