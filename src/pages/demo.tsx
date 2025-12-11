/**
 * demo.tsx
 * Demo page with authentication gate.
 * 
 * Protected route that requires user authentication. Implements strict guard pattern
 * to prevent race conditions by blocking all rendering and redirects until Supabase
 * has definitively confirmed the session status.
 * 
 * Guard Pattern:
 * 1. BLOCK: If authStatus is 'LOADING', immediately return LoadingSpinner
 *    - No routing or redirect logic executes in this state
 * 2. REDIRECT: Only when authStatus transitions to 'LOGGED_OUT' (confirmed)
 *    - Use router.replace('/') to prevent back-button navigation
 * 3. RENDER: Only when authStatus is 'LOGGED_IN' (confirmed)
 *    - Render DeveloperSandbox (DemoWidget) component
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/stores/auth';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import DemoWidget from '@/components/demo/DemoWidget';

/**
 * Demo page component with strict authentication gate.
 * 
 * Component Lifecycle Sequence:
 * 1. Component mounts, authStatus is 'LOADING' (initial state)
 * 2. Return LoadingSpinner immediately - BLOCK all rendering
 * 3. Auth store completes Supabase session check
 * 4. authStatus transitions to either 'LOGGED_IN' or 'LOGGED_OUT'
 * 5. If 'LOGGED_OUT': useEffect executes router.replace('/')
 * 6. If 'LOGGED_IN': Component re-renders and renders DemoWidget
 * 
 * This structure guarantees the redirect decision is only made after
 * the asynchronous Supabase check is complete, eliminating jump-back flicker.
 */
export default function DemoPage() {
  const router = useRouter();
  const { authStatus, session } = useAuth();
  
  /**
   * Session stabilization delay state.
   * 
   * This state ensures the browser has fully processed the session cookie
   * before rendering the protected content. This is a final safety measure
   * to prevent race conditions and snap-back issues.
   */
  const [sessionReady, setSessionReady] = useState(false);

  /**
   * Enforce Redirect (Only When Confirmed)
   * 
   * This useEffect hook ONLY executes when authStatus is definitively 'LOGGED_OUT'.
   * It does NOT execute during 'LOADING' state, ensuring redirects only happen
   * after Supabase has confirmed the user is not authenticated.
   * 
   * Uses router.replace() instead of router.push() to prevent back-button
   * navigation to protected pages after logout.
   */
  useEffect(() => {
    // CRITICAL: Only redirect when status is confirmed LOGGED_OUT
    // This check ensures we never redirect during LOADING state
    if (authStatus === 'LOGGED_OUT') {
      router.replace('/');
    }
  }, [authStatus, router]);

  /**
   * Aggressive Session Stabilization Delay (Last Resort)
   * 
   * After the session is confirmed LOGGED_IN, wait 100 milliseconds before
   * allowing the component to fully render. This ensures the browser has
   * fully loaded and processed the session state, preventing race conditions
   * and snap-back issues.
   * 
   * This is a final safety measure that runs AFTER Supabase has confirmed
   * the session status, but BEFORE rendering the protected content.
   */
  useEffect(() => {
    // Only apply delay if user is confirmed LOGGED_IN with a valid session
    if (authStatus === 'LOGGED_IN' && session) {
      // Reset sessionReady to false when status changes to LOGGED_IN
      setSessionReady(false);
      
      // Aggressive delay: Wait 100ms to ensure browser has fully processed session
      const delayTimer = setTimeout(() => {
        setSessionReady(true);
      }, 100);

      // Cleanup timer on unmount or if status changes
      return () => {
        clearTimeout(delayTimer);
      };
    } else {
      // Reset sessionReady if not logged in
      setSessionReady(false);
    }
  }, [authStatus, session]);

  /**
   * Block Rendering During Load
   * 
   * If authStatus is 'LOADING', immediately return LoadingSpinner.
   * This prevents any routing or redirect logic from executing.
   * The component will not proceed to render DemoWidget or execute
   * redirect logic until the state is no longer 'LOADING'.
   */
  if (authStatus === 'LOADING') {
    return <LoadingSpinner />;
  }

  /**
   * Render Workbench (Only When Confirmed + Stabilized)
   * 
   * Render the DeveloperSandbox (DemoWidget) component only when:
   * 1. authStatus is 'LOGGED_IN' (confirmed by Supabase)
   * 2. session exists (valid session object)
   * 3. sessionReady is true (100ms delay has completed after session confirmation)
   * 
   * The sessionReady check ensures the browser has fully processed the session
   * cookie before rendering, preventing race conditions and snap-back issues.
   */
  if (authStatus === 'LOGGED_IN' && session && sessionReady) {
    return (
      <div style={demoStyles.container}>
        <DemoWidget />
      </div>
    );
  }

  /**
   * Show loading while waiting for session stabilization
   * 
   * If authStatus is LOGGED_IN but sessionReady is false, we're in the
   * 100ms stabilization delay window. Show loading spinner during this time.
   */
  if (authStatus === 'LOGGED_IN' && session && !sessionReady) {
    return <LoadingSpinner />;
  }

  /**
   * Fallback: LOGGED_OUT state
   * 
   * This should rarely be reached because the useEffect above will redirect.
   * Return null to render nothing while the redirect is processing.
   */
  return null;
}

const demoStyles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '2rem',
  },
};

