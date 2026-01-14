import * as Sentry from '@sentry/react-native';
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

    const startTime = Date.now();
    const method = options.method || 'GET';
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Extract request ID from response headers
      const requestId = response.headers.get('x-request-id');
      const duration = Date.now() - startTime;

      // Add Sentry breadcrumb for API call
      if (Sentry.isInitialized()) {
        Sentry.addBreadcrumb({
          category: 'api',
          message: `${method} ${endpoint}`,
          level: response.ok ? 'info' : 'error',
          data: {
            url: endpoint,
            method,
            status: response.status,
            requestId,
            duration: `${duration}ms`,
          },
        });

        // Tag error context with requestId if call fails
        if (!response.ok && requestId) {
          Sentry.setTag('lastRequestId', requestId);
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        const errorMessage = error.message || `HTTP error! status: ${response.status}`;
        
        // Capture API error to Sentry with context
        if (Sentry.isInitialized() && response.status >= 500) {
          Sentry.captureException(new Error(`API Error: ${errorMessage}`), {
            tags: {
              endpoint,
              method,
              status: response.status,
              requestId: requestId || 'unknown',
            },
          });
        }
        
        throw new Error(errorMessage);
      }

      // Handle empty responses (e.g., 204 No Content for DELETE requests)
      if (response.status === 204) {
        return undefined as T;
      }

      // Check if there's content to parse
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      // If content-length is 0 or no JSON content-type, return undefined
      if (contentLength === '0' || (contentType && !contentType.includes('application/json'))) {
        return undefined as T;
      }

      // Try to parse JSON, but handle empty responses gracefully
      const text = await response.text();
      if (!text || text.trim() === '') {
        return undefined as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        // If parsing fails, it might be an empty response
        console.warn(`Failed to parse JSON response for ${endpoint}:`, parseError);
        return undefined as T;
      }
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

  async deleteCommitment(id: string, userId: string): Promise<void> {
    return this.request<void>(`/commitments/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
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

  // DEBUG METHOD - Remove after testing Sentry
  async testSentry(): Promise<void> {
    return this.request<void>('/commitments/debug-sentry');
  }
}

export const api = new ApiClient(API_BASE_URL);

