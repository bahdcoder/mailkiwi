import { appEnv } from './app_env.js'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
/**
 * Sentry configuration for error tracking and monitoring.
 *
 * This module provides centralized access to Sentry configuration values
 * and helper functions for initializing Sentry in different environments.
 */
export const sentryConfig = {
  dsn: 'https://de939b1583e043d561bfaecc64189b22@sentry.kibamail.com/2',
  environment: appEnv.NODE_ENV,
  release: 'kibamail@1.0.0',
  tracesSampleRate: appEnv.NODE_ENV === 'production' ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [nodeProfilingIntegration()],
}

/**
 * Determines if Sentry should be enabled based on the current environment.
 *
 * @returns {boolean} True if Sentry should be enabled, false otherwise.
 */
export function isSentryEnabled(): boolean {
  return ['production', 'staging'].includes(appEnv.NODE_ENV)
}
