import { describe, expect, it } from 'vitest';

import { loadState, recordStageResult, SAVE_KEY, setAudioEnabled } from '../src/engine/save/state';

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
    expect(loadState(storage)).toEqual({
      v: 1,
      stages: {},
      seen: {},
      settings: { bgm: true, sfx: true, reducedMotion: false },
    });
  });

  it('以前の保存値には音の初期設定を補う', () => {
    const storage = {
      getItem: () => JSON.stringify({ v: 1, stages: {}, seen: { 'challenge:g1': true } }),
    };
    expect(loadState(storage).settings).toEqual({
      bgm: true,
      sfx: true,
      reducedMotion: false,
    });
  });

  it('BGMと効果音のオン・オフをまとめて保存する', () => {
    const storage = memoryStorage();
    setAudioEnabled(false, storage);
    expect(loadState(storage).settings).toMatchObject({ bgm: false, sfx: false });
    setAudioEnabled(true, storage);
    expect(loadState(storage).settings).toMatchObject({ bgm: true, sfx: true });
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
