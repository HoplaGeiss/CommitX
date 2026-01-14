# Sentry Monitoring Setup Guide

## Overview

This project uses Sentry for production error tracking and monitoring with request ID correlation between mobile and backend.

## Prerequisites

You need to complete the manual Sentry project setup before the monitoring will be active.

## Step 1: Create Sentry Account and Projects

1. Go to [sentry.io](https://sentry.io) and create an account (or log in)
2. Create two projects:
   - **Project 1**: `commitx-mobile`
     - Platform: React Native
     - Copy the DSN URL
   - **Project 2**: `commitx-backend`
     - Platform: Node.js
     - Copy the DSN URL

## Step 2: Configure Environment Variables

### Backend (Railway)

Add to Railway environment variables:
```bash
NODE_ENV=production
SENTRY_DSN=https://your-backend-dsn@sentry.io/your-project-id
```

For local testing, create `backend/.env`:
```bash
NODE_ENV=production
SENTRY_DSN=https://your-backend-dsn@sentry.io/your-project-id
DATABASE_URL=postgresql://...
```

### Mobile (Frontend)

Update `frontend/.env`:
```bash
EXPO_PUBLIC_API_URL=https://backend-production-xxxx.up.railway.app
EXPO_PUBLIC_SENTRY_DSN=https://your-mobile-dsn@sentry.io/your-project-id
EXPO_PUBLIC_E2E_MODE=false
EXPO_PUBLIC_DEV_MODE=true
```

### Sentry Properties (for mobile builds)

Update `frontend/sentry.properties`:
```properties
defaults.url=https://sentry.io/
defaults.org=your-sentry-org-slug
defaults.project=commitx-mobile
auth.token=your-sentry-auth-token
```

To get an auth token:
1. Go to Sentry → Settings → Auth Tokens
2. Create new token with `project:releases` and `project:write` scopes
3. Copy token to `sentry.properties`

## Step 3: Update EAS Configuration

Update `frontend/eas.json` production build env vars:
```json
"production": {
  "env": {
    "SENTRY_ORG": "your-sentry-org-slug",
    "SENTRY_PROJECT": "commitx-mobile"
  }
}
```

## Step 4: Test the Integration

### Test Backend Error Capture

1. Start backend: `pnpm dev:backend`
2. In dev mode, use the "Test Backend" button in the mobile app
3. Or visit: `http://localhost:8080/commitments/test-sentry`
4. Check Sentry dashboard → Backend project for the error

Expected in Sentry:
- Error message: "This is a test error for Sentry monitoring"
- Tags: `requestId`, `path`, `method`
- Request context

### Test Mobile Error Capture

1. In dev mode, tap "Test Mobile" button
2. Check Sentry dashboard → Mobile project for the error

Expected in Sentry:
- Error message: "Test mobile Sentry error"
- Screen name in breadcrumbs
- Recent API calls in breadcrumbs

### Test Request Correlation

1. In mobile app, trigger an API call that causes a backend error
2. Find error in Sentry Mobile → check breadcrumbs for `requestId`
3. Copy the `requestId`
4. Search in Sentry Backend for same `requestId` tag
5. Copy `requestId` → search in Railway logs: `requestId:"abc-123"`

You should see:
- Mobile error with API breadcrumb containing requestId
- Backend error with same requestId tag
- Railway logs showing full request context

## Step 5: Production Deployment

### Backend (Railway)

1. Set environment variables in Railway dashboard
2. Deploy (automatic from git push)
3. Sentry will only initialize if `NODE_ENV=production` and `SENTRY_DSN` is set

### Mobile (EAS Build)

1. Ensure `sentry.properties` has auth token
2. Build production version:
   ```bash
   cd frontend
   eas build --platform android --profile production
   ```
3. Source maps will be automatically uploaded to Sentry
4. Sentry will only initialize in production builds (not Expo Go)

## Step 6: Remove Test Endpoints

After confirming Sentry works:

1. **Backend**: Remove test endpoint from `backend/src/commitments/commitments.controller.ts`
   ```typescript
   // DELETE THIS:
   @Get('test-sentry')
   testSentry() { ... }
   ```

2. **Frontend**: Remove test buttons and method from:
   - `frontend/screens/CommitmentsListScreen.tsx` (remove test buttons)
   - `frontend/utils/api.ts` (remove `testSentry()` method)

## How It Works

### Request Flow with Correlation

```
1. Mobile makes API call
2. Backend middleware generates UUID (requestId)
3. Backend logs with requestId (pino JSON logs)
4. Backend returns X-Request-Id header
5. Mobile extracts requestId → adds to breadcrumb
6. On error:
   - Backend: Sentry event tagged with requestId
   - Mobile: Breadcrumb shows requestId from API call
   - Railway: JSON logs searchable by requestId
```

### Production-Only Strategy

- **Backend**: Only active when `NODE_ENV=production` AND `SENTRY_DSN` is set
- **Mobile**: Only active when `!__DEV__` AND `EXPO_PUBLIC_SENTRY_DSN` is set
- **Dev errors**: Stay in console (faster iteration, no noise in Sentry)

## Monitoring Workflow

When a user reports a crash:

1. Open Sentry → find error
2. Check tags for `requestId`
3. Copy `requestId`
4. Search Railway logs: `requestId:"abc-123"`
5. See full 30-second context around the error

## Features Enabled

✅ Backend: Uncaught exceptions captured
✅ Backend: HTTP errors (5xx) captured
✅ Backend: Structured JSON logging with pino
✅ Backend: Request ID in every log entry
✅ Mobile: Crashes captured
✅ Mobile: Screen navigation tracked
✅ Mobile: API calls logged as breadcrumbs
✅ Mobile: Request ID correlation
✅ Mobile: Source maps for readable stack traces
✅ Request correlation between mobile ↔ backend

## Additional Configuration (Optional)

### Adjust Sample Rates

If you have high traffic, reduce sample rates to save quota:

**Backend** (`backend/src/main.ts`):
```typescript
tracesSampleRate: 0.1,  // 10% of requests
profilesSampleRate: 0.1,
```

**Mobile** (`frontend/App.tsx`):
```typescript
tracesSampleRate: 0.1,  // 10% of sessions
```

### Add User Context

The mobile app already sets user ID. To add more context:

```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,  // if you have it
  username: user.name,
});
```

### Add Custom Tags/Context

```typescript
// Backend
Sentry.setTag('feature', 'collaborative-challenge');
Sentry.setContext('challenge', { id, participants });

// Mobile
Sentry.setTag('screen', 'CommitmentsList');
Sentry.setContext('commitment', { id, type });
```

## Troubleshooting

### Errors not appearing in Sentry

- Check environment variables are set correctly
- Verify `NODE_ENV=production` (backend) or not `__DEV__` (mobile)
- Check Sentry dashboard → Settings → Projects for correct DSN
- Look for "Sentry initialized" log on backend startup

### Source maps not working (mobile)

- Verify `sentry.properties` has valid auth token
- Check EAS build logs for "Uploading source maps" message
- Ensure `eas.json` has SENTRY_ORG and SENTRY_PROJECT env vars

### Request ID not correlating

- Check Railway logs for `X-Request-Id` header in response
- Verify mobile breadcrumbs show `requestId` field
- Ensure backend middleware is applied globally

### Logs not showing in Railway

- pino outputs JSON by default (Railway auto-formats)
- Use Railway log search: `requestId:"exact-id"`
- For pretty logs locally: set `NODE_ENV=development`

## Support

- Sentry docs: https://docs.sentry.io/
- NestJS integration: https://docs.sentry.io/platforms/node/guides/nestjs/
- React Native integration: https://docs.sentry.io/platforms/react-native/
