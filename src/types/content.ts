export type QTypeName = 'choice';

export interface ChoiceQuestion {
  key: string;
  type: 'choice';
  prompt: string;
  emphasis: string;
  choices: string[];
  answer: number;
  explanation: string;
}

export interface HiraWordItem {
  w: string;
}

export interface HiraWordPool {
  id: string;
  kind: 'hira-seion';
  items: HiraWordItem[];
}

export interface StageDefinition {
  id: string;
  name: string;
  scene: string;
  skill: string;
  skillRef: string;
  intro: string;
  n: number;
  gen: 'hiraSeion';
}

export interface IslandDefinition {
  id: string;
  name: string;
  stages: StageDefinition[];
}

export interface SeaDefinition {
  grade: 1;
  islands: IslandDefinition[];
}
