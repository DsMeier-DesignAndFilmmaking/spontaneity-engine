/**
 * auth.tsx
 * Authentication state management store with three-state system.
 * 
 * Provides a reactive authentication state that prevents race conditions
 * by ensuring the app never renders "logged out" until Supabase definitively
 * confirms the session status.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, validateSupabaseConfig } from '@/lib/db/supabase';
import { Session, User } from '@supabase/supabase-js';
import { getFullUrl } from '@/lib/config/constants';

/**
 * Three-state authentication status values.
 * 
 * LOADING: Initial state - session check is in progress
 * LOGGED_IN: User is authenticated - session exists and is valid
 * LOGGED_OUT: User is not authenticated - session check complete, no session found
 */
export type AuthStatus = 'LOADING' | 'LOGGED_IN' | 'LOGGED_OUT';

/**
 * Authentication state interface
 */
export interface AuthState {
  /** Current authentication status (three-state) */
  authStatus: AuthStatus;
  /** Current Supabase session if authenticated */
  session: Session | null;
  /** Current user if authenticated */
  user: User | null;
  /** Whether the initial session check has completed */
  initialized: boolean;
}

/**
 * Authentication context interface
 */
interface AuthContextType extends AuthState {
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Refresh the session */
  refreshSession: () => Promise<void>;
  /** Sign in with Google OAuth */
  signInWithGoogle: () => Promise<void>;
}

/**
 * Default authentication state
 */
const defaultAuthState: AuthState = {
  authStatus: 'LOADING',
  session: null,
  user: null,
  initialized: false,
};

/**
 * Default context value
 */
const defaultContextValue: AuthContextType = {
  ...defaultAuthState,
  signOut: async () => {
    throw new Error('AuthContext not initialized');
  },
  refreshSession: async () => {
    throw new Error('AuthContext not initialized');
  },
  signInWithGoogle: async () => {
    throw new Error('AuthContext not initialized');
  },
};

/**
 * Authentication Context
 */
const AuthContext = createContext<AuthContextType>(defaultContextValue);

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Manages authentication state using Supabase's onAuthStateChange listener.
 * Ensures the state transitions from LOADING to either LOGGED_IN or LOGGED_OUT
 * only after Supabase has definitively confirmed the session status.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  /**
   * Update authentication state based on session
   */
  const updateAuthState = (session: Session | null) => {
    setAuthState({
      authStatus: session ? 'LOGGED_IN' : 'LOGGED_OUT',
      session,
      user: session?.user ?? null,
      initialized: true,
    });
  };

  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Validate Supabase configuration
    try {
      validateSupabaseConfig();
    } catch (error) {
      console.error('Supabase configuration invalid:', error);
      setAuthState({
        ...defaultAuthState,
        authStatus: 'LOGGED_OUT',
        initialized: true,
      });
      return;
    }

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting initial session:', error);
          updateAuthState(null);
          return;
        }

        // Set initial state based on session
        updateAuthState(session);
      })
      .catch((error) => {
        console.error('Unexpected error getting initial session:', error);
        updateAuthState(null);
      });

    /**
     * Listen for authentication state changes.
     * 
     * This listener fires:
     * 1. Immediately after getSession() completes
     * 2. When user signs in/out
     * 3. When session is refreshed
     * 4. When session expires
     * 
     * The listener ensures reactive updates to auth state across the app.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Update state immediately when auth state changes
      // This ensures the state is always in sync with Supabase
      updateAuthState(session);

      // Log state transitions for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth state changed:', {
          event: _event,
          hasSession: !!session,
          userId: session?.user?.id,
        });
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run once on mount

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      validateSupabaseConfig();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      // State will be updated automatically by onAuthStateChange listener
    } catch (error) {
      console.error('Unexpected error signing out:', error);
      throw error;
    }
  };

  /**
   * Refresh the current session
   */
  const refreshSession = async () => {
    try {
      validateSupabaseConfig();
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
      // State will be updated automatically by onAuthStateChange listener
      updateAuthState(session);
    } catch (error) {
      console.error('Unexpected error refreshing session:', error);
      throw error;
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
    try {
      validateSupabaseConfig();
      const redirectUrl = getFullUrl('/demo');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }
      // State will be updated automatically by onAuthStateChange listener after redirect
    } catch (error) {
      console.error('Unexpected error signing in with Google:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    signOut,
    refreshSession,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication state and methods
 * 
 * @returns Authentication context value
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * ```tsx
 * const { authStatus, session, user, signOut } = useAuth();
 * 
 * if (authStatus === 'LOADING') {
 *   return <LoadingSpinner />;
 * }
 * 
 * if (authStatus === 'LOGGED_OUT') {
 *   return <LoginPage />;
 * }
 * 
 * return <Dashboard user={user} />;
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === defaultContextValue && !context.initialized) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check if user is authenticated (convenience hook)
 * 
 * @returns true if user is logged in, false otherwise
 */
export function useIsAuthenticated(): boolean {
  const { authStatus } = useAuth();
  return authStatus === 'LOGGED_IN';
}

/**
 * Hook to check if auth is still loading (convenience hook)
 * 
 * @returns true if auth status is still loading, false otherwise
 */
export function useAuthLoading(): boolean {
  const { authStatus } = useAuth();
  return authStatus === 'LOADING';
}

