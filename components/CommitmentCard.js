import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MonthNavigation from './MonthNavigation';
import WeekDaysRow from './WeekDaysRow';
import CalendarGrid from './CalendarGrid';
import { getMonthDays } from './calendarUtils';

const { width } = Dimensions.get('window');

const CommitmentCard = ({
  item,
  currentMonth,
  isEditing,
  editedTitle,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onStartEdit,
  onDelete,
  isDateCompleted,
  onToggleCompletion,
  onMonthChange,
}) => {
  const days = getMonthDays(currentMonth);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {isEditing ? (
          <TextInput
            style={styles.titleInput}
            value={editedTitle}
            onChangeText={onEditChange}
            placeholder="Enter commitment title"
            placeholderTextColor="#666666"
            autoFocus
            onSubmitEditing={onEditSubmit}
            onBlur={onEditSubmit}
          />
        ) : (
          <>
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onStartEdit(item.id, item.title)}
              >
                <Ionicons name="create-outline" size={18} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDelete(item)}
              >
                <Ionicons name="trash-outline" size={18} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      <MonthNavigation
        currentMonth={currentMonth}
        onMonthChange={onMonthChange}
      />
      <View style={styles.calendarContainer}>
        <WeekDaysRow />
        <CalendarGrid
          days={days}
          commitmentId={item.id}
          currentMonth={currentMonth}
          isDateCompleted={isDateCompleted}
          onToggleCompletion={onToggleCompletion}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: width - (20 * 2),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 40,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  titleInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  calendarContainer: {
    marginTop: 0,
  },
});

export default CommitmentCard;

