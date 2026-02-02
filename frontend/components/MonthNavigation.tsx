import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { isNextMonthInFuture } from './calendarUtils';

interface MonthNavigationProps {
  currentMonth: Date;
  onMonthChange: (newMonth: Date) => void;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({ currentMonth, onMonthChange }) => {
  const { i18n } = useTranslation();
  
  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() - 1);
    onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + 1);
    onMonthChange(newMonth);
  };

  // Use the current i18n language for date formatting
  const locale = i18n.language || 'en';
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const nextMonthDisabled = isNextMonthInFuture(currentMonth);

  // Swipe gesture handler
  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const SWIPE_THRESHOLD = 50; // minimum distance for swipe
      
      if (Math.abs(event.velocityX) > Math.abs(event.velocityY)) {
        // Horizontal swipe
        if (event.translationX > SWIPE_THRESHOLD) {
          // Swipe right -> previous month
          handlePreviousMonth();
        } else if (event.translationX < -SWIPE_THRESHOLD && !nextMonthDisabled) {
          // Swipe left -> next month (if not disabled)
          handleNextMonth();
        }
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={handlePreviousMonth}
        >
          <Ionicons name="chevron-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.cardMonth}>
          {currentMonth.toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={nextMonthDisabled ? undefined : handleNextMonth}
          disabled={nextMonthDisabled}
        >
          <Ionicons name="chevron-forward" size={20} color={nextMonthDisabled ? "#333333" : "#ffffff"} />
        </TouchableOpacity>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 0,
    paddingVertical: 4,
  },
  cardMonth: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  monthNavButton: {
    padding: 4,
  },
});

export default MonthNavigation;


