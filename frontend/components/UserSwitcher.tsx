import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../utils/userContext';

// Shorten UUID for display (first 8 chars)
const shortenId = (id: string): string => {
  return id.substring(0, 8);
};

const UserSwitcher: React.FC = () => {
  const { currentUser, switchUser, createNewUser, availableUsers } = useUser();
  
  // Only show in dev mode (controlled by environment variable)
  const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true' || 
                    (typeof __DEV__ !== 'undefined' && __DEV__);
  
  if (!isDevMode) {
    return null;
  }

  const handleCreateNew = async () => {
    try {
      await createNewUser();
    } catch (error) {
      console.error('Failed to create new user:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>User (for testing):</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {availableUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={[
              styles.button,
              currentUser.id === user.id && styles.buttonActive,
            ]}
            onPress={() => switchUser(user.id)}
          >
            <Text
              style={[
                styles.buttonText,
                currentUser.id === user.id && styles.buttonTextActive,
              ]}
            >
              {user.name || shortenId(user.id)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateNew}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  label: {
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 80,
  },
  buttonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2196F3',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
});

export default UserSwitcher;

