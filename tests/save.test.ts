import { describe, expect, it } from 'vitest';

import { curriculumItemsForStage } from '../src/content/curriculum';
import {
  loadState,
  recordCurriculumAnswer,
  recordStageResult,
  SAVE_KEY,
  setAudioEnabled,
} from '../src/engine/save/state';

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
      v: 3,
      stages: {},
      collection: {},
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

  it('v1の自己ベストは残し、自動回収せずに必修ステージを再挑戦可能にする', () => {
    const storage = {
      getItem: () =>
        JSON.stringify({
          v: 1,
          stages: { 'g1-kanji-shizen': { bestScore: 10, bestStars: 3, cleared: true } },
          seen: {},
        }),
    };
    const state = loadState(storage);
    expect(state.v).toBe(3);
    expect(state.collection).toEqual({});
    expect(state.stages['g1-kanji-shizen']).toEqual({
      bestScore: 10,
      bestStars: 3,
      cleared: false,
    });
  });

  it('v2で自動回収された項目だけを解除し、自己ベストを残す', () => {
    const stageId = 'g1-kanji-shizen';
    const [autoItem, playedItem] = curriculumItemsForStage(stageId);
    if (!autoItem || !playedItem) throw new Error('移行テスト用の必修漢字が足りません。');
    const storage = {
      getItem: () =>
        JSON.stringify({
          v: 2,
          stages: { [stageId]: { bestScore: 9, bestStars: 3, cleared: true } },
          collection: {
            [autoItem.id]: {
              recovered: true,
              firstTryCorrect: 1,
              correctCount: 1,
              missCount: 0,
              lastAnsweredAt: '1970-01-01T00:00:00.000Z',
            },
            [playedItem.id]: {
              recovered: true,
              firstTryCorrect: 1,
              correctCount: 2,
              missCount: 0,
              lastAnsweredAt: '2026-08-23T00:00:00.000Z',
            },
          },
          seen: {},
          settings: { bgm: true, sfx: true, reducedMotion: false },
        }),
    };
    const state = loadState(storage);
    expect(state.v).toBe(3);
    expect(state.collection[autoItem.id]).toBeUndefined();
    expect(state.collection[playedItem.id]?.recovered).toBe(true);
    expect(state.stages[stageId]).toEqual({ bestScore: 9, bestStars: 3, cleared: false });
  });

  it('v2でも実際に回答した回収記録とクリア状態はそのまま残す', () => {
    const stageId = 'g1-kanji-shizen';
    const item = curriculumItemsForStage(stageId)[0];
    if (!item) throw new Error('移行テスト用の必修漢字がありません。');
    const storage = {
      getItem: () =>
        JSON.stringify({
          v: 2,
          stages: { [stageId]: { bestScore: 10, bestStars: 3, cleared: true } },
          collection: {
            [item.id]: {
              recovered: true,
              firstTryCorrect: 1,
              correctCount: 1,
              missCount: 0,
              lastAnsweredAt: '2026-08-23T00:00:00.000Z',
            },
          },
          seen: {},
          settings: { bgm: true, sfx: true, reducedMotion: false },
        }),
    };
    const state = loadState(storage);
    expect(state.collection[item.id]?.recovered).toBe(true);
    expect(state.stages[stageId]?.cleared).toBe(true);
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
    recordStageResult('g1-moji-test1', 9, 10, 3, storage);
    recordStageResult('g1-moji-test1', 6, 10, 1, storage);
    const saved = JSON.parse(storage.getItem(SAVE_KEY) ?? '{}') as {
      stages: Record<string, { bestScore: number; bestStars: number; cleared: boolean }>;
    };
    expect(saved.stages['g1-moji-test1']).toEqual({
      bestScore: 9,
      bestStars: 3,
      cleared: true,
    });
  });

  it('必修項目は正解したときだけ回収し、100%回収後にステージをクリアする', () => {
    const storage = memoryStorage();
    const itemIds = curriculumItemsForStage('g1-kanji-karada').map((item) => item.id);
    const first = itemIds[0];
    if (!first) throw new Error('必修漢字がありません。');
    recordCurriculumAnswer([first], false, storage);
    expect(loadState(storage).collection[first]?.recovered).toBe(false);
    recordStageResult('g1-kanji-karada', 10, 10, 3, storage);
    expect(loadState(storage).stages['g1-kanji-karada']?.cleared).toBe(false);
    itemIds.forEach((itemId) => recordCurriculumAnswer([itemId], true, storage));
    recordStageResult('g1-kanji-karada', 10, 10, 3, storage);
    expect(loadState(storage).stages['g1-kanji-karada']?.cleared).toBe(true);
  });
});
