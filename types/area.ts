export type TAreaLevel = 'province' | 'city' | 'town' | 'village';

export type TAreaCode = {
  [K in `${TAreaLevel}Code`]: string;
};

type TCandidate = {
  name: string;
  partyName: string;
  totalVotes: number;
  isElected: boolean;
};

type THistory = {
  year: number;
  partyName: string;
  totalVotes: number;
};

type TArea = TAreaCode & {
  name: string;
  validVotes: number;
  invalidVotes: number;
  totalVotes: number;
  voterTurnout: number;
  candidates: TCandidate[];
  history: THistory[];
};

export type TSubArea = TAreaCode & {
  name: string;
  candidates: TCandidate[];
  totalVotes: number;
  voterTurnout: number;
};

type TParentArea = TAreaCode & {
  name: string;
};

export type TGetAreaResponse = {
  year: number;
  area: TArea;
  subAreas: TSubArea[];
  parentAreas: TParentArea[];
};
