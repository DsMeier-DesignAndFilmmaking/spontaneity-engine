/**
 * trackEvent.ts
 * Analytics event tracking abstraction layer.
 * 
 * Provides a unified interface for tracking analytics events across the application.
 * Supports multiple analytics providers (Segment, Mixpanel, Amplitude) with a
 * single abstraction. Events are batched in production to minimize network calls.
 * 
 * Features:
 * - Event batching (1-2s debounce in production)
 * - Debug mode (logs to console when DEBUG_TELEMETRY is true)
 * - Provider abstraction (easy to swap providers)
 * - Type-safe event tracking
 */

/**
 * Analytics event properties interface
 */
export interface AnalyticsEventProps {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
  name: string;
  props: AnalyticsEventProps;
  timestamp: number;
  anonymous_id?: string;
}

/**
 * Event queue for batching
 */
let eventQueue: AnalyticsEvent[] = [];
let batchTimeout: NodeJS.Timeout | null = null;
const BATCH_DELAY_MS = 1500; // 1.5 seconds debounce

/**
 * Check if debug mode is enabled
 */
const isDebugMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_DEBUG_TELEMETRY === 'true' || 
         (window as any).DEBUG_TELEMETRY === true;
};

/**
 * Generate anonymous ID (simple UUID v4 style)
 */
const generateAnonymousId = (): string => {
  if (typeof window === 'undefined') return 'server-side';
  
  // Try to get from localStorage
  const stored = localStorage.getItem('demo_anonymous_id');
  if (stored) return stored;
  
  // Generate new ID
  const id = 'demo_' + Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
  localStorage.setItem('demo_anonymous_id', id);
  return id;
};

/**
 * Detect device type
 */
const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

/**
 * Send events to analytics provider
 * 
 * TODO: Replace with actual analytics provider integration
 * - Segment: analytics.track(event.name, event.props)
 * - Mixpanel: mixpanel.track(event.name, event.props)
 * - Amplitude: amplitude.logEvent(event.name, event.props)
 */
const sendToAnalyticsProvider = async (events: AnalyticsEvent[]): Promise<void> => {
  // STUB — replace in production
  // Example Segment integration:
  // if (typeof window !== 'undefined' && (window as any).analytics) {
  //   events.forEach(event => {
  //     (window as any).analytics.track(event.name, event.props);
  //   });
  // }
  
  // For now, log to console in production (can be removed when provider is integrated)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Batch sent:', events.length, 'events');
  }
};

/**
 * Process event queue (flush to analytics provider)
 */
const flushEventQueue = async (): Promise<void> => {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  try {
    await sendToAnalyticsProvider(eventsToSend);
  } catch (error) {
    console.error('[Analytics] Error sending events:', error);
  }
};

/**
 * Track an analytics event
 * 
 * @param name Event name (e.g., 'preset_click', 'demo_run')
 * @param props Event properties
 */
export function trackEvent(name: string, props: AnalyticsEventProps = {}): void {
  const timestamp = Date.now();
  const anonymous_id = generateAnonymousId();
  const device_type = getDeviceType();
  
  // Build complete event
  const event: AnalyticsEvent = {
    name,
    props: {
      ...props,
      timestamp,
      anonymous_id,
      device_type,
    },
    timestamp,
    anonymous_id,
  };
  
  // Debug mode: log to console and expose via window.demoTelemetry
  if (isDebugMode()) {
    console.log(`[Telemetry] ${name}:`, event.props);
    
    // Expose to window.demoTelemetry for debugging
    if (typeof window !== 'undefined') {
      if (!(window as any).demoTelemetry) {
        (window as any).demoTelemetry = {
          events: [],
          logEvent: (eventName: string, eventProps: AnalyticsEventProps) => {
            console.log(`[demoTelemetry] ${eventName}:`, eventProps);
            (window as any).demoTelemetry.events.push({ name: eventName, props: eventProps, timestamp: Date.now() });
          },
        };
      }
      (window as any).demoTelemetry.logEvent(name, event.props);
    }
  }
  
  // Add to queue
  eventQueue.push(event);
  
  // In development, send immediately
  // In production, batch with debounce
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    // Development: send immediately
    flushEventQueue();
  } else {
    // Production: batch with debounce
    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }
    batchTimeout = setTimeout(() => {
      flushEventQueue();
    }, BATCH_DELAY_MS);
  }
}

/**
 * Flush pending events immediately (useful for page unload)
 */
export function flushEvents(): void {
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
  flushEventQueue();
}

/**
 * Initialize analytics tracking
 * Set up page unload handler to flush pending events
 */
export function initializeAnalytics(): void {
  if (typeof window === 'undefined') return;
  
  // Flush events on page unload
  window.addEventListener('beforeunload', flushEvents);
  
  if (isDebugMode()) {
    console.log('[Analytics] Debug mode enabled. Events will be logged to console.');
  }
}

