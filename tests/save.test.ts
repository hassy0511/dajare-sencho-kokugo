import { describe, expect, it } from 'vitest';

import { loadState, recordStageResult, SAVE_KEY } from '../src/engine/save/state';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('進行保存', () => {
  it('不正な保存値では初期状態へ戻る', () => {
    const storage = { getItem: () => '{not-json' };
    expect(loadState(storage)).toEqual({ v: 1, stages: {} });
  });

  it('自己ベストを下げずにクリア状態を保存する', () => {
    const storage = memoryStorage();
    recordStageResult('g1-moji-seion', 9, 10, 3, storage);
    recordStageResult('g1-moji-seion', 6, 10, 1, storage);
    const saved = JSON.parse(storage.getItem(SAVE_KEY) ?? '{}') as {
      stages: Record<string, { bestScore: number; bestStars: number; cleared: boolean }>;
    };
    expect(saved.stages['g1-moji-seion']).toEqual({
      bestScore: 9,
      bestStars: 3,
      cleared: true,
    });
  });
});
