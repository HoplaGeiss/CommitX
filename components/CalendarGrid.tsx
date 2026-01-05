import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { isDateInFuture, isToday } from './calendarUtils';

const { width } = Dimensions.get('window');
const DAYS_IN_WEEK = 7;
const CARD_PADDING = 20;
const CARD_WIDTH = width - (CARD_PADDING * 2);
const CELL_SIZE = (CARD_WIDTH - 32) / DAYS_IN_WEEK;

interface CalendarGridProps {
  days: (number | null)[];
  commitmentId: string;
  currentMonth: Date;
  isDateCompleted: (commitmentId: string, day: number | null) => boolean;
  onToggleCompletion: (commitmentId: string, day: number | null) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  days, 
  commitmentId, 
  currentMonth, 
  isDateCompleted, 
  onToggleCompletion 
}) => {
  return (
    <View style={styles.calendarGrid} pointerEvents="box-none">
      {days.map((day, index) => {
        if (!day) {
          return <View key={index} style={styles.calendarCellEmpty} />;
        }
        const isFuture = isDateInFuture(day, currentMonth);
        const isCompleted = isDateCompleted(commitmentId, day);
        const isTodayDate = isToday(day, currentMonth);
        
        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            style={[
              styles.calendarCell,
              isCompleted && styles.calendarCellCompleted,
              isTodayDate && styles.calendarCellToday,
              isFuture && styles.calendarCellFuture,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (!isFuture) {
                onToggleCompletion(commitmentId, day);
              }
            }}
            disabled={isFuture}
          >
            <Text
              style={[
                styles.calendarDayText,
                isCompleted && styles.calendarDayTextCompleted,
                isFuture && styles.calendarDayTextFuture,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarCellEmpty: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    margin: 2,
    backgroundColor: 'transparent',
  },
  calendarCellCompleted: {
    backgroundColor: '#4CAF50',
  },
  calendarCellToday: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  calendarCellFuture: {
    opacity: 0.4,
  },
  calendarDayText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
  calendarDayTextCompleted: {
    color: '#ffffff',
  },
  calendarDayTextFuture: {
    color: '#666666',
  },
});

export default CalendarGrid;


