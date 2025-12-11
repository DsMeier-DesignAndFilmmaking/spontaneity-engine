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

import React, { useEffect } from 'react';
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
   * Render Workbench (Only When Confirmed)
   * 
   * If authStatus is 'LOGGED_IN', proceed to render the DeveloperSandbox
   * (DemoWidget) component. This only happens after Supabase has confirmed
   * the user is authenticated, preventing premature rendering.
   */
  if (authStatus === 'LOGGED_IN' && session) {
    return (
      <div style={demoStyles.container}>
        <DemoWidget />
      </div>
    );
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

