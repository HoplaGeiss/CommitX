import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { storage } from '../utils/storage';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCommitment'>;

const AddCommitmentScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');

  const handleSave = async () => {
    if (title.trim()) {
      await storage.addCommitment({ title: title.trim() });
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
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
        <TouchableOpacity
          style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!title.trim()}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
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
});

export default AddCommitmentScreen;


