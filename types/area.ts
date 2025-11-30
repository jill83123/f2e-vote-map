type Candidate = {
  name: string;
  partyName: string;
  totalVotes: number;
  isElected: boolean;
};

type History = {
  year: number;
  partyName: string;
  totalVotes: number;
};

type Area = {
  name: string;
  validVotes: number;
  invalidVotes: number;
  totalVotes: number;
  voterTurnout: number;
  candidates: Candidate[];
  history: History[];
};

export type AreaCode = {
  provinceCode: string;
  cityCode: string;
  townCode: string;
  villageCode: string;
};

export type SubArea = AreaCode & {
  name: string;
  candidates: Candidate[];
  totalVotes: number;
  voterTurnout: number;
};

type ParentArea = AreaCode & {
  name: string;
};

export type GetAreaResponse = {
  year: number;
  area: Area;
  subAreas: SubArea[];
  parentAreas: ParentArea[];
};
