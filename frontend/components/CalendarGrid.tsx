import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Polygon, ClipPath, Defs, Rect } from 'react-native-svg';
import { isDateInFuture, isToday } from './calendarUtils';
import { ChallengeType } from '../types';

const { width } = Dimensions.get('window');
const DAYS_IN_WEEK = 7;
const CARD_PADDING = 20;
const CARD_WIDTH = width - (CARD_PADDING * 2);
const CELL_SIZE = (CARD_WIDTH - 32) / DAYS_IN_WEEK;

interface CalendarGridProps {
  days: (number | null)[];
  commitmentId: string;
  currentMonth: Date;
  isDateCompleted: (commitmentId: string, day: number | null, userId?: string) => boolean;
  onToggleCompletion: (commitmentId: string, day: number | null) => void;
  type?: ChallengeType;
  currentUserId?: string;
  participants?: string[];
}

interface SplitTriangleCellProps {
  day: number;
  cellSize: number;
  isFuture: boolean;
  isTodayDate: boolean;
  userACompleted: boolean;
  userBCompleted: boolean;
  onPress: () => void;
}

const SplitTriangleCell: React.FC<SplitTriangleCellProps> = ({
  day,
  cellSize,
  isFuture,
  isTodayDate,
  userACompleted,
  userBCompleted,
  onPress,
}) => {
  const containerSize = cellSize - 4;
  const topLeftColor = userACompleted ? '#4CAF50' : '#2a2a2a';
  const bottomRightColor = userBCompleted ? '#2196F3' : '#2a2a2a';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.calendarCell,
        isFuture && styles.calendarCellFuture,
      ]}
      onPress={onPress}
      disabled={isFuture}
    >
      <View style={StyleSheet.absoluteFill}>
        <Svg width={containerSize} height={containerSize} viewBox={`0 0 ${containerSize} ${containerSize}`}>
          <Defs>
            <ClipPath id={`clip-${day}`}>
              <Rect width={containerSize} height={containerSize} rx="8" ry="8" />
            </ClipPath>
          </Defs>
          <g clipPath={`url(#clip-${day})`}>
            {/* Top-left triangle (User A - Current User) */}
            <Polygon
              points={`0,0 ${containerSize},0 0,${containerSize}`}
              fill={topLeftColor}
              opacity={isFuture ? 0.4 : 1}
            />
            {/* Bottom-right triangle (User B - Other Users) */}
            <Polygon
              points={`${containerSize},0 ${containerSize},${containerSize} 0,${containerSize}`}
              fill={bottomRightColor}
              opacity={isFuture ? 0.4 : 1}
            />
          </g>
        </Svg>
        {/* Border for today - render on top as a View to ensure it shows fully */}
        {isTodayDate && (
          <View style={styles.todayBorder} />
        )}
      </View>
      <Text
        style={[
          styles.calendarDayText,
          isFuture && styles.calendarDayTextFuture,
        ]}
      >
        {day}
      </Text>
    </TouchableOpacity>
  );
};

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  days, 
  commitmentId, 
  currentMonth, 
  isDateCompleted, 
  onToggleCompletion,
  type = 'self',
  currentUserId,
  participants = [],
}) => {
  const isCollaborative = type === 'collaborative';
  
  // Always put current user in top-left (green), others in bottom-right (blue)
  const currentUserInParticipants = currentUserId && participants.includes(currentUserId);
  const otherParticipants = participants.filter(p => p !== currentUserId);
  const hasOtherParticipants = otherParticipants.length > 0;

  return (
    <View style={styles.calendarGrid} pointerEvents="box-none">
      {days.map((day, index) => {
        if (!day) {
          return <View key={index} style={styles.calendarCellEmpty} />;
        }
        const isFuture = isDateInFuture(day, currentMonth);
        const isTodayDate = isToday(day, currentMonth);
        
        if (isCollaborative && currentUserId && (currentUserInParticipants || hasOtherParticipants)) {
          // Split triangle cell for collaborative
          // Current user always in top-left (green)
          const currentUserCompleted = isDateCompleted(commitmentId, day, currentUserId);
          
          // Other users in bottom-right (blue) - check if any other participant completed
          const otherUserCompleted = hasOtherParticipants && otherParticipants.some(
            userId => {
              const completed = isDateCompleted(commitmentId, day, userId);
              // Debug: verify we're not treating current user's completion as someone else's
              if (completed && userId === currentUserId) {
                console.warn('Completion belongs to current user but was checked as other user:', {
                  commitmentId,
                  day,
                  userId,
                  currentUserId,
                });
              }
              return completed;
            }
          );
          
          return (
            <SplitTriangleCell
              key={index}
              day={day}
              cellSize={CELL_SIZE}
              isFuture={isFuture}
              isTodayDate={isTodayDate}
              userACompleted={currentUserCompleted}
              userBCompleted={otherUserCompleted}
              onPress={() => onToggleCompletion(commitmentId, day)}
            />
          );
        } else {
          // Regular cell for self/shared
          const isCompleted = isDateCompleted(commitmentId, day);
          
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
        }
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
  todayBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
    pointerEvents: 'none',
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


