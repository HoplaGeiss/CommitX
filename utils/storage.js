import AsyncStorage from '@react-native-async-storage/async-storage';

const COMMITMENTS_KEY = '@commitments';
const COMPLETIONS_KEY = '@completions';

export const storage = {
  // Commitments
  async getCommitments() {
    try {
      const data = await AsyncStorage.getItem(COMMITMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting commitments:', error);
      return [];
    }
  },

  async saveCommitments(commitments) {
    try {
      await AsyncStorage.setItem(COMMITMENTS_KEY, JSON.stringify(commitments));
    } catch (error) {
      console.error('Error saving commitments:', error);
    }
  },

  async addCommitment(commitment) {
    const commitments = await this.getCommitments();
    const newCommitment = {
      id: Date.now().toString(),
      title: commitment.title,
      createdAt: new Date().toISOString(),
    };
    commitments.push(newCommitment);
    await this.saveCommitments(commitments);
    return newCommitment;
  },

  async updateCommitment(id, updates) {
    const commitments = await this.getCommitments();
    const index = commitments.findIndex(c => c.id === id);
    if (index >= 0) {
      commitments[index] = { ...commitments[index], ...updates };
      await this.saveCommitments(commitments);
      return commitments[index];
    }
    return null;
  },

  async deleteCommitment(id) {
    const commitments = await this.getCommitments();
    const filtered = commitments.filter(c => c.id !== id);
    await this.saveCommitments(filtered);
    // Also delete related completions
    const completions = await this.getCompletions();
    const filteredCompletions = completions.filter(c => c.commitmentId !== id);
    await this.saveCompletions(filteredCompletions);
  },

  // Completions
  async getCompletions() {
    try {
      const data = await AsyncStorage.getItem(COMPLETIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting completions:', error);
      return [];
    }
  },

  async saveCompletions(completions) {
    try {
      await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
    } catch (error) {
      console.error('Error saving completions:', error);
    }
  },

  async toggleCompletion(commitmentId, date) {
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

  async getCompletionsForCommitment(commitmentId) {
    const completions = await this.getCompletions();
    return completions.filter(c => c.commitmentId === commitmentId);
  },

  isDateCompleted(completions, date) {
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return completions.some(c => c.date === dateStr);
  },
};

