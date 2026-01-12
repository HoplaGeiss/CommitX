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
}

export interface Completion {
  id: string;
  commitmentId: string;
  userId: string; // Track who completed
  date: string; // YYYY-MM-DD format
  synced?: boolean; // Track sync status
  createdAt?: string;
}

export type RootStackParamList = {
  CommitmentsList: undefined;
  AddCommitment: undefined;
  JoinChallenge: undefined;
};


