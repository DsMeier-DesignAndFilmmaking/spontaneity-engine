/**
 * DemoTabs.tsx
 * Tab switcher for demo modules - works on both mobile and desktop.
 * 
 * UI-only component - controls visibility, does not modify logic.
 * Implements proper ARIA attributes and keyboard navigation for accessibility.
 */

import React, { useRef, useEffect } from 'react';

export interface DemoTabsProps {
  activeTab: 'free' | 'advanced';
  onTabChange: (tab: 'free' | 'advanced') => void;
}

/**
 * DemoTabs component - Unified tab switcher for mobile and desktop.
 * 
 * UI-only: Controls visibility of modules, no logic changes.
 * Includes keyboard navigation and proper ARIA attributes.
 */
export default function DemoTabs({ activeTab, onTabChange }: DemoTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tabsRef.current) return;

      const tabs = Array.from(tabsRef.current.querySelectorAll('[role="tab"]')) as HTMLElement[];
      const currentIndex = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const targetTab = tabs[nextIndex];
      if (targetTab) {
        targetTab.focus();
        const tabId = targetTab.getAttribute('id');
        if (tabId === 'tab-free-demo') {
          onTabChange('free');
        } else if (tabId === 'tab-advanced-demo') {
          onTabChange('advanced');
        }
      }
    };

    const container = tabsRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [onTabChange]);

  return (
    <div
      style={styles.container}
      role="tablist"
      aria-label="Demo modules"
      ref={tabsRef}
      data-demo-tabs
    >
      <button
        type="button"
        id="tab-free-demo"
        onClick={() => onTabChange('free')}
        style={{
          ...styles.tab,
          ...(activeTab === 'free' ? styles.tabActive : {}),
        }}
        aria-selected={activeTab === 'free'}
        aria-controls="free-demo-panel"
        role="tab"
        tabIndex={activeTab === 'free' ? 0 : -1}
        aria-label="Try Instantly - No login required, start exploring instantly"
      >
        <span style={styles.tabLabel}>Try Instantly</span>
        <span style={{
          ...styles.tabSubtext,
          ...(activeTab === 'free' ? styles.tabSubtextActive : {}),
        }}>No login required, start exploring instantly</span>
      </button>
      <button
        type="button"
        id="tab-advanced-demo"
        onClick={() => onTabChange('advanced')}
        style={{
          ...styles.tab,
          ...(activeTab === 'advanced' ? styles.tabActive : {}),
        }}
        aria-selected={activeTab === 'advanced'}
        aria-controls="advanced-demo-panel"
        role="tab"
        tabIndex={activeTab === 'advanced' ? 0 : -1}
        aria-label="Developer Sandbox - Sign in to access advanced testing features"
      >
        <span style={styles.tabLabel}>Developer Sandbox</span>
        <span style={{
          ...styles.tabSubtext,
          ...(activeTab === 'advanced' ? styles.tabSubtextActive : {}),
        }}>Sign in to access advanced testing features</span>
      </button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    backgroundColor: '#f3f4f6',
    padding: '0.25rem',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '600px',
  },
  tab: {
    flex: 1,
    padding: '0.875rem 1.25rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    minHeight: '44px', // WCAG touch target
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: '0.25rem',
  },
  tabLabel: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    lineHeight: '1.2',
  },
  tabSubtext: {
    fontSize: '0.75rem',
    fontWeight: '400',
    color: '#9ca3af',
    lineHeight: '1.2',
    textAlign: 'center',
    transition: 'color 0.2s ease-in-out',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    color: '#667eea',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  tabSubtextActive: {
    color: '#9ca3af',
  },
};

// Add styles and responsive behavior
if (typeof document !== 'undefined') {
  const styleId = 'demo-tabs-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Tabs are visible on both mobile and desktop */
      [data-demo-tabs] {
        display: flex;
      }
      /* Tab focus styles */
      button[role="tab"]:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
      button[role="tab"]:focus:not(:focus-visible) {
        outline: none;
      }
      /* Tab hover states */
      button[role="tab"]:not([aria-selected="true"]):hover {
        background-color: #e5e7eb !important;
        color: #374151 !important;
      }
      button[role="tab"][aria-selected="true"]:hover {
        background-color: #ffffff !important;
        color: #111827 !important;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
      }
      button[role="tab"][aria-selected="true"]:hover span[style*="tabSubtext"] {
        color: #6b7280 !important;
      }
      /* Active tab indicator (subtle underline) */
      button[role="tab"][aria-selected="true"]::after {
        content: '';
        position: absolute;
        bottom: -0.125rem;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 2rem);
        height: 2px;
        background-color: #667eea;
        border-radius: 2px;
      }
      /* Mobile adjustments */
      @media (max-width: 640px) {
        button[role="tab"] {
          padding: 0.75rem 1rem;
        }
        button[role="tab"] span[style*="tabLabel"] {
          font-size: 0.875rem !important;
        }
        button[role="tab"] span[style*="tabSubtext"] {
          font-size: 0.6875rem !important;
        }
      }
      /* Subtext styling */
      button[role="tab"] span[style*="tabSubtext"] {
        display: block;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

