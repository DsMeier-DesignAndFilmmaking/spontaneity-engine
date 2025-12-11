/**
 * demo.tsx
 * Demo page with authentication gate.
 * 
 * Protected route that requires user authentication. Implements strict three-state
 * guard pattern with aggressive session stabilization delay (Final Defense).
 * 
 * Three-State Logic (Aggressive Stabilization):
 * 1. LOADING: Render LoadingSpinner and do nothing else (block all rendering)
 * 2. LOGGED_OUT: Execute router.replace('/') for hard redirect
 * 3. LOGGED_IN: Implement 100ms stabilization delay before rendering DeveloperSandbox
 *    - This is the final defense against session being read too quickly
 *    - Ensures browser has fully processed session cookie before rendering
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
   * State 2: LOGGED_OUT - Execute Redirect
   * 
   * If authStatus === 'LOGGED_OUT': Execute router.replace('/') for hard redirect.
   * This useEffect ONLY executes when authStatus is definitively 'LOGGED_OUT',
   * NOT during 'LOADING' state. Uses router.replace() to prevent back-button
   * navigation to protected pages.
   */
  useEffect(() => {
    // CRITICAL: Only redirect when status is confirmed LOGGED_OUT
    // This check ensures we never redirect during LOADING state
    if (authStatus === 'LOGGED_OUT') {
      router.replace('/');
    }
  }, [authStatus, router]);

  /**
   * State 3: LOGGED_IN - Aggressive Session Stabilization Delay (Final Defense)
   * 
   * If authStatus === 'LOGGED_IN': Implement a 100ms stabilization delay before
   * rendering the main DeveloperSandbox (DemoWidget).
   * 
   * This is the final defense against the session being read too quickly before
   * the cookie fully loads. The delay ensures the browser has fully processed
   * the session state and cookie before rendering protected content, preventing
   * race conditions and snap-back issues.
   */
  useEffect(() => {
    // Only apply delay if user is confirmed LOGGED_IN with a valid session
    if (authStatus === 'LOGGED_IN' && session) {
      // Reset sessionReady to false when status changes to LOGGED_IN
      setSessionReady(false);
      
      // Aggressive 100ms delay: Final defense to ensure browser has fully processed session cookie
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
   * State 1: LOADING - Block All Rendering
   * 
   * If authStatus === 'LOADING': Render LoadingSpinner and do nothing else.
   * No routing or redirect logic executes in this state. The component blocks
   * all rendering until Supabase has definitively confirmed the session status.
   */
  if (authStatus === 'LOADING') {
    return <LoadingSpinner />;
  }

  /**
   * State 3: LOGGED_IN - Render DeveloperSandbox (After Stabilization)
   * 
   * If authStatus === 'LOGGED_IN': Render the main DeveloperSandbox (DemoWidget)
   * component ONLY after the 100ms stabilization delay has completed.
   * 
   * Requirements before rendering:
   * 1. authStatus is 'LOGGED_IN' (confirmed by Supabase)
   * 2. session exists (valid session object)
   * 3. sessionReady is true (100ms delay has completed - final defense)
   * 
   * The sessionReady check ensures the browser has fully processed the session
   * cookie before rendering, preventing race conditions and snap-back issues.
   * This is the final defense against the session being read too quickly.
   */
  if (authStatus === 'LOGGED_IN' && session && sessionReady) {
    return (
      <div style={demoStyles.container}>
        <DemoWidget />
      </div>
    );
  }

  /**
   * State 3 (Waiting): Show LoadingSpinner During Stabilization Delay
   * 
   * If authStatus is LOGGED_IN but sessionReady is false, we're in the
   * 100ms stabilization delay window. Show loading spinner during this time
   * to prevent any rendering before the session cookie is fully processed.
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

