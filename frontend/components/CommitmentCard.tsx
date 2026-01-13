import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MonthNavigation from './MonthNavigation';
import WeekDaysRow from './WeekDaysRow';
import CalendarGrid from './CalendarGrid';
import { getMonthDays } from './calendarUtils';
import { Commitment } from '../types';

const { width } = Dimensions.get('window');

interface CommitmentCardProps {
  item: Commitment;
  currentMonth: Date;
  isEditing: boolean;
  editedTitle: string;
  onEditChange: (text: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onStartEdit: (id: string, title: string) => void;
  onDelete: (commitment: Commitment) => void;
  isDateCompleted: (commitmentId: string, day: number | null, userId?: string) => boolean;
  onToggleCompletion: (commitmentId: string, day: number | null) => void;
  onMonthChange: (newMonth: Date) => void;
  currentUserId?: string;
  participants?: string[];
  readonly?: boolean;
}

const CommitmentCard: React.FC<CommitmentCardProps> = ({
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
  currentUserId,
  participants = [],
  readonly = false,
}) => {
  const days = getMonthDays(currentMonth);
  const isShared = item.type === 'shared';
  const isCollaborative = item.type === 'collaborative';
  const isCreator = currentUserId && item.userId === currentUserId;
  const showActions = !readonly && !isShared;
  const showEditButton = showActions && (!isCollaborative || isCreator);
  const showShareButton = isCollaborative && isCreator && item.shareCode;

  const handleShare = async () => {
    if (!item.shareCode) return;
    
    try {
      const result = await Share.share({
        message: `Join my collaborative challenge "${item.title}"!\n\nShare code: ${item.shareCode}\n\nUse this code in CommitX to join the challenge.`,
        title: `Share "${item.title}" Challenge`,
      });
      
      // Share was successful (user selected an app)
      if (result.action === Share.sharedAction) {
        // Optional: Could show a success message here
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.message !== 'User did not share') {
        console.error('Error sharing:', error);
      }
    }
  };

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
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
              {isCollaborative && (
                <Text style={styles.typeBadge}>Collaborative</Text>
              )}
              {isShared && (
                <Text style={styles.typeBadge}>Shared (Read-only)</Text>
              )}
            </View>
            {showActions && (
              <View style={styles.cardActions}>
                {showShareButton && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShare}
                  >
                    <Ionicons name="share-outline" size={18} color="#4CAF50" />
                  </TouchableOpacity>
                )}
                {showEditButton && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onStartEdit(item.id, item.title)}
                  >
                    <Ionicons name="create-outline" size={18} color="#ffffff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onDelete(item)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ff4444" />
                </TouchableOpacity>
              </View>
            )}
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
          onToggleCompletion={readonly ? () => {} : onToggleCompletion}
          type={item.type}
          currentUserId={currentUserId}
          participants={participants}
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
  titleContainer: {
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  typeBadge: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
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


