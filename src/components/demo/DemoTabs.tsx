/**
 * DemoTabs.tsx
 * Mobile tab switcher for demo modules.
 * 
 * UI-only component - controls visibility, does not modify logic.
 * Only visible on mobile (<800px), desktop shows both modules side-by-side.
 */

import React from 'react';

export interface DemoTabsProps {
  activeTab: 'free' | 'advanced';
  onTabChange: (tab: 'free' | 'advanced') => void;
}

/**
 * DemoTabs component - Mobile tab switcher.
 * 
 * UI-only: Controls visibility of modules, no logic changes.
 */
export default function DemoTabs({ activeTab, onTabChange }: DemoTabsProps) {
  return (
    <div style={styles.container} data-mobile-tabs>
      <button
        type="button"
        onClick={() => onTabChange('free')}
        style={{
          ...styles.tab,
          ...(activeTab === 'free' ? styles.tabActive : {}),
        }}
        aria-selected={activeTab === 'free'}
        role="tab"
      >
        Free Demo
      </button>
      <button
        type="button"
        onClick={() => onTabChange('advanced')}
        style={{
          ...styles.tab,
          ...(activeTab === 'advanced' ? styles.tabActive : {}),
        }}
        aria-selected={activeTab === 'advanced'}
        role="tab"
      >
        Advanced Demo
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
  },
  tab: {
    flex: 1,
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    color: '#111827',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
};

// Add styles and responsive behavior
if (typeof document !== 'undefined') {
  const styleId = 'demo-tabs-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-mobile-tabs] {
        display: flex;
      }
      @media (min-width: 800px) {
        [data-mobile-tabs] {
          display: none !important;
        }
      }
      button[role="tab"]:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

