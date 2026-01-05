import AsyncStorage from '@react-native-async-storage/async-storage';
import { Commitment, Completion } from '../types';

const COMMITMENTS_KEY = '@commitments';
const COMPLETIONS_KEY = '@completions';

export const storage = {
  // Commitments
  async getCommitments(): Promise<Commitment[]> {
    try {
      const data = await AsyncStorage.getItem(COMMITMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting commitments:', error);
      return [];
    }
  },

  async saveCommitments(commitments: Commitment[]): Promise<void> {
    try {
      await AsyncStorage.setItem(COMMITMENTS_KEY, JSON.stringify(commitments));
    } catch (error) {
      console.error('Error saving commitments:', error);
    }
  },

  async addCommitment(commitment: { title: string }): Promise<Commitment> {
    const commitments = await this.getCommitments();
    const newCommitment: Commitment = {
      id: Date.now().toString(),
      title: commitment.title,
      createdAt: new Date().toISOString(),
    };
    commitments.push(newCommitment);
    await this.saveCommitments(commitments);
    return newCommitment;
  },

  async updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment | null> {
    const commitments = await this.getCommitments();
    const index = commitments.findIndex(c => c.id === id);
    if (index >= 0) {
      commitments[index] = { ...commitments[index], ...updates };
      await this.saveCommitments(commitments);
      return commitments[index];
    }
    return null;
  },

  async deleteCommitment(id: string): Promise<void> {
    const commitments = await this.getCommitments();
    const filtered = commitments.filter(c => c.id !== id);
    await this.saveCommitments(filtered);
    // Also delete related completions
    const completions = await this.getCompletions();
    const filteredCompletions = completions.filter(c => c.commitmentId !== id);
    await this.saveCompletions(filteredCompletions);
  },

  // Completions
  async getCompletions(): Promise<Completion[]> {
    try {
      const data = await AsyncStorage.getItem(COMPLETIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting completions:', error);
      return [];
    }
  },

  async saveCompletions(completions: Completion[]): Promise<void> {
    try {
      await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
    } catch (error) {
      console.error('Error saving completions:', error);
    }
  },

  async toggleCompletion(commitmentId: string, date: Date): Promise<Completion[]> {
    const completions = await this.getCompletions();
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD format
    
    const existingIndex = completions.findIndex(
      c => c.commitmentId === commitmentId && c.date === dateStr
    );

    if (existingIndex >= 0) {
      // Remove completion
      completions.splice(existingIndex, 1);
    } else {
      // Add completion
      completions.push({
        id: Date.now().toString(),
        commitmentId,
        date: dateStr,
      });
    }

    await this.saveCompletions(completions);
    return completions;
  },

  async getCompletionsForCommitment(commitmentId: string): Promise<Completion[]> {
    const completions = await this.getCompletions();
    return completions.filter(c => c.commitmentId === commitmentId);
  },

  isDateCompleted(completions: Completion[], date: Date): boolean {
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return completions.some(c => c.date === dateStr);
  },
};


