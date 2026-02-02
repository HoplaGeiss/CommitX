import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface OnboardingModalProps {
  visible: boolean;
  onCreateFirstCommitment: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDE_WIDTH = Math.min(SCREEN_WIDTH - 40, 450);
const MODAL_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 700);

interface Slide {
  id: string;
  renderContent: () => React.ReactNode;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onCreateFirstCommitment,
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides: Slide[] = [
    {
      id: 'slide1',
      renderContent: () => (
        <View style={styles.slideContent}>
          <Text style={styles.slideTitleTop}>{t('onboarding.slide1Title')}</Text>

          <ScrollView 
            style={styles.slideScrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Screenshot */}
            <View style={styles.screenshotContainer}>
              <Image
                source={require('../assets/self-commitment-example.png')}
                style={styles.screenshot}
                resizeMode="contain"
              />
            </View>

            <View style={styles.examplesSection}>
              <Text style={styles.sectionTitle}>{t('onboarding.examplesTitle')}</Text>
              <View style={styles.exampleItem}>
                <Ionicons name="close-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.exampleText}>{t('onboarding.example1')}</Text>
              </View>
              <View style={styles.exampleItem}>
                <Ionicons name="nutrition-outline" size={20} color="#4CAF50" />
                <Text style={styles.exampleText}>{t('onboarding.example2')}</Text>
              </View>
              <View style={styles.exampleItem}>
                <Ionicons name="barbell-outline" size={20} color="#4CAF50" />
                <Text style={styles.exampleText}>{t('onboarding.example3')}</Text>
              </View>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>{t('onboarding.slide1CheckInTitle')}</Text>
              <Text style={styles.sectionText}>{t('onboarding.slide1CheckInDescription')}</Text>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>{t('onboarding.slide1PrivacyTitle')}</Text>
              <Text style={styles.sectionText}>{t('onboarding.slide1Description')}</Text>
            </View>
          </ScrollView>
        </View>
      ),
    },
    {
      id: 'slide2',
      renderContent: () => (
        <View style={styles.slideContent}>
          <Text style={styles.slideTitleTop}>{t('onboarding.slide2Title')}</Text>

          <ScrollView 
            style={styles.slideScrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Screenshot */}
            <View style={styles.screenshotContainer}>
              <Image
                source={require('../assets/collaborative-commitment-example.png')}
                style={styles.screenshot}
                resizeMode="contain"
              />
            </View>

            <View style={styles.textSection}>
              <Text style={styles.description}>{t('onboarding.slide2Description')}</Text>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>{t('onboarding.slide2ColorTitle')}</Text>
              <View style={styles.colorExplanation}>
                <View style={styles.colorItem}>
                  <View style={[styles.colorDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.colorText}>{t('onboarding.slide2ColorGreen')}</Text>
                </View>
                <View style={styles.colorItem}>
                  <View style={[styles.colorDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.colorText}>{t('onboarding.slide2ColorBlue')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>{t('onboarding.slide2InviteTitle')}</Text>
              <Text style={styles.sectionText}>{t('onboarding.slide2InviteDescription')}</Text>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>{t('onboarding.slide2LimitTitle')}</Text>
              <Text style={styles.sectionText}>{t('onboarding.slide2LimitDescription')}</Text>
            </View>
          </ScrollView>
        </View>
      ),
    },
    {
      id: 'slide3',
      renderContent: () => (
        <View style={styles.slideContent}>
          <Text style={styles.slideTitleTop}>{t('onboarding.slide3Title')}</Text>

          <ScrollView 
            style={styles.slideScrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.textSection}>
              <Text style={styles.description}>{t('onboarding.slide3Description')}</Text>
            </View>

            <View style={styles.examplesListSection}>
              <Text style={styles.sectionTitle}>{t('onboarding.slide3SelfTitle')}</Text>
              <View style={styles.exampleItem}>
                <Ionicons name="water-outline" size={20} color="#4CAF50" />
                <Text style={styles.exampleText}>{t('onboarding.slide3SelfExample1')}</Text>
              </View>
              <View style={styles.exampleItem}>
                <Ionicons name="book-outline" size={20} color="#4CAF50" />
                <Text style={styles.exampleText}>{t('onboarding.slide3SelfExample2')}</Text>
              </View>
              <View style={styles.exampleItem}>
                <Ionicons name="moon-outline" size={20} color="#4CAF50" />
                <Text style={styles.exampleText}>{t('onboarding.slide3SelfExample3')}</Text>
              </View>
            </View>

            <View style={styles.examplesListSection}>
              <Text style={styles.sectionTitle}>{t('onboarding.slide3CollabTitle')}</Text>
              <View style={styles.exampleItem}>
                <Ionicons name="walk-outline" size={20} color="#2196F3" />
                <Text style={styles.exampleText}>{t('onboarding.slide3CollabExample1')}</Text>
              </View>
              <View style={styles.exampleItem}>
                <Ionicons name="cafe-outline" size={20} color="#2196F3" />
                <Text style={styles.exampleText}>{t('onboarding.slide3CollabExample2')}</Text>
              </View>
              <View style={styles.exampleItem}>
                <Ionicons name="game-controller-outline" size={20} color="#2196F3" />
                <Text style={styles.exampleText}>{t('onboarding.slide3CollabExample3')}</Text>
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
      ),
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SLIDE_WIDTH);
    setCurrentIndex(index);
  };

  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width: SLIDE_WIDTH }]}>
      {item.renderContent()}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Prevent dismissal by back button
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={false}
            style={styles.flatList}
            getItemLayout={(_, index) => ({
              length: SLIDE_WIDTH,
              offset: SLIDE_WIDTH * index,
              index,
            })}
          />

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToSlide(index)}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonLeft]}
              onPress={() => goToSlide(currentIndex - 1)}
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
          {currentIndex < slides.length - 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonRight]}
              onPress={() => goToSlide(currentIndex + 1)}
            >
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: SLIDE_WIDTH,
    height: MODAL_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    height: MODAL_HEIGHT - 60, // Subtract pagination height
  },
  slideContent: {
    flex: 1,
    padding: 24,
  },
  slideHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a2e1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  slideTitleTop: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  slideScrollView: {
    flex: 1,
  },
  textSection: {
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresSection: {
    marginBottom: 20,
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  sectionText: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
  },
  examplesSection: {
    marginBottom: 20,
    backgroundColor: '#1a2e1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3a2a',
  },
  examplesListSection: {
    marginBottom: 20,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 6,
  },
  exampleText: {
    fontSize: 14,
    color: '#cccccc',
    marginLeft: 12,
    flex: 1,
  },
  colorExplanation: {
    marginTop: 8,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  colorText: {
    fontSize: 14,
    color: '#cccccc',
  },
  screenshotContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  screenshot: {
    width: '100%',
    height: 250,
    borderRadius: 8,
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
    marginTop: 10,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444444',
  },
  paginationDotActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navButtonLeft: {
    left: 8,
  },
  navButtonRight: {
    right: 8,
  },
});

export default OnboardingModal;
