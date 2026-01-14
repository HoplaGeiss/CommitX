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

## License

Private project
