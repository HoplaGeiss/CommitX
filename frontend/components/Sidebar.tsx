import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import { api } from '../utils/api';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onClearStorage: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, onClose, onClearStorage }) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Dev tools visibility controlled by EXPO_PUBLIC_DEV_MODE env variable
  const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

  const faqItems: FAQItem[] = [
    {
      question: "How do I create a commitment?",
      answer: "Tap the + button at the bottom right. Choose 'Personal' for your own commitment or 'Collaborative' to share with friends.",
      icon: "add-circle-outline"
    },
    {
      question: "What's a collaborative commitment?",
      answer: "A collaborative commitment lets you track progress with friends. Create one and share the code, or join using a friend's code.",
      icon: "people-outline"
    },
    {
      question: "How do I join a friend's challenge?",
      answer: "Tap the + button and select 'Join'. Enter the 6-digit code your friend gave you to join their challenge.",
      icon: "enter-outline"
    },
    {
      question: "How do I mark a day as complete?",
      answer: "Tap any day in your commitment's calendar. The day will turn green to show completion. Tap again to undo.",
      icon: "checkmark-circle-outline"
    },
    {
      question: "How do I delete a commitment?",
      answer: "Tap the three dots on a commitment card and select 'Delete'. For collaborative ones, you'll leave the challenge.",
      icon: "trash-outline"
    }
  ];

  const handleTestBackendSentry = async () => {
    try {
      await api.testSentry();
    } catch (error) {
      Alert.alert('Expected Error', 'Backend threw test error (check Sentry dashboard)');
    }
  };

  const handleTestMobileSentry = () => {
    try {
      Sentry.captureException(new Error('Test mobile Sentry error'));
      const envNote = __DEV__ 
        ? '\n\nNote: In dev mode, set EXPO_PUBLIC_FORCE_SENTRY=true in .env to enable Sentry'
        : '';
      Alert.alert('Test Sent', `Test error sent to Sentry Mobile project${envNote}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send test error to Sentry');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.sidebar}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContent} 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={true}
          >
            {/* Developer Tools - Only in dev mode - SHOWN FIRST */}
            {isDevMode && (
              <View style={styles.devSection}>
                <Text style={styles.sectionTitle}>Developer Tools</Text>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleTestBackendSentry}
                >
                  <Ionicons name="bug-outline" size={20} color="#ff9800" />
                  <Text style={styles.menuItemText}>Test Backend Sentry</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleTestMobileSentry}
                >
                  <Ionicons name="bug-outline" size={20} color="#ff9800" />
                  <Text style={styles.menuItemText}>Test Mobile Sentry</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.dangerItem]}
                  onPress={() => {
                    onClose();
                    onClearStorage();
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  <Text style={[styles.menuItemText, styles.dangerText]}>Clear Storage</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* FAQ Section - Always visible */}
            <View style={styles.faqSection}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              
              {faqItems.map((item, index) => (
                <View key={index} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <Ionicons 
                      name={item.icon} 
                      size={20} 
                      color="#4CAF50" 
                      style={styles.faqIcon}
                    />
                    <Text style={styles.faqQuestionText}>{item.question}</Text>
                    <Ionicons 
                      name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                  
                  {expandedFaq === index && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    minHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  faqSection: {
    marginBottom: 30,
    marginTop: 10,
  },
  faqItem: {
    marginBottom: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  faqIcon: {
    marginRight: 10,
  },
  faqQuestionText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  faqAnswer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 0,
  },
  faqAnswerText: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 30,
  },
  devSection: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 10,
  },
  menuItemText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  dangerItem: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff444433',
  },
  dangerText: {
    color: '#ff4444',
  },
});

export default Sidebar;
