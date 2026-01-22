import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const DAYS_IN_WEEK = 7;
const CARD_PADDING = 20;
const CARD_WIDTH = width - (CARD_PADDING * 2);
const CELL_SIZE = (CARD_WIDTH - 32) / DAYS_IN_WEEK;

const WeekDaysRow: React.FC = () => {
  const { t } = useTranslation();
  
  const weekDays = [
    t('weekDays.mon'),
    t('weekDays.tue'),
    t('weekDays.wed'),
    t('weekDays.thu'),
    t('weekDays.fri'),
    t('weekDays.sat'),
    t('weekDays.sun'),
  ];
  
  return (
    <View style={styles.weekDaysRow}>
      {weekDays.map((day, index) => (
        <View key={index} style={styles.weekDayCell}>
          <Text style={styles.weekDayText}>{day}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 2,
    height: 20,
  },
  weekDayCell: {
    width: CELL_SIZE - 4,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  weekDayText: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '600',
  },
});

export default WeekDaysRow;


