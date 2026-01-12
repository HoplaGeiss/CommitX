import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const USER_STORAGE_KEY = '@current_user_id';
const USERS_LIST_KEY = '@users_list';

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UserContextType {
  currentUser: User;
  switchUser: (userId: string) => Promise<void>;
  createNewUser: () => Promise<User>;
  availableUsers: User[];
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeUsers();
  }, []);

  const initializeUsers = async () => {
    try {
      // Load list of users
      const usersJson = await AsyncStorage.getItem(USERS_LIST_KEY);
      let users: User[] = usersJson ? JSON.parse(usersJson) : [];

      // If no users exist, create the first one
      if (users.length === 0) {
        const firstUserId = generateUUID();
        const firstUser: User = { id: firstUserId };
        users = [firstUser];
        await AsyncStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
      }

      setAvailableUsers(users);

      // Load current user ID
      const storedUserId = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const userId = storedUserId || users[0].id;

      // Find or create current user
      let user = users.find(u => u.id === userId);
      if (!user) {
        // If stored user ID doesn't exist in list, use first user
        user = users[0];
        await AsyncStorage.setItem(USER_STORAGE_KEY, user.id);
      }

      setCurrentUser(user);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing users:', error);
      // Fallback: create a temporary user
      const fallbackId = generateUUID();
      const fallbackUser: User = { id: fallbackId };
      setCurrentUser(fallbackUser);
      setAvailableUsers([fallbackUser]);
      setIsLoading(false);
    }
  };

  const switchUser = async (userId: string) => {
    try {
      const user = availableUsers.find(u => u.id === userId);
      if (user) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, userId);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error switching user:', error);
    }
  };

  const createNewUser = async (): Promise<User> => {
    try {
      const newUserId = generateUUID();
      const newUser: User = { id: newUserId };
      const updatedUsers = [...availableUsers, newUser];
      
      await AsyncStorage.setItem(USERS_LIST_KEY, JSON.stringify(updatedUsers));
      setAvailableUsers(updatedUsers);
      
      // Switch to the new user
      await switchUser(newUserId);
      
      return newUser;
    } catch (error) {
      console.error('Error creating new user:', error);
      throw error;
    }
  };

  if (isLoading || !currentUser) {
    // Show nothing while loading (or you could add a loading screen)
    return null;
  }

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      switchUser, 
      createNewUser,
      availableUsers, 
      isLoading: false 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

