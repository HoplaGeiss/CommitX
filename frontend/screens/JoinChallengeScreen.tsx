import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { api } from '../utils/api';
import { storage } from '../utils/storage';
import { useUser } from '../utils/userContext';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinChallenge'>;

const JoinChallengeScreen: React.FC<Props> = ({ navigation }) => {
  const [shareCode, setShareCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useUser();

  const handleJoin = async () => {
    if (!shareCode.trim()) {
      Alert.alert('Error', 'Please enter a share code');
      return;
    }

    setLoading(true);
    try {
      // Join as collaborative challenge
      const collaborativeChallenge = await api.joinChallenge(
        shareCode.trim().toUpperCase(),
        currentUser.id
      );

      // Save the commitment to local storage
      const commitments = await storage.getCommitments();
      // Check if it already exists locally
      const existingIndex = commitments.findIndex(c => c.id === collaborativeChallenge.id);
      if (existingIndex >= 0) {
        // Update existing
        commitments[existingIndex] = collaborativeChallenge;
      } else {
        // Add new
        commitments.push(collaborativeChallenge);
      }
      await storage.saveCommitments(commitments);

      // Fetch and save completions for this commitment
      try {
        const completions = await api.getCompletions(collaborativeChallenge.id);
        const localCompletions = await storage.getCompletions();
        // Merge completions (avoid duplicates)
        const existingCompletionKeys = new Set(
          localCompletions.map(c => `${c.commitmentId}-${c.userId}-${c.date}`)
        );
        const newCompletions = completions
          .filter(c => !existingCompletionKeys.has(`${c.commitmentId}-${c.userId}-${c.date}`))
          .map(c => ({ ...c, synced: true }));
        await storage.saveCompletions([...localCompletions, ...newCompletions]);
      } catch (completionError) {
        console.error('Failed to fetch completions:', completionError);
        // Continue anyway - commitment is saved
      }

      navigation.navigate('CommitmentsList');
      Alert.alert('Success', `Joined "${collaborativeChallenge.title}"`);
    } catch (error) {
      Alert.alert('Error', 'Invalid share code or failed to join challenge. Please check and try again.');
      console.error('Join challenge error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Challenge</Text>
      <Text style={styles.description}>
        Enter a share code to join a collaborative challenge or view a shared challenge
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter share code"
        placeholderTextColor="#666"
        value={shareCode}
        onChangeText={setShareCode}
        autoCapitalize="characters"
        maxLength={8}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Join Challenge</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: '#aaaaaa',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#aaaaaa',
    fontSize: 16,
  },
});

export default JoinChallengeScreen;

