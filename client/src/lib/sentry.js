import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const isDevelopment = import.meta.env.DEV;

// Initialize Sentry
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    // Session Replay
    replaysSessionSampleRate: isDevelopment ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE || 'development',
    enabled: !isDevelopment || import.meta.env.VITE_SENTRY_ENABLED === 'true'
  });
}

export const captureException = (error, context = {}) => {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else if (isDevelopment) {
    console.error('[Sentry Mock]', error, context);
  }
};

export const captureMessage = (message, level = 'info', context = {}) => {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, { level, extra: context });
  } else if (isDevelopment) {
    console.log(`[Sentry Mock - ${level}]`, message, context);
  }
};

export default Sentry;
