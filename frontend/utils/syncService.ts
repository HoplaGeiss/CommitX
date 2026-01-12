import { api } from './api';
import { storage } from './storage';
import { Commitment, Completion } from '../types';

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private onSyncComplete: (() => void) | null = null;

  setOnSyncComplete(callback: () => void) {
    this.onSyncComplete = callback;
  }

  async syncAll(userId: string): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    try {
      // Only push local changes - no pulling
      await this.pushLocalChanges(userId);
      
      // Notify that sync is complete
      if (this.onSyncComplete) {
        this.onSyncComplete();
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async pushLocalChanges(userId: string): Promise<void> {
    try {
      // Only sync collaborative commitments - self commitments stay local-only
      const collaborativeCommitments = await storage.getCollaborativeCommitments();
      
      // Get unsynced completions for collaborative commitments only
      const allUnsyncedCompletions = await storage.getUnsyncedCompletions();
      const unsyncedCompletions = allUnsyncedCompletions.filter(c => {
        return collaborativeCommitments.some(commitment => commitment.id === c.commitmentId);
      });

      // Sync completions for collaborative commitments
      for (const completion of unsyncedCompletions) {
        try {
          await api.toggleCompletion(
            completion.commitmentId,
            completion.date,
            completion.userId
          );
          await storage.markCompletionSynced(completion.id);
        } catch (error) {
          console.error(`Failed to sync completion ${completion.id}:`, error);
        }
      }

      // Sync commitments (create/update) - only for collaborative
      for (const commitment of collaborativeCommitments) {
        try {
          if (commitment.id.startsWith('local-')) {
            // New commitment, create on server
            const created = await api.createCommitment({
              title: commitment.title,
              type: commitment.type,
              userId: commitment.userId,
            });
            // Update local ID with server ID
            await storage.updateCommitment(commitment.id, { id: created.id });
          } else {
            // Existing commitment, update if needed
            await api.updateCommitment(commitment.id, {
              title: commitment.title,
            });
          }
        } catch (error) {
          console.error(`Failed to sync commitment ${commitment.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error pushing local changes:', error);
      throw error;
    }
  }


  startPeriodicSync(userId: string, intervalMs: number = 30000): void {
    if (this.syncInterval) {
      this.stopPeriodicSync();
    }

    // Only push local changes periodically - no pulling
    this.syncInterval = setInterval(() => {
      this.syncAll(userId);
    }, intervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncAfterChange(userId: string): Promise<void> {
    // Debounced sync after local changes
    setTimeout(() => {
      this.syncAll(userId);
    }, 1000);
  }
}

export const syncService = new SyncService();

