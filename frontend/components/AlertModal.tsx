import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertModalProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  autoDismiss?: number; // Deprecated - auto-dismiss is disabled, alerts must be manually dismissed
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  autoDismiss,
}) => {
  const { t } = useTranslation();
  // Auto-dismiss removed - alerts must be manually dismissed by user

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          name: 'checkmark-circle' as const,
          color: '#4CAF50',
          bgColor: '#1a2e1a',
          borderColor: '#4CAF50',
        };
      case 'error':
        return {
          name: 'close-circle' as const,
          color: '#ff4444',
          bgColor: '#2e1a1a',
          borderColor: '#ff4444',
        };
      case 'warning':
        return {
          name: 'warning' as const,
          color: '#ff9800',
          bgColor: '#2e241a',
          borderColor: '#ff9800',
        };
      case 'info':
      default:
        return {
          name: 'information-circle' as const,
          color: '#2196F3',
          bgColor: '#1a1e2e',
          borderColor: '#2196F3',
        };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContentContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <View
                  style={[
                    styles.modalIconCircle,
                    {
                      backgroundColor: iconConfig.bgColor,
                      borderColor: iconConfig.borderColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={iconConfig.name}
                    size={40}
                    color={iconConfig.color}
                  />
                </View>
              </View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalMessage}>{message}</Text>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: iconConfig.color },
                ]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  modalMessage: {
    color: '#aaaaaa',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default AlertModal;
