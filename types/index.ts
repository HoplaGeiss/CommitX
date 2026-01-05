export interface Commitment {
  id: string;
  title: string;
  createdAt: string;
}

export interface Completion {
  id: string;
  commitmentId: string;
  date: string; // YYYY-MM-DD format
}

export type RootStackParamList = {
  CommitmentsList: undefined;
  AddCommitment: undefined;
};


