import { Commitment, Completion } from '../types';

// Get API URL from environment variable, with fallback for development
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  (typeof __DEV__ !== 'undefined' && __DEV__ 
    ? 'http://localhost:3000' 
    : 'https://api.commitz.com');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setUserId(userId: string) {
    // Kept for compatibility, but not currently used
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Commitment methods
  async createCommitment(data: {
    title: string;
    type: string;
    userId: string;
  }): Promise<Commitment> {
    return this.request<Commitment>('/commitments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCollaborativeCommitments(userId: string): Promise<Commitment[]> {
    return this.request<Commitment[]>(`/commitments/collaborative/${userId}`);
  }

  async updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment> {
    return this.request<Commitment>(`/commitments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCommitment(id: string): Promise<void> {
    return this.request<void>(`/commitments/${id}`, {
      method: 'DELETE',
    });
  }

  // Share code methods
  async joinChallenge(shareCode: string, userId: string): Promise<Commitment> {
    return this.request<Commitment>(`/commitments/join/${shareCode}`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async viewSharedChallenge(shareCode: string): Promise<Commitment> {
    return this.request<Commitment>(`/commitments/view/${shareCode}`, {
      method: 'POST',
    });
  }

  // Completion methods
  async toggleCompletion(
    commitmentId: string,
    date: string,
    userId: string
  ): Promise<Completion[]> {
    return this.request<Completion[]>(`/commitments/${commitmentId}/completions`, {
      method: 'POST',
      body: JSON.stringify({ date, userId }),
    });
  }

  async getCompletions(commitmentId: string): Promise<Completion[]> {
    return this.request<Completion[]>(`/commitments/${commitmentId}/completions`);
  }
}

export const api = new ApiClient(API_BASE_URL);

