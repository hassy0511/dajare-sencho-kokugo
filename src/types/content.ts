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

export interface MojiChoiceItem {
  key: string;
  prompt: string;
  emphasis: string | null;
  choices: string[];
  answer: string;
  explanation: string;
}

export interface HiraWordPool {
  id: string;
  kind: 'hira-seion';
  items: HiraWordItem[];
  dakuon: MojiChoiceItem[];
  sokuon: MojiChoiceItem[];
  chouon: MojiChoiceItem[];
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

export type CharacterImageRole = 'dajare-sencho' | 'sumizo';
export type CharacterImageExpression = 'normal' | 'angry' | 'oops';

export interface CharacterImageAsset {
  key: string;
  role: CharacterImageRole;
  expression: CharacterImageExpression;
  src: string;
  source: string;
  alt: string;
  approvedAt: string;
}

export interface CharacterImageLibrary {
  version: 1;
  generator: {
    provider: string;
    model: string;
    mode: string;
    styleGuide: string;
  };
  items: CharacterImageAsset[];
}

export interface StageDefinition {
  id: string;
  name: string;
  scene: string;
  skill: string;
  skillRef: string;
  intro: string;
  marker?: string | undefined;
  n: number;
  gen: 'hiraPicture' | 'hiraDakuon' | 'hiraSokuon' | 'hiraChouon' | null;
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
  role: 'dajare-sencho' | 'sumizo' | 'buddy';
  text: string;
}

export interface SeaDefinition {
  id: 'g1';
  name: string;
  grade: 1;
  challenge: StoryPage[];
  islands: IslandDefinition[];
}
