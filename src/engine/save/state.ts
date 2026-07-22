export const SAVE_KEY = 'dsk_state';

export interface StageProgress {
  bestScore: number;
  bestStars: number;
  cleared: boolean;
}

export interface SaveState {
  v: 1;
  stages: Record<string, StageProgress>;
  seen: Record<string, boolean>;
}

export function createDefaultState(): SaveState {
  return { v: 1, stages: {}, seen: {} };
}

export function loadState(storage: Pick<Storage, 'getItem'> = localStorage): SaveState {
  try {
    const value = storage.getItem(SAVE_KEY);
    if (!value) return createDefaultState();
    const parsed = JSON.parse(value) as Partial<SaveState>;
    if (parsed.v !== 1 || typeof parsed.stages !== 'object' || parsed.stages === null) {
      return createDefaultState();
    }
    return {
      v: 1,
      stages: parsed.stages as Record<string, StageProgress>,
      seen:
        typeof parsed.seen === 'object' && parsed.seen !== null
          ? (parsed.seen as Record<string, boolean>)
          : {},
    };
  } catch {
    return createDefaultState();
  }
}

export function markSeen(
  key: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): SaveState {
  const state = loadState(storage);
  state.seen[key] = true;
  storage.setItem(SAVE_KEY, JSON.stringify(state));
  return state;
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
  state.stages[stageId] = {
    bestScore: Math.max(previous?.bestScore ?? 0, score),
    bestStars: Math.max(previous?.bestStars ?? 0, stars),
    cleared: (previous?.cleared ?? false) || score / total >= 0.6,
  };
  storage.setItem(SAVE_KEY, JSON.stringify(state));
  return state;
}
