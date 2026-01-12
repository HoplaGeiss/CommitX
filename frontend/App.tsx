import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import CommitmentsListScreen from './screens/CommitmentsListScreen';
import AddCommitmentScreen from './screens/AddCommitmentScreen';
import JoinChallengeScreen from './screens/JoinChallengeScreen';
import { RootStackParamList } from './types';
import { UserProvider, useUser } from './utils/userContext';
import { api } from './utils/api';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { currentUser, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && currentUser) {
      // Set userId in API client when user changes
      api.setUserId(currentUser.id);
    }
  }, [currentUser?.id, isLoading]);

  return (
    <NavigationContainer>
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


