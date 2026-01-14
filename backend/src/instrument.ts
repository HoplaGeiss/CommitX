// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { getRequestId, getUserId } from './common/request-id.middleware';

// Initialize Sentry as early as possible
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  release: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.npm_package_version || '1.0.0',
  
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  
  integrations: [
    nodeProfilingIntegration(),
  ],
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
  
  // Only enable if DSN is provided and in production
  enabled: process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN,
  
  // BeforeSend hook to enrich all events with requestId and userId
  // This is crucial for correlating mobile → backend errors
  beforeSend(event, hint) {
    // Get requestId and userId from AsyncLocalStorage
    const requestId = getRequestId();
    const userId = getUserId();
    
    // Add as tags for easy filtering in Sentry dashboard
    if (requestId) {
      event.tags = {
        ...event.tags,
        requestId,
      };
      
      // Also add to contexts for more detailed view
      event.contexts = {
        ...event.contexts,
        request_correlation: {
          request_id: requestId,
        },
      };
    }
    
    if (userId) {
      event.user = {
        ...event.user,
        id: userId,
      };
    }
    
    return event;
  },
});

// Log Sentry status
const isEnabled = process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV || 'development';

if (isEnabled) {
  console.log(`✅ Sentry enabled for ${environment}`);
} else {
  console.log(`ℹ️  Sentry initialized but disabled (environment: ${environment})`);
}
