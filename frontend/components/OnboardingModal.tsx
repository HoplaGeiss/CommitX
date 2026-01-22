import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface OnboardingModalProps {
  visible: boolean;
  onCreateFirstCommitment: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onCreateFirstCommitment,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Prevent dismissal by back button
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={48} color="#4CAF50" />
              </View>
              <Text style={styles.title}>{t('onboarding.title')}</Text>
              <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name="checkbox-outline" size={28} color="#4CAF50" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{t('onboarding.feature1Title')}</Text>
                  <Text style={styles.featureDescription}>{t('onboarding.feature1Description')}</Text>
                </View>
              </View>

              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name="person-outline" size={28} color="#2196F3" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{t('onboarding.feature2Title')}</Text>
                  <Text style={styles.featureDescription}>{t('onboarding.feature2Description')}</Text>
                </View>
              </View>

              <View style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name="people-outline" size={28} color="#ff9800" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{t('onboarding.feature3Title')}</Text>
                  <Text style={styles.featureDescription}>{t('onboarding.feature3Description')}</Text>
                </View>
              </View>
            </View>

            {/* Call to Action */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={onCreateFirstCommitment}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>{t('onboarding.cta')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  content: {
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a2e1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    paddingTop: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  featureDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
});

export default OnboardingModal;
