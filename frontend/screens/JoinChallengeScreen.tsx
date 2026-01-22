import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { api } from '../utils/api';
import { storage } from '../utils/storage';
import { useUser } from '../utils/userContext';
import AlertModal, { AlertType } from '../components/AlertModal';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinChallenge'>;

const JoinChallengeScreen: React.FC<Props> = ({ navigation }) => {
  const [shareCode, setShareCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useUser();
  const { t } = useTranslation();
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlert({ visible: true, type, title, message });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const handleJoin = async () => {
    if (!shareCode.trim()) {
      showAlert('error', t('joinChallenge.error'), t('joinChallenge.errorEmptyCode'));
      return;
    }

    setLoading(true);
    try {
      // Join as collaborative challenge
      const collaborativeChallenge = await api.joinChallenge(
        shareCode.trim(),
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
      showAlert('success', t('joinChallenge.success'), t('joinChallenge.successMessage', { title: collaborativeChallenge.title }));
    } catch (error: any) {
      // Handle specific error messages from backend
      const errorMessage = error?.message || error?.response?.data?.message || t('joinChallenge.errorInvalidCode');
      
      // Check if it's a participant limit error
      if (errorMessage.includes('full') || errorMessage.includes('Maximum 2 participants')) {
        showAlert('warning', t('joinChallenge.errorFull'), t('joinChallenge.errorFullMessage'));
      } else {
        showAlert('error', t('joinChallenge.error'), errorMessage);
      }
      console.error('Join challenge error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('joinChallenge.title')}</Text>
      <Text style={styles.description}>
        {t('joinChallenge.description')}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t('joinChallenge.placeholder')}
        placeholderTextColor="#666"
        value={shareCode}
        onChangeText={setShareCode}
        keyboardType="number-pad"
        maxLength={6}
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
          <Text style={styles.buttonText}>{t('joinChallenge.button')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
      </TouchableOpacity>

      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
      />
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

