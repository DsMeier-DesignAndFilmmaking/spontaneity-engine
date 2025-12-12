/**
 * DemoPageNav.tsx
 * Top navigation with logo component.
 * 
 * Simple navigation bar with logo linking to home.
 */

import React from 'react';
import Link from 'next/link';

/**
 * DemoPageNav component - Top navigation with logo.
 */
export default function DemoPageNav() {
  return (
    <nav style={styles.nav}>
      <Link href="https://spontaneity-engine.vercel.app/" style={styles.logoLink}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={styles.logo}
          aria-label="Spontaneity Engine Logo"
        >
          {/* Simple minimalist logo - abstract spark/spontaneity symbol */}
          <circle cx="16" cy="16" r="14" stroke="#667eea" strokeWidth="2" fill="none" />
          <path
            d="M16 8 L16 16 M16 16 L20 12 M16 16 L12 12 M16 24 L20 20 M16 24 L12 20"
            stroke="#667eea"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </Link>
    </nav>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '1rem 1rem 0 1rem',
  },
  logoLink: {
    display: 'inline-block',
    textDecoration: 'none',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    transition: 'opacity 0.2s',
  },
  logo: {
    display: 'block',
    width: '32px',
    height: '32px',
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
        opacity: 0.8;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

