export const SAVE_KEY = 'dsk_state';

export interface StageProgress {
  bestScore: number;
  bestStars: number;
  cleared: boolean;
}

export interface SaveState {
  v: 1;
  stages: Record<string, StageProgress>;
}

export function createDefaultState(): SaveState {
  return { v: 1, stages: {} };
}

export function loadState(storage: Pick<Storage, 'getItem'> = localStorage): SaveState {
  try {
    const value = storage.getItem(SAVE_KEY);
    if (!value) return createDefaultState();
    const parsed = JSON.parse(value) as Partial<SaveState>;
    if (parsed.v !== 1 || typeof parsed.stages !== 'object' || parsed.stages === null) {
      return createDefaultState();
    }
    return { v: 1, stages: parsed.stages as Record<string, StageProgress> };
  } catch {
    return createDefaultState();
  }
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
