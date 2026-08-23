import {
  curriculumItemsForIsland,
  curriculumItemsForStage,
  loadCurriculumItems,
} from '../../content/curriculum';
import type { SeaId } from '../../types/content';

export const SAVE_KEY = 'dsk_state';

export interface StageProgress {
  bestScore: number;
  bestStars: number;
  cleared: boolean;
}

export interface CollectionProgress {
  recovered: boolean;
  firstTryCorrect: number;
  correctCount: number;
  missCount: number;
  lastAnsweredAt: string;
}

export interface GameSettings {
  bgm: boolean;
  sfx: boolean;
  reducedMotion: boolean;
}

export interface SaveState {
  v: 3;
  stages: Record<string, StageProgress>;
  collection: Record<string, CollectionProgress>;
  seen: Record<string, boolean>;
  settings: GameSettings;
}

interface SaveStateV1 {
  v: 1;
  stages?: Record<string, StageProgress>;
  seen?: Record<string, boolean>;
  settings?: Partial<GameSettings>;
}

interface SaveStateV2 {
  v: 2;
  stages?: Record<string, StageProgress>;
  collection?: Partial<Record<string, Partial<CollectionProgress>>>;
  seen?: Record<string, boolean>;
  settings?: Partial<GameSettings>;
}

const AUTO_MIGRATION_TIMESTAMP = new Date(0).toISOString();

export function createDefaultState(): SaveState {
  return {
    v: 3,
    stages: {},
    collection: {},
    seen: {},
    settings: { bgm: true, sfx: true, reducedMotion: false },
  };
}

export function loadState(storage: Pick<Storage, 'getItem'> = localStorage): SaveState {
  try {
    const value = storage.getItem(SAVE_KEY);
    if (!value) return createDefaultState();
    const parsed = JSON.parse(value) as Partial<SaveState> | SaveStateV1 | SaveStateV2;
    if (parsed.v === 1) return migrateV1(parsed);
    if (parsed.v === 2) return migrateV2(parsed);
    if (parsed.v !== 3 || typeof parsed.stages !== 'object' || parsed.stages === null) {
      return createDefaultState();
    }
    return {
      v: 3,
      stages: parsed.stages as Record<string, StageProgress>,
      collection: normalizeCollection(parsed.collection),
      seen: normalizeSeen(parsed.seen),
      settings: normalizeSettings(parsed.settings),
    };
  } catch {
    return createDefaultState();
  }
}

function migrateV1(oldState: SaveStateV1): SaveState {
  const stages = resetStagesWithRequiredItems(oldState.stages ?? {});
  return {
    v: 3,
    stages,
    collection: {},
    seen: normalizeSeen(oldState.seen),
    settings: normalizeSettings(oldState.settings),
  };
}

function migrateV2(oldState: SaveStateV2): SaveState {
  const collection = normalizeCollection(oldState.collection);
  const autoRecoveredItemIds = new Set(
    Object.entries(collection)
      .filter(([, progress]) => isAutoMigratedProgress(progress))
      .map(([itemId]) => itemId),
  );
  autoRecoveredItemIds.forEach((itemId) => delete collection[itemId]);
  return {
    v: 3,
    stages: resetStagesContainingItems(oldState.stages ?? {}, autoRecoveredItemIds),
    collection,
    seen: normalizeSeen(oldState.seen),
    settings: normalizeSettings(oldState.settings),
  };
}

function isAutoMigratedProgress(progress: CollectionProgress): boolean {
  return (
    progress.recovered === true &&
    progress.firstTryCorrect === 1 &&
    progress.correctCount === 1 &&
    progress.missCount === 0 &&
    progress.lastAnsweredAt === AUTO_MIGRATION_TIMESTAMP
  );
}

function resetStagesWithRequiredItems(
  stages: Record<string, StageProgress>,
): Record<string, StageProgress> {
  return Object.fromEntries(
    Object.entries(stages).map(([stageId, progress]) => [
      stageId,
      curriculumItemsForStage(stageId).length > 0 ? { ...progress, cleared: false } : progress,
    ]),
  );
}

function resetStagesContainingItems(
  stages: Record<string, StageProgress>,
  itemIds: ReadonlySet<string>,
): Record<string, StageProgress> {
  if (itemIds.size === 0) return stages;
  return Object.fromEntries(
    Object.entries(stages).map(([stageId, progress]) => [
      stageId,
      curriculumItemsForStage(stageId).some((item) => itemIds.has(item.id))
        ? { ...progress, cleared: false }
        : progress,
    ]),
  );
}

