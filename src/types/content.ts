export type QTypeName = 'choice';

export interface ChoiceQuestion {
  key: string;
  type: 'choice';
  prompt: string;
  emphasis: string | null;
  visual: string | null;
  choices: string[];
  answer: number;
  explanation: string;
}

export interface HiraWordItem {
  w: string;
  visual: string;
}

export interface HiraWordPool {
  id: string;
  kind: 'hira-seion';
  items: HiraWordItem[];
}

export interface WordImageAsset {
  key: string;
  word: string;
  src: string;
  alt: string;
  subjectPrompt: string;
}

export interface WordImageLibrary {
  version: 1;
  generator: {
    provider: string;
    model: string;
    mode: string;
    stylePrompt: string;
  };
  items: WordImageAsset[];
}

export interface StageDefinition {
  id: string;
  name: string;
  scene: string;
  skill: string;
  skillRef: string;
  intro: string;
  n: number;
  gen: 'hiraPicture' | null;
  status: 'playable' | 'planned';
  treasure: string;
}

export interface IslandDefinition {
  id: string;
  name: string;
  subtitle: string;
  symbol: string;
  stages: StageDefinition[];
}

export interface StoryPage {
  speaker: string;
  role: 'captain' | 'sumizo' | 'buddy';
  text: string;
}

export interface SeaDefinition {
  id: 'g1';
  name: string;
  grade: 1;
  challenge: StoryPage[];
  islands: IslandDefinition[];
}
