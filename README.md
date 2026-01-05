# CommitZ

A React Native mobile app built with Expo for tracking daily commitments and habits. Built with a modern dark theme and intuitive calendar interface.

## Features

- ✅ **Create and Manage Commitments**: Add, edit, and delete commitments with ease
- 📅 **Monthly Calendar View**: Visual calendar showing completion status for each day
- ✓ **Quick Check-in**: Mark commitments as done for today with a single tap
- 🔄 **Month Navigation**: Navigate between months to view past completions
- 🎯 **Future Date Protection**: Prevents check-ins on future dates
- 💾 **Local Storage**: All data stored locally using AsyncStorage
- 🎨 **Modern Dark UI**: Beautiful dark theme with green accent colors
- 📱 **Safe Area Support**: Properly handles Android navigation bars and iOS safe areas

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- pnpm (v9.0.0 or higher) - see package.json for exact version
- Expo CLI (installed globally or via npx)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the Expo development server:
```bash
pnpm start
# or
npm start
```

3. Run on your device:
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator
   - Or press `a` for Android emulator
   - Or press `w` for web browser

## Project Structure

```
commitZ/
├── App.js                      # Main app component with navigation
├── app.json                    # Expo configuration
├── screens/                    # Screen components
│   ├── CommitmentsListScreen.js    # Main list view with calendar cards
│   └── AddCommitmentScreen.js      # Create new commitment screen
├── utils/
│   └── storage.js              # Local storage utilities (AsyncStorage)
└── assets/                     # App assets (icons, images)
    ├── icon.png
    ├── adaptive-icon.png
    ├── splash.png
    └── favicon.png
```

## Usage

1. **Create a Commitment**: 
   - Tap the green + button (FAB) on the main screen
   - Enter a commitment title and save

2. **Mark as Done**: 
   - Tap the checkmark icon (✓) on the top left of each commitment card to mark it as done for today
   - The calendar cell for today will turn green

3. **Navigate Months**: 
   - Use the chevron buttons (‹ ›) next to the month name to navigate between months
   - The forward button is hidden when viewing the current month

4. **Edit Commitment**: 
   - Tap the edit icon (✎) next to the commitment title
   - Modify the title and save

5. **Delete Commitment**: 
   - Tap the trash icon next to the commitment title
   - Confirm deletion in the modal popup

6. **View Calendar**: 
   - Each commitment card shows a mini calendar with day numbers
   - Completed days are highlighted in green
   - Future dates are dimmed and disabled

## Technologies

- **React Native** (0.81.5) - Mobile framework
- **Expo** (~54.0.0) - Development platform
- **React Navigation** (v6) - Navigation library
- **AsyncStorage** - Local data persistence
- **React Native Safe Area Context** - Safe area handling
- **Expo Vector Icons** - Icon library

## Design

- **Color Scheme**: Dark theme with black background (#000000)
- **Accent Color**: Green (#4CAF50) for completed states and primary actions
- **Typography**: Clean, modern fonts with proper hierarchy
- **Layout**: Full-width calendar cards with compact month navigation

## License

Private project