function normalizeCollection(
  collection: Partial<Record<string, Partial<CollectionProgress>>> | undefined,
): Record<string, CollectionProgress> {
  if (!collection || typeof collection !== 'object') return {};
  return Object.fromEntries(
    Object.entries(collection).map(([itemId, progress]) => [
      itemId,
      {
        recovered: progress?.recovered === true,
        firstTryCorrect: Number.isFinite(progress?.firstTryCorrect)
          ? Number(progress?.firstTryCorrect)
          : 0,
        correctCount: Number.isFinite(progress?.correctCount) ? Number(progress?.correctCount) : 0,
        missCount: Number.isFinite(progress?.missCount) ? Number(progress?.missCount) : 0,
        lastAnsweredAt: typeof progress?.lastAnsweredAt === 'string' ? progress.lastAnsweredAt : '',
      },
    ]),
  );
}

function normalizeSeen(seen: Record<string, boolean> | undefined): Record<string, boolean> {
  return typeof seen === 'object' && seen !== null ? seen : {};
}

function normalizeSettings(settings: Partial<GameSettings> | undefined): GameSettings {
  return {
    bgm: typeof settings?.bgm === 'boolean' ? settings.bgm : true,
    sfx: typeof settings?.sfx === 'boolean' ? settings.sfx : true,
    reducedMotion: typeof settings?.reducedMotion === 'boolean' ? settings.reducedMotion : false,
  };
}

export function setAudioEnabled(
  enabled: boolean,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): SaveState {
  const state = loadState(storage);
  state.settings.bgm = enabled;
  state.settings.sfx = enabled;
  saveState(state, storage);
  return state;
}

export function markSeen(
  key: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): SaveState {
  const state = loadState(storage);
  state.seen[key] = true;
  saveState(state, storage);
  return state;
}

export function recordCurriculumAnswer(
  itemIds: readonly string[],
  correct: boolean,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): { state: SaveState; newlyRecovered: string[] } {
  const state = loadState(storage);
  const now = new Date().toISOString();
  const newlyRecovered: string[] = [];
  itemIds.forEach((itemId) => {
    const previous = state.collection[itemId] ?? {
      recovered: false,
      firstTryCorrect: 0,
      correctCount: 0,
      missCount: 0,
      lastAnsweredAt: '',
    };
    if (correct && !previous.recovered) newlyRecovered.push(itemId);
    state.collection[itemId] = {
      recovered: previous.recovered || correct,
      firstTryCorrect:
        previous.firstTryCorrect +
        (correct && previous.correctCount === 0 && previous.missCount === 0 ? 1 : 0),
      correctCount: previous.correctCount + (correct ? 1 : 0),
      missCount: previous.missCount + (correct ? 0 : 1),
      lastAnsweredAt: now,
    };
  });
  saveState(state, storage);
  return { state, newlyRecovered };
}

export function getStageCollectionProgress(
  stageId: string,
  state: Pick<SaveState, 'collection'> = loadState(),
): { recovered: number; total: number; missingItemIds: string[]; complete: boolean } {
  const items = curriculumItemsForStage(stageId);
  const missingItemIds = items
    .filter((item) => state.collection[item.id]?.recovered !== true)
    .map((item) => item.id);
  return {
    recovered: items.length - missingItemIds.length,
    total: items.length,
    missingItemIds,
    complete: missingItemIds.length === 0,
  };
}

export function getIslandCollectionProgress(
  islandId: string,
  state: Pick<SaveState, 'collection'> = loadState(),
): { recovered: number; total: number; complete: boolean } {
  return collectionProgress(
    curriculumItemsForIsland(islandId).map((item) => item.id),
    state,
  );
}

export function getSeaCollectionProgress(
  seaId: SeaId = 'g1',
  state: Pick<SaveState, 'collection'> = loadState(),
): {
  recovered: number;
  total: number;
  complete: boolean;
} {
  return collectionProgress(
    loadCurriculumItems(seaId).map((item) => item.id),
    state,
  );
}

function collectionProgress(
  itemIds: readonly string[],
  state: Pick<SaveState, 'collection'>,
): { recovered: number; total: number; complete: boolean } {
  const recovered = itemIds.filter((itemId) => state.collection[itemId]?.recovered === true).length;
  return { recovered, total: itemIds.length, complete: recovered === itemIds.length };
}

export function recordStageResult(
  stageId: string,
  score: number,
  total: number,
  stars: number,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): SaveState {
  const state = loadState(storage);
  const previous = state.stages[stageId];
  const requirementsComplete = getStageCollectionProgress(stageId, state).complete;
  state.stages[stageId] = {
    bestScore: Math.max(previous?.bestScore ?? 0, score),
    bestStars: Math.max(previous?.bestStars ?? 0, stars),
    cleared: (previous?.cleared ?? false) || (score / total >= 0.6 && requirementsComplete),
  };
  saveState(state, storage);
  return state;
}

function saveState(state: SaveState, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(state));
}
