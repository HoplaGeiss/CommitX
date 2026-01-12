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
