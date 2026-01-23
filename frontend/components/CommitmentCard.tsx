import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import WeekDaysRow from './WeekDaysRow';
import CalendarGrid from './CalendarGrid';
import { getMonthDays } from './calendarUtils';
import { Commitment } from '../types';

const { width } = Dimensions.get('window');
const CARD_PADDING = 20;
const MAX_CARD_WIDTH = 600;
const CARD_WIDTH = Math.min(width - (CARD_PADDING * 2), MAX_CARD_WIDTH);

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
  currentUserId,
  participants = [],
  readonly = false,
}) => {
  const { t } = useTranslation();
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
        message: t('commitmentCard.shareMessage', { 
          title: item.title, 
          shareCode: item.shareCode 
        }),
        title: t('commitmentCard.shareTitle', { title: item.title }),
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
            placeholder={t('addCommitment.placeholder')}
            placeholderTextColor="#666666"
            autoFocus
            onSubmitEditing={onEditSubmit}
            onBlur={onEditSubmit}
          />
        ) : (
          <>
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                  {item.title}
                </Text>
                {isCollaborative && (
                  <Text style={styles.typeBadge}>{t('commitmentCard.collaborative')}</Text>
                )}
                {isShared && (
                  <Text style={styles.typeBadge}>{t('commitmentCard.sharedReadonly')}</Text>
                )}
              </View>
            </View>
            {showActions && (
              <View style={styles.cardActions}>
                {showShareButton && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShare}
                  >
                    <Ionicons name="share-outline" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                )}
                {showEditButton && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onStartEdit(item.id, item.title)}
                  >
                    <Ionicons name="create-outline" size={16} color="#ffffff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onDelete(item)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
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
    padding: 10,
    marginBottom: 12,
    width: CARD_WIDTH,
    alignSelf: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 32,
  },
  titleContainer: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  typeBadge: {
    color: '#4CAF50',
    fontSize: 9,
    fontWeight: '500',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 3,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    padding: 4,
  },
  titleInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: '#1a1a1a',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  calendarContainer: {
    marginTop: 0,
  },
});

export default CommitmentCard;


