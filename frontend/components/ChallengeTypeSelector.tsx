import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChallengeType } from '../types';

interface ChallengeTypeSelectorProps {
  selectedType: ChallengeType;
  onTypeChange: (type: ChallengeType) => void;
}

const ChallengeTypeSelector: React.FC<ChallengeTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const { t } = useTranslation();
  
  const types: { value: ChallengeType; labelKey: string }[] = [
    { value: 'self', labelKey: 'challengeType.self' },
    { value: 'collaborative', labelKey: 'challengeType.collaborative' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('challengeType.label')}</Text>
      <View style={styles.buttonGroup}>
        {types.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.button,
              selectedType === type.value && styles.buttonActive,
            ]}
            onPress={() => onTypeChange(type.value)}
          >
            <Text
              style={[
                styles.buttonText,
                selectedType === type.value && styles.buttonTextActive,
              ]}
            >
              {t(type.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default ChallengeTypeSelector;

