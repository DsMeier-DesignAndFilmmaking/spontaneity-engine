/**
 * DemoPageNav.tsx
 * Top navigation with back home button.
 * 
 * Simple navigation bar with back arrow button linking to home.
 */

import React from 'react';
import Link from 'next/link';

/**
 * DemoPageNav component - Top navigation with back home button.
 */
export default function DemoPageNav() {
  return (
    <nav style={styles.nav}>
      <Link href="https://spontaneity-engine.vercel.app/" style={styles.backLink} aria-label="Back Home">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={styles.backArrow}
          aria-hidden="true"
        >
          <path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={styles.backText}>Back Home</span>
      </Link>
    </nav>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    padding: '0.75rem 0 1rem 0',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    transition: 'all 0.2s ease',
    color: '#374151',
    fontSize: '0.9375rem',
    fontWeight: '500',
  },
  backArrow: {
    display: 'block',
    width: '20px',
    height: '20px',
    flexShrink: 0,
  },
  backText: {
    lineHeight: '1.5',
  },
};

// Add hover effect
if (typeof document !== 'undefined') {
  const styleId = 'demo-nav-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      a[href*="spontaneity-engine"]:hover {
        background-color: #f3f4f6;
        color: #111827;
      }
      a[href*="spontaneity-engine"]:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

