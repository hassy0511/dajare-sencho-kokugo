import type { CurriculumItem, KanjiGroup, SeaId } from '../types/content';
import {
  loadCurriculumDefinition,
  loadGrade1Bank,
  loadGrade2Bank,
  loadGrade2CurriculumDefinition,
  loadSea,
} from './loader';

const KANJI_STAGE_BY_GROUP: Record<KanjiGroup, string> = {
  nature: 'g1-kanji-shizen',
  body: 'g1-kanji-karada',
  number: 'g1-kanji-kazu',
  school: 'g1-kanji-gakko',
  action: 'g1-kanji-muki',
};

const cachedItems = new Map<SeaId, CurriculumItem[]>();

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

export function loadCurriculumItems(seaId: SeaId = 'g1'): CurriculumItem[] {
  const cached = cachedItems.get(seaId);
  if (cached) return cached;
  const items = seaId === 'g2' ? loadGrade2CurriculumItems() : loadGrade1CurriculumItems();
  cachedItems.set(seaId, items);
  return items;
}

function loadGrade1CurriculumItems(): CurriculumItem[] {
  const definition = loadCurriculumDefinition();
  const bank = loadGrade1Bank();
  const sea = loadSea('g1');
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
  return [...hiragana, ...katakana, ...kanji, ...concepts];
}

function loadGrade2CurriculumItems(): CurriculumItem[] {
  const definition = loadGrade2CurriculumDefinition();
  const bank = loadGrade2Bank();
  const sea = loadSea('g2');
  const islandByStage = new Map(
    sea.islands.flatMap((island) => island.stages.map((stage) => [stage.id, island.id] as const)),
  );
  const kanji = bank.kanji.map((item, order) => ({
    id: `g2-kanji-${item.char}`,
    kind: 'kanji' as const,
    islandId: 'g2-kanji',
    stageId: item.stageId,
    display: item.char,
    reading: item.reading,
    detail: `「${item.char}」は「${item.reading}」`,
    order,
  }));
  const concepts = definition.concepts.map((concept, order) => ({
    id: `g2-concept-${concept.stageId}`,
    kind: 'concept' as const,
    islandId: islandByStage.get(concept.stageId) ?? 'g2-kotoba',
    stageId: concept.stageId,
    display: concept.display,
    reading: concept.display,
    detail: concept.detail,
    order,
  }));
  return [...kanji, ...concepts];
}

export function curriculumItemsForStage(stageId: string): CurriculumItem[] {
  return loadCurriculumItems(seaIdFromContentId(stageId)).filter(
    (item) => item.stageId === stageId,
  );
}

export function curriculumItemsForIsland(islandId: string): CurriculumItem[] {
  return loadCurriculumItems(seaIdFromContentId(islandId)).filter(
    (item) => item.islandId === islandId,
  );
}

export function curriculumItemById(itemId: string): CurriculumItem | undefined {
  return loadCurriculumItems(seaIdFromContentId(itemId)).find((item) => item.id === itemId);
}

export function curriculumIdsInText(kind: 'hiragana' | 'katakana', text: string): string[] {
  const allowed = new Set(
    loadCurriculumDefinition()[kind === 'hiragana' ? 'hiragana' : 'katakana'],
  );
  return [...new Set([...text].filter((character) => allowed.has(character)))].map((character) =>
    curriculumCharacterId(kind, character),
  );
}

function seaIdFromContentId(contentId: string): SeaId {
  return contentId.startsWith('g2-') ? 'g2' : 'g1';
}
