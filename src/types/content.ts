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

export type KanjiGroup = 'nature' | 'body' | 'number' | 'school' | 'action';

export interface Grade1Bank {
  version: 1;
  youon: string[];
  katakana: { hira: string; kata: string }[];
  kanji: { char: string; reading: string; group: KanjiGroup }[];
  strokes: { char: string; count: number }[];
  categories: { name: string; members: string[]; outsider: string }[];
  counters: { thing: string; unit: string }[];
  polite: { plain: string; polite: string }[];
  sentences: { text: string; subject: string; predicate: string }[];
  yousu: { scene: string; answer: string; wrongs: string[] }[];
  shiritori: { from: string; answer: string; wrongs: string[] }[];
  readings: { text: string; who: string; what: string; place: string; keyword: string }[];
  sequences: { title: string; events: string[] }[];
  folktales: {
    title: string;
    text: string;
    question: string;
    answer: string;
    wrongs: string[];
  }[];
  longReadings: { text: string; question: string; answer: string; wrongs: string[] }[];
  sentenceTiles: string[][];
  particles: { text: string; answer: string; wrongs: string[] }[];
  punctuation: { plain: string; correct: string; wrongs: string[] }[];
  diarySequences: string[][];
  fixes: { wrong: string; correct: string; wrongs: string[] }[];
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
  gen: 'hiraPicture' | 'hiraDakuon' | 'hiraSokuon' | 'hiraChouon' | 'grade1' | null;
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
