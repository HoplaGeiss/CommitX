import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { storage } from '../utils/storage';
import { api } from '../utils/api';
import { useUser } from '../utils/userContext';
import { RootStackParamList, ChallengeType } from '../types';
import ChallengeTypeSelector from '../components/ChallengeTypeSelector';
import AlertModal, { AlertType } from '../components/AlertModal';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCommitment'>;

const AddCommitmentScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ChallengeType>('self');
  const { currentUser } = useUser();
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

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      if (type === 'self') {
        // Local-only commitment
        await storage.addCommitment({
          title: title.trim(),
          type: 'self',
          userId: currentUser.id,
        });
        navigation.goBack();
      } else {
        // Collaborative or shared - create via API
        const commitment = await api.createCommitment({
          title: title.trim(),
          type,
          userId: currentUser.id,
        });

        // Save to local storage with backend ID
        const commitments = await storage.getCommitments();
        commitments.push(commitment);
        await storage.saveCommitments(commitments);

        // If collaborative, share the code using native share sheet
        if (type === 'collaborative' && commitment.shareCode) {
          try {
            await Share.share({
              message: `Join my collaborative challenge "${commitment.title}"!\n\nShare code: ${commitment.shareCode}\n\nUse this code in CommitX to join the challenge.`,
              title: `Share "${commitment.title}" Challenge`,
            });
          } catch (error: any) {
            // User cancelled or error occurred - that's okay, just navigate back
            if (error.message !== 'User did not share') {
              console.error('Error sharing:', error);
            }
          }
        }
        
        navigation.goBack();
      }
    } catch (error) {
      showAlert('error', 'Error', 'Failed to create commitment. Please try again.');
      console.error('Error creating commitment:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter commitment title"
          placeholderTextColor="#666666"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <ChallengeTypeSelector selectedType={type} onTypeChange={setType} />

        <TouchableOpacity
          style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!title.trim()}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: 18,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333333',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
});

export default AddCommitmentScreen;


