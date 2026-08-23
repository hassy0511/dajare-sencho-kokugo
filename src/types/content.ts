export type QTypeName = 'choice';

export type CurriculumFacet = 'hira-letter-to-word' | 'hira-word-to-letter' | 'hira-use';

export interface CurriculumEvidence {
  itemId: string;
  facet: CurriculumFacet;
}

export interface ChoiceQuestion {
  key: string;
  type: 'choice';
  prompt: string;
  emphasis: string | null;
  visual: string | null;
  choices: string[];
  answer: number;
  explanation: string;
  curriculumItemIds: string[];
  curriculumEvidence?: CurriculumEvidence[];
  choiceVisuals?: string[];
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
  recoveryWords: MojiChoiceItem[];
}

export type CurriculumKind = 'hiragana' | 'katakana' | 'kanji' | 'concept';

export interface CurriculumConceptDefinition {
  stageId: string;
  display: string;
  detail: string;
}

export interface CurriculumDefinition {
  version: 1;
  hiragana: string[];
  katakana: string[];
  concepts: CurriculumConceptDefinition[];
}

export interface CurriculumItem {
  id: string;
  kind: CurriculumKind;
  islandId: string;
  stageId: string;
  display: string;
  reading: string;
  detail: string;
  order: number;
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

export interface Grade2Bank {
  version: 1;
  kanji: { char: string; reading: string; stageId: string }[];
  katakanaWords: { key: string; clue: string; answer: string }[];
}

export interface Grade2CurriculumDefinition {
  version: 1;
  concepts: CurriculumConceptDefinition[];
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

export type CharacterImageRole = 'dajare-sencho' | 'sumizo' | 'uragaeru';
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

export type WorldImageKey =
  | 'welcome-background'
  | 'ocean-map-background'
  | 'island-board-background'
  | 'welcome-ship'
  | 'g1-moji'
  | 'g1-kanji'
  | 'g1-kotoba'
  | 'g1-yomitoki'
  | 'g1-kakikata';

export interface WorldImageAsset {
  key: WorldImageKey;
  kind: 'background' | 'ship' | 'island';
  src: string;
  source: string;
  alt: string;
}

export interface WorldImageLibrary {
  version: 1;
  generator: {
    provider: string;
    model: string;
    mode: string;
    styleReference: string;
  };
  items: WorldImageAsset[];
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
  gen: 'hiraPicture' | 'hiraDakuon' | 'hiraSokuon' | 'hiraChouon' | 'grade1' | 'grade2' | null;
  status: 'playable' | 'planned';
  treasure: string;
}

export interface IslandDefinition {
  id: string;
  name: string;
  subtitle: string;
  symbol: string;
  artKey?: WorldImageKey | undefined;
  stages: StageDefinition[];
}

export type StoryRole = CharacterImageRole | 'buddy';

export interface StoryPage {
  speaker: string;
  role: StoryRole;
  text: string;
}

export type SeaId = 'g1' | 'g2';

export interface SeaDefinition {
  id: SeaId;
  name: string;
  grade: 1 | 2;
  challenge: StoryPage[];
  islands: IslandDefinition[];
}
