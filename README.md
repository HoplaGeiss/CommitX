# CommitX

A full-stack commitment tracking application with a NestJS backend and React Native frontend built with Expo.

## Project Structure

```
commitX/
├── backend/          # NestJS backend API
│   ├── src/
│   │   ├── commitments/  # Commitments module (CRUD + completions)
│   │   └── main.ts      # Application entry point
│   └── package.json
├── frontend/         # React Native/Expo frontend app
│   ├── screens/      # Screen components
│   ├── components/   # Reusable components
│   ├── utils/        # Utilities (API client, etc.)
│   └── package.json
└── package.json      # Root workspace configuration
```

## Features

- ✅ **Create and Manage Commitments**: Add, edit, and delete commitments via REST API
- 📅 **Monthly Calendar View**: Visual calendar showing completion status for each day
- ✓ **Quick Check-in**: Mark commitments as done for today with a single tap
- 🔄 **Month Navigation**: Navigate between months to view past completions
- 🎯 **Future Date Protection**: Prevents check-ins on future dates
- 🎨 **Modern Dark UI**: Beautiful dark theme with green accent colors
- 📱 **Safe Area Support**: Properly handles Android navigation bars and iOS safe areas
- 🚀 **RESTful API**: NestJS backend with full CRUD operations

## Getting Started

### Prerequisites

- Node.js (v20.19.4 or higher)
- pnpm (v9.0.0 or higher)
- Expo CLI (installed globally or via npx)

### Installation

1. Install all dependencies (root, backend, and frontend):
```bash
pnpm install
```

This will install dependencies for all workspaces automatically.

2. Configure environment variables:

Create a `.env` file in the `frontend` directory:
```bash
# frontend/.env
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_E2E_MODE=false  # Set to 'true' only for E2E testing
EXPO_PUBLIC_DEV_MODE=true
```

**Environment Variables:**
- `EXPO_PUBLIC_API_URL`: Backend API URL
- `EXPO_PUBLIC_E2E_MODE`: Shows user switcher for multi-user E2E testing (default: `false`)
- `EXPO_PUBLIC_DEV_MODE`: Enables development features (default: `true`)

### Running the Application

#### Development Mode

**Start both backend and frontend:**
```bash
pnpm dev
```

**Or start them separately:**

Backend (runs on http://localhost:3000):
```bash
pnpm dev:backend
```

Frontend app:
```bash
pnpm dev:frontend
```

Then:
- Scan the QR code with Expo Go app (iOS/Android)
- Or press `i` for iOS simulator
- Or press `a` for Android emulator
- Or press `w` for web browser

### Backend API

The NestJS backend provides the following endpoints:

#### Commitments
- `GET /commitments` - Get all commitments
- `GET /commitments/:id` - Get a specific commitment
- `POST /commitments` - Create a new commitment
- `PATCH /commitments/:id` - Update a commitment
- `DELETE /commitments/:id` - Delete a commitment

#### Completions
- `POST /commitments/:id/completions` - Toggle completion for a date
- `GET /commitments/:id/completions` - Get completions for a commitment
- `GET /commitments/completions/all` - Get all completions

The backend runs on `http://localhost:3000` by default (configurable via `PORT` environment variable).

## Testing

### E2E Tests with Maestro

The project includes E2E tests using [Maestro](https://maestro.mobile.dev/).

**Enable E2E Mode:**
```bash
# In frontend/.env
EXPO_PUBLIC_E2E_MODE=true
```

This will show the UserSwitcher component for multi-user testing scenarios.

**Run E2E tests:**
```bash
cd frontend
maestro test .maestro/
```

**Note:** Remember to disable E2E mode (`EXPO_PUBLIC_E2E_MODE=false`) when not running tests to hide the user switcher in development.

## Publishing

### Step 1 build

cd frontend

#### For iOS (App Store)
eas build --platform ios --profile production

#### For Android (Play Store)
eas build --platform android --profile production

#### Or both at once
eas build --platform all --profile production

### Step 2 publish

#### Submit to App Store
eas submit --platform ios --profile production

#### Submit to Play Store
eas submit --platform android --profile production

## Technologies

### Backend
- **NestJS** (^10.0.0) - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Express** - HTTP server

### Frontend
- **React Native** (0.81.5) - Mobile framework (frontend)
- **Expo** (~54.0.0) - Development platform
- **React Navigation** (v6) - Navigation library
- **TypeScript** - Type-safe development

## Design

- **Color Scheme**: Dark theme with black background (#000000)
- **Accent Color**: Green (#4CAF50) for completed states and primary actions
- **Typography**: Clean, modern fonts with proper hierarchy
- **Layout**: Full-width calendar cards with compact month navigation

## TODO / Known Issues

### Sentry Configuration (Temporary Workarounds)

**Status:** ✅ Builds working with temporary workarounds. Sentry runtime works, but debug symbols are disabled.

> **Note:** These workarounds were implemented and verified working as of January 2026. Builds successfully complete and deploy to TestFlight.

**Current State:**
- ✅ Sentry error tracking works (runtime SDK in `App.tsx`)
- ✅ User context, breadcrumbs, performance monitoring all functional
- ⚠️ Stack traces show minified code instead of source files
- ⚠️ Debug symbols not automatically uploaded

**Active Workarounds:**

1. **Metro Bundler Plugin Disabled** (`frontend/metro.config.js`)
   - **Issue:** `Cannot read properties of undefined (reading 'match')` error during bundling
   - **Version:** `@sentry/react-native@7.9.0`
   - **Workaround:** Metro plugin disabled for production builds (`NODE_ENV=production` or `EAS_BUILD=true`)
   - **Impact:** No enhanced source maps during Metro bundling

2. **Sentry Expo Plugin Removed** (`frontend/app.json`)
   - **Issue:** Xcode build phase "Upload Debug Symbols to Sentry" fails during EAS builds with exit code 65
   - **Workaround:** Removed `@sentry/react-native/expo` plugin entirely from `plugins` array
   - **Impact:** No automatic dSYM uploads to Sentry, no build-time Sentry integrations
   - **Note:** Sentry runtime SDK still works (manually initialized in `App.tsx`)

3. **Sentry Auto-Upload Disabled** (`eas.json`)
   - **Additional safeguard:** `SENTRY_DISABLE_AUTO_UPLOAD=true` environment variable as backup
   - **Impact:** Ensures symbol uploads are skipped even if plugin config is missed

**Resolution Timeline:**

- **Phase 1 (Current):** Temporary workarounds active - builds work, basic error tracking functional
- **Phase 2 (1-2 months):** Monitor for Sentry fix, re-enable Metro plugin when patched
- **Phase 3 (2-6 months):** Investigate iOS upload issue, re-enable symbol uploads

**Action Items:**
- [ ] Check for `@sentry/react-native` updates every 4-6 weeks
- [ ] Test Metro bundler after updates: `NODE_ENV=production pnpm expo export --platform ios`
- [ ] Monitor: https://github.com/getsentry/sentry-react-native/issues
- [ ] When fixed, remove workarounds:
  - Update `frontend/metro.config.js` to: `module.exports = withSentryConfig(config);`
  - Re-add Sentry Expo plugin to `frontend/app.json` plugins array (with `disableNativeDebugUpload` if still needed)
  - Remove `SENTRY_DISABLE_AUTO_UPLOAD` from `eas.json` (optional, but cleaner)

## License

Private project
