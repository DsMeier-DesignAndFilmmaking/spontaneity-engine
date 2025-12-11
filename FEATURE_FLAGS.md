# Feature Flags Guide

## Enabling Demo Enhancements

The new demo page enhancements (presets, context toggles, save/share, feedback, etc.) are controlled by the `FEATURE_DEMO_ENHANCEMENTS` feature flag.

### Development (Default: Enabled)

In development mode, the feature is **enabled by default**. No configuration needed.

### Production

To enable the feature in production, set the environment variable:

```bash
FEATURE_DEMO_ENHANCEMENTS=true
```

Or if using Next.js public environment variables:

```bash
NEXT_PUBLIC_FEATURE_DEMO_ENHANCEMENTS=true
```

### Vercel Configuration

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - **Name**: `FEATURE_DEMO_ENVHANCEMENTS` (or `NEXT_PUBLIC_FEATURE_DEMO_ENHANCEMENTS`)
   - **Value**: `true`
   - **Environment**: Production (or Preview/Development as needed)
4. Redeploy your application

### Local Testing

Create a `.env.local` file in the project root:

```bash
FEATURE_DEMO_ENHANCEMENTS=true
```

Or disable it for testing:

```bash
FEATURE_DEMO_ENHANCEMENTS=false
```

### Debug Mode

To enable debug telemetry logging (logs all events to console), set:

```bash
NEXT_PUBLIC_DEBUG_TELEMETRY=true
```

Or in the browser console:

```javascript
window.DEBUG_TELEMETRY = true;
```

This will:
- Log all analytics events to the browser console
- Expose `window.demoTelemetry` object with event history

