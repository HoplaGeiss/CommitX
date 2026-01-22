import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.monthNavButton}
        onPress={handlePreviousMonth}
      >
        <Ionicons name="chevron-back" size={16} color="#888888" />
      </TouchableOpacity>
      <Text style={styles.cardMonth}>
        {currentMonth.toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' })}
      </Text>
      {!isNextMonthInFuture(currentMonth) && (
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={handleNextMonth}
        >
          <Ionicons name="chevron-forward" size={16} color="#888888" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 0,
    paddingVertical: 2,
  },
  cardMonth: {
    color: '#888888',
    fontSize: 11,
  },
  monthNavButton: {
    padding: 2,
  },
});

export default MonthNavigation;


