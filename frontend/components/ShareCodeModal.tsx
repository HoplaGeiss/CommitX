import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface ShareCodeModalProps {
  visible: boolean;
  shareCode: string;
  onClose: () => void;
}

const ShareCodeModal: React.FC<ShareCodeModalProps> = ({
  visible,
  shareCode,
  onClose,
}) => {
  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(shareCode);
      Alert.alert('Copied!', 'Share code copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy share code');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Share Code</Text>
          <Text style={styles.description}>
            Share this code with others to let them join or view your challenge
          </Text>
          <View style={styles.codeContainer}>
            <Text style={styles.code}>{shareCode}</Text>
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.copyButton]}
              onPress={copyToClipboard}
            >
              <Text style={styles.buttonText}>Copy Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  code: {
    color: '#4CAF50',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShareCodeModal;

