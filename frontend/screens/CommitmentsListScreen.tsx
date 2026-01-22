import React, { useState, useCallback, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import { storage } from '../utils/storage';
import { api } from '../utils/api';
import { syncService } from '../utils/syncService';
import { useUser } from '../utils/userContext';
import UserSwitcher from '../components/UserSwitcher';
import CommitmentCard from '../components/CommitmentCard';
import DeleteModal from '../components/DeleteModal';
import ActionSheet from '../components/ActionSheet';
import Sidebar from '../components/Sidebar';
import OnboardingModal from '../components/OnboardingModal';
import MonthNavigation from '../components/MonthNavigation';
import { isDateInFuture } from '../components/calendarUtils';
import { Commitment, Completion, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CommitmentsList'>;

const { width } = Dimensions.get('window');

const CommitmentsListScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser } = useUser();
  const { t } = useTranslation();
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (currentUser.id) {
        const hasCompleted = await storage.hasCompletedOnboarding(currentUser.id);
        if (!hasCompleted) {
          setShowOnboarding(true);
        }
      }
    };
    checkOnboarding();
  }, [currentUser.id]);

  // Initial sync on startup - fetch collaborative commitments from server
  useEffect(() => {
    if (!hasInitialSync && currentUser.id) {
      initialSync();
    }
  }, [currentUser.id, hasInitialSync]);

  // Set up the burger menu button and add button in the header
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setShowSidebar(true)}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowActionSheet(true)}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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

  // Periodic polling to pull other users' completions for collaborative commitments
  useEffect(() => {
    if (!currentUser.id || !hasInitialSync) {
      return;
    }

    const pollCompletions = async () => {
      try {
        const localCommitments = await storage.getCommitments();
        const localCompletions = await storage.getCompletions();
        const collaborativeCommitments = localCommitments.filter(c => c.type === 'collaborative');
        
        if (collaborativeCommitments.length === 0) {
          return;
        }

        const completionKey = (c: Completion) => `${c.commitmentId}-${c.userId}-${c.date}`;
        const completionMap = new Map<string, Completion>();
        const collaborativeCommitmentIds = collaborativeCommitments.map(c => c.id);
        
        // Start with only: 1) current user's completions, and 2) completions for non-collaborative commitments
        localCompletions
          .filter(c => 
            c.userId === currentUser.id || // Keep all current user's completions
            !collaborativeCommitmentIds.includes(c.commitmentId) // Keep completions for self commitments
          )
          .forEach(c => {
            completionMap.set(completionKey(c), c);
          });

        // Fetch and add fresh completions from server for each collaborative commitment
        for (const commitment of collaborativeCommitments) {
          try {
            const serverCompletions = await api.getCompletions(commitment.id);
            
            // Add ALL other users' completions from server (replaces any old data)
            serverCompletions
              .filter(c => c.userId !== currentUser.id && !c.deleted)
              .forEach(c => {
                completionMap.set(completionKey(c), {
                  ...c,
                  synced: true,
                });
              });
          } catch (error) {
            console.error(`Failed to poll completions for ${commitment.id}:`, error);
          }
        }

        const allCompletions = Array.from(completionMap.values());
        await storage.saveCompletions(allCompletions);
        
        // Update UI
        setCompletions(allCompletions);
        updateParticipantsMap(localCommitments, allCompletions);
      } catch (error) {
        console.error('Failed to poll completions:', error);
      }
    };

    // Poll immediately and then every 20 seconds
    pollCompletions();
    const intervalId = setInterval(pollCompletions, 20000);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser.id, hasInitialSync]);

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
    const loadedCommitments = await storage.getCommitments();
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
      const trimmedTitle = newTitle.trim();
      
      // Update local storage first
      await storage.updateCommitment(commitmentId, { title: trimmedTitle });
      
      // For collaborative commitments, also update on server
      const commitment = commitments.find(c => c.id === commitmentId);
      if (commitment?.type === 'collaborative') {
        try {
          await api.updateCommitment(commitmentId, { title: trimmedTitle });
        } catch (error) {
          console.error('Failed to update commitment title on server:', error);
          // Continue anyway - local update succeeded
        }
      }
      
      await loadData();
    }
  };

  const handleDeleteCommitment = (commitment: Commitment) => {
    setCommitmentToDelete(commitment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (commitmentToDelete) {
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
      t('commitmentsList.clearStorageTitle'),
      t('commitmentsList.clearStorageMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('commitmentsList.clearStorageButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              // Reload the app state
              await loadData();
              Alert.alert(t('joinChallenge.success'), t('commitmentsList.clearStorageSuccess'));
            } catch (error) {
              console.error('Failed to clear storage:', error);
              Alert.alert(t('addCommitment.error'), t('commitmentsList.clearStorageError'));
            }
          },
        },
      ]
    );
  };

  const handleCreateFirstCommitment = async () => {
    // Mark onboarding as completed
    await storage.setOnboardingCompleted(currentUser.id);
    setShowOnboarding(false);
    // Navigate to create commitment screen
    navigation.navigate('AddCommitment');
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
        currentUserId={currentUser.id}
        participants={participants}
        readonly={isShared}
      />
    );
  };

  return (
    <>
      <View style={styles.container}>
        <UserSwitcher />
        <View style={styles.monthNavigationContainer}>
          <MonthNavigation
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
          />
        </View>
        <FlatList
          data={commitments}
          renderItem={renderCommitmentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) }
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('commitmentsList.empty')}</Text>
              <Text style={styles.emptySubtext}>{t('commitmentsList.emptySubtext')}</Text>
            </View>
          }
        />
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

      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onClearStorage={handleClearStorage}
      />

      <OnboardingModal
        visible={showOnboarding}
        onCreateFirstCommitment={handleCreateFirstCommitment}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  monthNavigationContainer: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  listContent: {
    padding: 20,
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


