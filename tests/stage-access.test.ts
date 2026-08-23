import { describe, expect, it } from 'vitest';

import { loadSea } from '../src/content/loader';
import {
  getNextPlayableStage,
  getStageAccess,
  isSeaComplete,
} from '../src/engine/progression/stage-access';
import type { SaveState } from '../src/engine/save/state';
import { curriculumItemsForStage } from '../src/content/curriculum';

function stateWithClears(...stageIds: string[]): SaveState {
  return {
    v: 3,
    stages: Object.fromEntries(
      stageIds.map((stageId) => [stageId, { bestScore: 8, bestStars: 3, cleared: true }]),
    ),
    collection: Object.fromEntries(
      stageIds.flatMap((stageId) =>
        curriculumItemsForStage(stageId).map((item) => [
          item.id,
          {
            recovered: true,
            firstTryCorrect: 1,
            correctCount: 1,
            missCount: 0,
            lastAnsweredAt: new Date(0).toISOString(),
          },
        ]),
      ),
    ),
    seen: {},
    settings: { bgm: true, sfx: true, reducedMotion: false },
  };
}

describe('ステージの順次アンロック', () => {
  const island = loadSea().islands[0];
  if (!island) throw new Error('もじの しまがありません。');

  it('最初だけ開き、直前をクリアすると次が開く', () => {
    const empty = stateWithClears();
    expect(getStageAccess(island.stages, 0, empty)).toBe('available');
    expect(getStageAccess(island.stages, 1, empty)).toBe('locked');
    expect(getStageAccess(island.stages, 4, empty)).toBe('locked');

    const afterStage1 = stateWithClears('g1-moji-seion');
    expect(getStageAccess(island.stages, 1, afterStage1)).toBe('available');
    expect(getStageAccess(island.stages, 2, afterStage1)).toBe('locked');

    const afterStage2 = stateWithClears('g1-moji-seion', 'g1-moji-dakuon');
    expect(getStageAccess(island.stages, 2, afterStage2)).toBe('available');
  });

  it('クリア後の次ステージ導線は公開済みの直後だけを返す', () => {
    expect(getNextPlayableStage(island, 'g1-moji-seion')?.id).toBe('g1-moji-dakuon');
    expect(getNextPlayableStage(island, 'g1-moji-dakuon')?.id).toBe('g1-moji-sokuon');
    expect(getNextPlayableStage(island, 'g1-moji-sokuon')?.id).toBe('g1-moji-chouon');
    expect(getNextPlayableStage(island, 'g1-moji-chouon')?.id).toBe('g1-moji-test1');
    expect(getNextPlayableStage(island, 'g1-moji-boss')).toBeUndefined();
  });

  it('全41ステージのクリアを1年生の海の完了として判定する', () => {
    const sea = loadSea();
    const stageIds = sea.islands.flatMap((candidate) => candidate.stages.map((stage) => stage.id));
    expect(stageIds).toHaveLength(41);
    expect(isSeaComplete(sea, stateWithClears(...stageIds))).toBe(true);
    expect(isSeaComplete(sea, stateWithClears(...stageIds.slice(0, -1)))).toBe(false);
  });

  it('2年生は最初の縦切りだけ遊べて、未公開ステージを開かない', () => {
    const sea = loadSea('g2');
    const firstIsland = sea.islands[0];
    if (!firstIsland) throw new Error('2年生の もじの しまがありません。');
    expect(getStageAccess(firstIsland.stages, 0, stateWithClears())).toBe('available');
    expect(getStageAccess(firstIsland.stages, 1, stateWithClears('g2-moji-gairaigo'))).toBe(
      'planned',
    );
    expect(isSeaComplete(sea, stateWithClears('g2-moji-gairaigo'))).toBe(false);
  });
});
