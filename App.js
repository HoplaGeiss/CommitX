import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import CommitmentsListScreen from './screens/CommitmentsListScreen';
import AddCommitmentScreen from './screens/AddCommitmentScreen';

const Stack = createNativeStackNavigator();

export default function App() {
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
          options={{ title: 'CommitZ' }}
        />
        <Stack.Screen 
          name="AddCommitment" 
          component={AddCommitmentScreen}
          options={{ title: 'CommitZ' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

