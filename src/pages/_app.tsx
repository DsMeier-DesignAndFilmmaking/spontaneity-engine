/**
 * _app.tsx
 * Next.js App Component - Root component for all pages.
 * 
 * This component wraps all pages in the application and can be used
 * for global styles, providers, and shared layout components.
 */

import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

