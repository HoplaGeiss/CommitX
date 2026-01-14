export type ChallengeType = 'self' | 'collaborative' | 'shared';

export interface User {
  id: string;
  name?: string;
}

export interface Commitment {
  id: string;
  title: string;
  type: ChallengeType;
  userId: string;
  shareCode?: string;
  participants?: string[]; // For collaborative
  ownerId?: string; // For shared challenges
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
}

export interface Completion {
  id: string;
  commitmentId: string;
  userId: string; // Track who completed
  date: string; // YYYY-MM-DD format
  synced?: boolean; // Track sync status
  createdAt?: string;
  updatedAt?: string; // For conflict resolution
  deleted?: boolean; // Soft delete flag
}

export type RootStackParamList = {
  CommitmentsList: undefined;
  AddCommitment: undefined;
  JoinChallenge: undefined;
};


