import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../utils/storage';
import { api } from '../utils/api';
import { syncService } from '../utils/syncService';
import { useUser } from '../utils/userContext';
import UserSwitcher from '../components/UserSwitcher';
import CommitmentCard from '../components/CommitmentCard';
import DeleteModal from '../components/DeleteModal';
import ActionSheet from '../components/ActionSheet';
import { isDateInFuture } from '../components/calendarUtils';
import { Commitment, Completion, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CommitmentsList'>;

const { width } = Dimensions.get('window');

const CommitmentsListScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commitmentToDelete, setCommitmentToDelete] = useState<Commitment | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [participantsMap, setParticipantsMap] = useState<Record<string, string[]>>({});
  const [hasInitialSync, setHasInitialSync] = useState(false);
  // Track if we just deleted the default commitment to prevent recreation
  const justDeletedDefaultRef = useRef<boolean>(false);

  // Initial sync on startup - fetch collaborative commitments from server
  useEffect(() => {
    if (!hasInitialSync && currentUser.id) {
      initialSync();
    }
  }, [currentUser.id, hasInitialSync]);

  useFocusEffect(
    useCallback(() => {
      // Load from local storage only - no sync
      loadData();
    }, [currentUser.id])
  );

  useEffect(() => {
    // Set up callback to refresh UI after push sync completes (if needed)
    syncService.setOnSyncComplete(() => {
      // Only refresh if we pushed changes
    });

    // Start periodic push sync for collaborative commitments (push only, no pull)
    syncService.startPeriodicSync(currentUser.id, 30000);
    return () => {
      syncService.stopPeriodicSync();
      syncService.setOnSyncComplete(() => {});
    };
  }, [currentUser.id]);

  const initialSync = async () => {
    try {
      // Load local commitments first (for immediate display)
      const localCommitments = await storage.getCommitments();
      const localCompletions = await storage.getCompletions();
      setCommitments(localCommitments);
      setCompletions(localCompletions);
      updateParticipantsMap(localCommitments, localCompletions);
      
      // Fetch collaborative commitments from server
      if (!currentUser.id) {
        console.warn('No current user ID, skipping initial sync');
        setHasInitialSync(true);
        return;
      }
      
      const serverCollaborativeCommitments = await api.getCollaborativeCommitments(currentUser.id);
      
      // Merge commitments: keep self commitments, update/add collaborative ones (exclude deleted)
      const localSelfCommitments = localCommitments.filter(c => c.type === 'self');
      const commitmentMap = new Map<string, Commitment>();
      localSelfCommitments.forEach(c => commitmentMap.set(c.id, c));
      // Only add non-deleted collaborative commitments from server
      serverCollaborativeCommitments
        .filter(c => !c.deleted)
        .forEach(c => commitmentMap.set(c.id, c));
      
      const mergedCommitments = Array.from(commitmentMap.values());
      await storage.saveCommitments(mergedCommitments);
      
      // Fetch completions for collaborative commitments
      const collaborativeCommitmentIds = serverCollaborativeCommitments.map(c => c.id);
      
      // Build completion map: start with user's own local completions only
      const completionKey = (c: Completion) => `${c.commitmentId}-${c.userId}-${c.date}`;
      const completionMap = new Map<string, Completion>();
      
      // Keep only user's own completions and self commitment completions from local storage
      localCompletions
        .filter(c => c.userId === currentUser.id || !collaborativeCommitmentIds.includes(c.commitmentId))
        .forEach(c => {
          completionMap.set(completionKey(c), c);
        });
      
      // Fetch and merge server completions for each collaborative commitment
      // This will REPLACE other users' completions with fresh data from backend
      for (const commitmentId of collaborativeCommitmentIds) {
        try {
          const serverCompletions = await api.getCompletions(commitmentId);
          
          // Get user's local completions for this commitment (exclude deleted)
          const userLocalCompletions = localCompletions.filter(
            c => c.commitmentId === commitmentId && c.userId === currentUser.id && !c.deleted
          );
          
          // Get user's completions from server (all, including deleted)
          const userServerCompletions = serverCompletions.filter(c => c.userId === currentUser.id);
          
          console.log(`🔄 Reconciling commitment ${commitmentId} for user ${currentUser.id}:`);
          console.log(`  Local completions (${userLocalCompletions.length}):`, userLocalCompletions.map(c => ({ date: c.date, updatedAt: c.updatedAt, deleted: c.deleted })));
          console.log(`  Server completions (${userServerCompletions.length}):`, userServerCompletions.map(c => ({ date: c.date, updatedAt: c.updatedAt, deleted: c.deleted })));
          
          // Build maps for quick lookup
          const serverCompletionsByDate = new Map<string, typeof serverCompletions[0]>();
          userServerCompletions.forEach(c => serverCompletionsByDate.set(c.date, c));
          
          const localCompletionsByDate = new Map<string, typeof userLocalCompletions[0]>();
          userLocalCompletions.forEach(c => localCompletionsByDate.set(c.date, c));
          
          // Reconcile user's completions using timestamps
          for (const localCompletion of userLocalCompletions) {
            const serverCompletion = serverCompletionsByDate.get(localCompletion.date);
            
            if (!serverCompletion) {
              // Completion exists locally but not on server - push to backend
              try {
                console.log(`Reconciling: pushing missing completion to backend: ${localCompletion.commitmentId} ${localCompletion.date}`);
                await api.toggleCompletion(localCompletion.commitmentId, localCompletion.date, localCompletion.userId);
                // Mark as synced in the completion map
                const key = completionKey(localCompletion);
                const existingCompletion = completionMap.get(key);
                if (existingCompletion) {
                  completionMap.set(key, { ...existingCompletion, synced: true });
                }
              } catch (error) {
                console.error('Failed to reconcile completion:', error);
              }
            } else if (serverCompletion.deleted) {
              // Server has it marked as deleted - remove from local
              console.log(`Reconciling: server marked as deleted, removing from local: ${localCompletion.commitmentId} ${localCompletion.date}`);
              const key = completionKey(localCompletion);
              completionMap.delete(key); // Remove from map, won't be saved
            } else {
              // Completion exists in both - compare timestamps with tolerance
              const localTime = localCompletion.updatedAt ? new Date(localCompletion.updatedAt).getTime() : 0;
              const serverTime = serverCompletion.updatedAt ? new Date(serverCompletion.updatedAt).getTime() : 0;
              const timeDiff = Math.abs(localTime - serverTime);
              const TOLERANCE_MS = 5000; // 5 seconds tolerance for network/sync delays
              
              if (timeDiff <= TOLERANCE_MS) {
                // Timestamps are close enough - consider them the same, no action needed
                // Keep local version (already in map)
              } else if (localTime > serverTime) {
                // Local is significantly newer - push to backend
                try {
                  console.log(`Reconciling: local is newer, pushing to backend: ${localCompletion.commitmentId} ${localCompletion.date}`);
                  await api.toggleCompletion(localCompletion.commitmentId, localCompletion.date, localCompletion.userId);
                  const key = completionKey(localCompletion);
                  const existingCompletion = completionMap.get(key);
                  if (existingCompletion) {
                    completionMap.set(key, { ...existingCompletion, synced: true });
                  }
                } catch (error) {
                  console.error('Failed to push newer local completion:', error);
                }
              } else if (serverTime > localTime) {
                // Server is significantly newer - use server version
                console.log(`Reconciling: server is newer, using server version: ${localCompletion.commitmentId} ${localCompletion.date}`);
                const key = completionKey(localCompletion);
                completionMap.set(key, { ...serverCompletion, synced: true });
              }
            }
          }
          
          // Handle completions that exist on server but not locally (pull from server)
          for (const serverCompletion of userServerCompletions) {
            if (!localCompletionsByDate.has(serverCompletion.date)) {
              if (!serverCompletion.deleted) {
                // Completion exists on server and not deleted - pull from server
                console.log(`Reconciling: pulling missing completion from server: ${serverCompletion.commitmentId} ${serverCompletion.date}`);
                const key = completionKey(serverCompletion);
                completionMap.set(key, { ...serverCompletion, synced: true });
              }
              // If server has it as deleted, don't add to local (skip)
            }
          }
          
          // Add other users' completions from server (exclude deleted)
          serverCompletions
            .filter(c => c.userId !== currentUser.id && !c.deleted)
            .forEach(c => {
              completionMap.set(completionKey(c), {
                ...c,
                synced: true, // Server completions are always synced
              });
            });
        } catch (error) {
          console.error(`Failed to fetch completions for ${commitmentId}:`, error);
        }
      }
      
      const allCompletions = Array.from(completionMap.values());
      await storage.saveCompletions(allCompletions);
      
      // Update state with merged data
      setCommitments(mergedCommitments);
      setCompletions(allCompletions);
      
      // Derive participants from completions
      updateParticipantsMap(mergedCommitments, allCompletions);
      
      setHasInitialSync(true);
    } catch (error) {
      console.error('Failed to fetch collaborative commitments on startup:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        userId: currentUser.id,
      });
      // On error, just load local data (already loaded above)
      setHasInitialSync(true);
    }
  };

  const updateParticipantsMap = (commitmentsList: Commitment[], completionsList: Completion[]) => {
    const participants: Record<string, string[]> = {};
    const collaborativeCommitments = commitmentsList.filter(c => c.type === 'collaborative');
    
    collaborativeCommitments.forEach((commitment) => {
      if (commitment.id) {
        const commitmentCompletions = completionsList.filter(c => c.commitmentId === commitment.id);
        const uniqueUserIds = Array.from(new Set(commitmentCompletions.map(c => c.userId)));
        
        // Always include current user in participants, even if they haven't completed anything yet
        // This ensures the current user is always recognized as "self"
        if (currentUser.id && !uniqueUserIds.includes(currentUser.id)) {
          uniqueUserIds.push(currentUser.id);
        }
        
        participants[commitment.id] = uniqueUserIds;
      }
    });
    
    setParticipantsMap(participants);
  };

  const loadData = async () => {
    // Load from local storage immediately (no blocking)
    let loadedCommitments = await storage.getCommitments();
    
    // If we just deleted the default commitment, skip creation and reset the ref
    if (justDeletedDefaultRef.current) {
      justDeletedDefaultRef.current = false;
      const loadedCompletions = await storage.getCompletions();
      setCommitments(loadedCommitments);
      setCompletions(loadedCompletions);
      updateParticipantsMap(loadedCommitments, loadedCompletions);
      return;
    }
    
    // If no commitments exist and default commitment hasn't been created yet for this user,
    // create a default one for first-time users (only once per user)
    if (loadedCommitments.length === 0 && currentUser.id) {
      const hasDefaultBeenCreated = await storage.hasDefaultCommitmentBeenCreated(currentUser.id);
      if (!hasDefaultBeenCreated) {
        // Double-check that no commitment with this title exists (safety check)
        const existingDefault = loadedCommitments.find(
          c => c.title === 'Your first commitment' && c.userId === currentUser.id
        );
        
        if (!existingDefault) {
          // Set the flag FIRST to prevent race conditions if loadData() is called again
          await storage.setDefaultCommitmentCreated(currentUser.id);
          // Then create the commitment
          await storage.addCommitment({
            title: 'Your first commitment',
            type: 'self',
            userId: currentUser.id,
          });
          loadedCommitments = await storage.getCommitments();
        } else {
          // If it exists but flag wasn't set, set the flag now
          await storage.setDefaultCommitmentCreated(currentUser.id);
        }
      }
    }
    
    const loadedCompletions = await storage.getCompletions();
    setCommitments(loadedCommitments);
    setCompletions(loadedCompletions);
    
    // Derive participants from completions
    updateParticipantsMap(loadedCommitments, loadedCompletions);
  };

  const isDateCompleted = (commitmentId: string, day: number | null, userId?: string): boolean => {
    if (!day) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return storage.isDateCompleted(
      completions.filter(c => c.commitmentId === commitmentId && !c.deleted),
      date,
      userId
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
    
    const commitment = commitments.find(c => c.id === commitmentId);
    if (commitment?.type === 'self') {
      // Self commitments: local-only, no backend calls
      await storage.toggleCompletion(commitmentId, date, currentUser.id);
      await loadData();
    } else if (commitment?.type === 'collaborative') {
      // 1. Update local storage immediately (optimistic update)
      await storage.toggleCompletion(commitmentId, date, currentUser.id);
      await loadData();
      
      // 2. Push to backend immediately (non-blocking)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      
      try {
        await api.toggleCompletion(commitmentId, dateStr, currentUser.id);
        // Mark as synced on success
        await storage.markCompletionSyncedByDate(commitmentId, dateStr, currentUser.id);
      } catch (error) {
        console.error('Failed to sync completion to backend:', error);
        // Completion stays marked as unsynced in local storage
        // Will be retried in background sync
      }
    }
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
      // Check if this is the default commitment
      const isDefaultCommitment = commitmentToDelete.title === 'Your first commitment' && 
                                   commitmentToDelete.type === 'self' && 
                                   commitmentToDelete.userId === currentUser.id;
      
      if (isDefaultCommitment) {
        // Set flag first to prevent recreation
        await storage.setDefaultCommitmentCreated(currentUser.id);
        // Set ref to skip creation in the next loadData() call
        justDeletedDefaultRef.current = true;
      }
      
      // Delete from local storage
      await storage.deleteCommitment(commitmentToDelete.id);
      
      // If it's a collaborative commitment, delete/leave from backend
      if (commitmentToDelete.type === 'collaborative' && !commitmentToDelete.id.startsWith('local-')) {
        try {
          await api.deleteCommitment(commitmentToDelete.id, currentUser.id);
        } catch (error) {
          console.error('Failed to delete commitment from backend:', error);
          // Continue anyway - local deletion already happened
        }
      }
      
      setShowDeleteModal(false);
      setCommitmentToDelete(null);
      
      // Load data after deletion
      await loadData();
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCommitmentToDelete(null);
  };

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
  };

  const handleClearStorage = () => {
    Alert.alert(
      'Clear Storage',
      'This will delete all commitments, completions, and user data from local storage. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              // Reload the app state
              await loadData();
              Alert.alert('Success', 'Storage cleared successfully');
            } catch (error) {
              console.error('Failed to clear storage:', error);
              Alert.alert('Error', 'Failed to clear storage');
            }
          },
        },
      ]
    );
  };

  const handleTestBackendSentry = async () => {
    try {
      await api.testSentry();
    } catch (error) {
      Alert.alert('Expected Error', 'Backend threw test error (check Sentry dashboard)');
    }
  };

  const handleTestMobileSentry = () => {
    if (Sentry.isInitialized()) {
      Sentry.captureException(new Error('Test mobile Sentry error'));
      Alert.alert('Test Sent', 'Test error sent to Sentry Mobile project');
    } else {
      Alert.alert('Sentry Not Initialized', 'Sentry is only active in production builds');
    }
  };

  const renderCommitmentCard = ({ item }: { item: Commitment }) => {
    const isEditing = editingId === item.id;
    const isShared = item.type === 'shared';
    const participants = participantsMap[item.id] || [];

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
        currentUserId={currentUser.id}
        participants={participants}
        readonly={isShared}
      />
    );
  };

  const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true' || 
                    (typeof __DEV__ !== 'undefined' && __DEV__);

  return (
    <>
      <View style={styles.container}>
        <UserSwitcher />
        {isDevMode && (
          <View style={styles.devToolbar}>
            <Text style={styles.devLabel}>DEV settings:</Text>
            <View style={styles.devButtonsRow}>
              <TouchableOpacity
                style={styles.devButton}
                onPress={handleTestBackendSentry}
              >
                <Ionicons name="bug-outline" size={14} color="#ff9800" />
                <Text style={styles.devButtonText}>Test Backend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.devButton}
                onPress={handleTestMobileSentry}
              >
                <Ionicons name="bug-outline" size={14} color="#ff9800" />
                <Text style={styles.devButtonText}>Test Mobile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearStorageButton}
                onPress={handleClearStorage}
              >
                <Ionicons name="trash-outline" size={14} color="#ff4444" />
                <Text style={styles.clearStorageText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
          onPress={() => setShowActionSheet(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <DeleteModal
        visible={showDeleteModal}
        commitment={commitmentToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        currentUserId={currentUser.id}
      />

      <ActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onCreate={() => navigation.navigate('AddCommitment')}
        onJoin={() => navigation.navigate('JoinChallenge')}
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
  devToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  devLabel: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
  },
  devButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff9800',
    gap: 4,
  },
  devButtonText: {
    color: '#ff9800',
    fontSize: 11,
    fontWeight: '600',
  },
  clearStorageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff4444',
    gap: 4,
  },
  clearStorageText: {
    color: '#ff4444',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default CommitmentsListScreen;


