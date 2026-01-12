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
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { storage } from '../utils/storage';
import { api } from '../utils/api';
import { useUser } from '../utils/userContext';
import { RootStackParamList, ChallengeType } from '../types';
import ChallengeTypeSelector from '../components/ChallengeTypeSelector';
import ShareCodeModal from '../components/ShareCodeModal';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCommitment'>;

const AddCommitmentScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ChallengeType>('self');
  const [showShareCodeModal, setShowShareCodeModal] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const { currentUser } = useUser();

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

        // If collaborative, show share code
        if (type === 'collaborative' && commitment.shareCode) {
          setShareCode(commitment.shareCode);
          setShowShareCodeModal(true);
        } else {
          navigation.goBack();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create commitment. Please try again.');
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

        {type === 'shared' && (
          <Text style={styles.hint}>
            To view a shared challenge, use the "Join Challenge" option from the home screen.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!title.trim()}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      <ShareCodeModal
        visible={showShareCodeModal}
        shareCode={shareCode}
        onClose={() => {
          setShowShareCodeModal(false);
          navigation.goBack();
        }}
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


