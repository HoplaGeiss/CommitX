import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import CommitmentsListScreen from './screens/CommitmentsListScreen';
import AddCommitmentScreen from './screens/AddCommitmentScreen';
import JoinChallengeScreen from './screens/JoinChallengeScreen';
import { RootStackParamList } from './types';
import { UserProvider, useUser } from './utils/userContext';
import { api } from './utils/api';
import appConfig from './app.json';

// Initialize Sentry
// By default, only in production (!__DEV__)
// Can be overridden with EXPO_PUBLIC_FORCE_SENTRY=true for testing in dev
const shouldInitializeSentry = !__DEV__ || process.env.EXPO_PUBLIC_FORCE_SENTRY === 'true';

if (shouldInitializeSentry && process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    release: appConfig.expo.version,
    enableAutoSessionTracking: true,
    enableNativeFramesTracking: true,
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Integrations
    integrations: [
      Sentry.reactNativeTracingIntegration(),
    ],
  });
  
  console.log(`🔍 Sentry initialized in ${__DEV__ ? 'development' : 'production'} mode`);
}

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create navigation ref for Sentry
const navigationRef = React.createRef<any>();

function AppNavigator() {
  const { currentUser, isLoading } = useUser();
  const routeNameRef = useRef<string>();

  useEffect(() => {
    if (!isLoading && currentUser) {
      // Set userId in API client when user changes
      api.setUserId(currentUser.id);
      
      // Set user context for Sentry
      Sentry.setUser({ id: currentUser.id });
    }
  }, [currentUser?.id, isLoading]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName && currentRouteName) {
          // Add breadcrumb for navigation
          Sentry.addBreadcrumb({
            category: 'navigation',
            message: `Navigated to ${currentRouteName}`,
            level: 'info',
            data: {
              from: previousRouteName,
              to: currentRouteName,
            },
          });
        }

        routeNameRef.current = currentRouteName;
      }}
    >
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen 
          name="CommitmentsList" 
          component={CommitmentsListScreen}
          options={{ title: 'CommitX' }}
        />
        <Stack.Screen 
          name="AddCommitment" 
          component={AddCommitmentScreen}
          options={{ title: 'CommitX' }}
        />
        <Stack.Screen 
          name="JoinChallenge" 
          component={JoinChallengeScreen}
          options={{ title: 'Join Challenge' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppNavigator />
    </UserProvider>
  );
}


