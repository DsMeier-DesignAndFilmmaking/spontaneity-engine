/**
 * Tooltip.tsx
 * Reusable tooltip component with proper positioning and portal rendering.
 * 
 * Best practices:
 * - Uses React Portal to avoid clipping
 * - Dynamic positioning based on viewport
 * - Small delay before showing
 * - Proper z-index management
 * - Mobile-friendly touch interactions
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import colors from '@/lib/design/colors';

export interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}

/**
 * Tooltip component - Accessible, positioned tooltip with portal rendering.
 */
export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = 280,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;
    let finalPosition = position;

    // Calculate position based on preferred position
    switch (position) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + 8;
        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + scrollX + 8;
        break;
    }

    // Adjust if tooltip goes off-screen
    if (left < 8) {
      left = 8;
      finalPosition = 'right';
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
      finalPosition = 'left';
    }

    if (top < scrollY + 8) {
      top = triggerRect.bottom + scrollY + 8;
      finalPosition = 'bottom';
    } else if (top + tooltipRect.height > scrollY + viewportHeight - 8) {
      top = triggerRect.top + scrollY - tooltipRect.height - 8;
      finalPosition = 'top';
    }

    setTooltipPosition({ top, left });
    setActualPosition(finalPosition);
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    },
  });

  const tooltipContent = isVisible && typeof document !== 'undefined' ? (
    createPortal(
      <div
        ref={tooltipRef}
        style={{
          ...styles.tooltip,
          ...styles[`tooltip${actualPosition.charAt(0).toUpperCase() + actualPosition.slice(1)}`],
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          maxWidth: `${maxWidth}px`,
        }}
        role="tooltip"
        aria-hidden={!isVisible}
      >
        {content}
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      {trigger}
      {tooltipContent}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  tooltip: {
    position: 'absolute',
    zIndex: 10000,
    padding: '0.625rem 0.875rem',
    fontSize: '0.8125rem',
    lineHeight: '1.5',
    color: colors.textInverse,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    pointerEvents: 'none',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    opacity: 0,
    transform: 'scale(0.95)',
    animation: 'tooltipFadeIn 0.2s ease forwards',
  },
  tooltipTop: {
    transformOrigin: 'bottom center',
  },
  tooltipBottom: {
    transformOrigin: 'top center',
  },
  tooltipLeft: {
    transformOrigin: 'right center',
  },
  tooltipRight: {
    transformOrigin: 'left center',
  },
};

// Add fade-in animation
if (typeof document !== 'undefined') {
  const styleId = 'tooltip-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes tooltipFadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

