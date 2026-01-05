import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage } from '../utils/storage';
import CommitmentCard from '../components/CommitmentCard';
import DeleteModal from '../components/DeleteModal';
import { isDateInFuture } from '../components/calendarUtils';
import { Commitment, Completion, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CommitmentsList'>;

const { width } = Dimensions.get('window');

const CommitmentsListScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commitmentToDelete, setCommitmentToDelete] = useState<Commitment | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const loadedCommitments = await storage.getCommitments();
    const loadedCompletions = await storage.getCompletions();
    setCommitments(loadedCommitments);
    setCompletions(loadedCompletions);
  };

  const isDateCompleted = (commitmentId: string, day: number | null): boolean => {
    if (!day) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return storage.isDateCompleted(
      completions.filter(c => c.commitmentId === commitmentId),
      date
    );
  };

  const handleToggleCompletion = async (commitmentId: string, day: number | null) => {
    if (!day) return;
    if (isDateInFuture(day, currentMonth)) return;
    
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    await storage.toggleCompletion(commitmentId, date);
    await loadData();
  };

  const handleEditCommitment = async (commitmentId: string, newTitle: string) => {
    if (newTitle.trim()) {
      await storage.updateCommitment(commitmentId, { title: newTitle.trim() });
      await loadData();
    }
  };

  const handleDeleteCommitment = (commitment: Commitment) => {
    setCommitmentToDelete(commitment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (commitmentToDelete) {
      await storage.deleteCommitment(commitmentToDelete.id);
      await loadData();
      setShowDeleteModal(false);
      setCommitmentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCommitmentToDelete(null);
  };

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
  };

  const renderCommitmentCard = ({ item }: { item: Commitment }) => {
    const isEditing = editingId === item.id;

    return (
      <CommitmentCard
        item={item}
        currentMonth={currentMonth}
        isEditing={isEditing}
        editedTitle={editedTitle}
        onEditChange={setEditedTitle}
        onEditSubmit={async () => {
          await handleEditCommitment(item.id, editedTitle);
          setEditingId(null);
          setEditedTitle('');
        }}
        onEditCancel={() => {
          setEditingId(null);
          setEditedTitle('');
        }}
        onStartEdit={(id, title) => {
          setEditingId(id);
          setEditedTitle(title);
        }}
        onDelete={handleDeleteCommitment}
        isDateCompleted={isDateCompleted}
        onToggleCompletion={handleToggleCompletion}
        onMonthChange={handleMonthChange}
      />
    );
  };

  return (
    <>
      <View style={styles.container}>
        <FlatList
          data={commitments}
          renderItem={renderCommitmentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 80 }
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No commitments yet</Text>
              <Text style={styles.emptySubtext}>Tap + to create your first commitment</Text>
            </View>
          }
        />
        <TouchableOpacity
          style={[
            styles.fab,
            { bottom: Math.max(insets.bottom, 20) + 20 }
          ]}
          onPress={() => navigation.navigate('AddCommitment')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <DeleteModal
        visible={showDeleteModal}
        commitment={commitmentToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listContent: {
    padding: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#888888',
    fontSize: 14,
  },
});

export default CommitmentsListScreen;


