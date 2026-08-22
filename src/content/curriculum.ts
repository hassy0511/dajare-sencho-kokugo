import type { CurriculumItem, KanjiGroup } from '../types/content';
import { loadCurriculumDefinition, loadGrade1Bank, loadSea } from './loader';

const KANJI_STAGE_BY_GROUP: Record<KanjiGroup, string> = {
  nature: 'g1-kanji-shizen',
  body: 'g1-kanji-karada',
  number: 'g1-kanji-kazu',
  school: 'g1-kanji-gakko',
  action: 'g1-kanji-muki',
};

let cachedItems: CurriculumItem[] | undefined;

export function curriculumCharacterId(
  kind: 'hiragana' | 'katakana' | 'kanji',
  value: string,
): string {
  const prefix = kind === 'hiragana' ? 'hira' : kind === 'katakana' ? 'kata' : 'kanji';
  return `g1-${prefix}-${value}`;
}

export function curriculumConceptId(stageId: string): string {
  return `g1-concept-${stageId}`;
}

export function loadCurriculumItems(): CurriculumItem[] {
  if (cachedItems) return cachedItems;
  const definition = loadCurriculumDefinition();
  const bank = loadGrade1Bank();
  const sea = loadSea();
  const islandByStage = new Map(
    sea.islands.flatMap((island) => island.stages.map((stage) => [stage.id, island.id] as const)),
  );
  const hiragana = definition.hiragana.map((display, order) => ({
    id: curriculumCharacterId('hiragana', display),
    kind: 'hiragana' as const,
    islandId: 'g1-moji',
    stageId: 'g1-moji-seion',
    display,
    reading: display,
    detail: `「${display}」の もじ`,
    order,
  }));
  const katakana = definition.katakana.map((display, order) => ({
    id: curriculumCharacterId('katakana', display),
    kind: 'katakana' as const,
    islandId: 'g1-moji',
    stageId: 'g1-moji-katakana',
    display,
    reading: display,
    detail: `カタカナの「${display}」`,
    order,
  }));
  const kanji = bank.kanji.map((item, order) => ({
    id: curriculumCharacterId('kanji', item.char),
    kind: 'kanji' as const,
    islandId: 'g1-kanji',
    stageId: KANJI_STAGE_BY_GROUP[item.group],
    display: item.char,
    reading: item.reading,
    detail: `「${item.char}」は「${item.reading}」`,
    order,
  }));
  const concepts = definition.concepts.map((concept, order) => ({
    id: curriculumConceptId(concept.stageId),
    kind: 'concept' as const,
    islandId: islandByStage.get(concept.stageId) ?? 'g1-kotoba',
    stageId: concept.stageId,
    display: concept.display,
    reading: concept.display,
    detail: concept.detail,
    order,
  }));
  cachedItems = [...hiragana, ...katakana, ...kanji, ...concepts];
  return cachedItems;
}

export function curriculumItemsForStage(stageId: string): CurriculumItem[] {
  return loadCurriculumItems().filter((item) => item.stageId === stageId);
}

export function curriculumItemsForIsland(islandId: string): CurriculumItem[] {
  return loadCurriculumItems().filter((item) => item.islandId === islandId);
}

export function curriculumItemById(itemId: string): CurriculumItem | undefined {
  return loadCurriculumItems().find((item) => item.id === itemId);
}

export function curriculumIdsInText(kind: 'hiragana' | 'katakana', text: string): string[] {
  const allowed = new Set(
    loadCurriculumDefinition()[kind === 'hiragana' ? 'hiragana' : 'katakana'],
  );
  return [...new Set([...text].filter((character) => allowed.has(character)))].map((character) =>
    curriculumCharacterId(kind, character),
  );
}
