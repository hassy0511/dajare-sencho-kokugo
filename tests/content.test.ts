import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { makeHiraSeionQuiz } from '../src/content/gen/hiraSeion';
import { loadHiraWordPool, loadSea, loadWordImageLibrary } from '../src/content/loader';
import { GAME_TITLE } from '../src/engine/constants';

describe('ひらがな清音の問題生成', () => {
  it('データファイルをスキーマ検証して読み込める', () => {
    const sea = loadSea();
    expect(sea.islands[0]?.stages[0]?.id).toBe('g1-moji-seion');
    expect(sea.islands).toHaveLength(5);
    expect(sea.islands.flatMap((island) => island.stages)).toHaveLength(41);
    expect(loadHiraWordPool().items).toHaveLength(16);
  });

  it('画像ライブラリの16語が問題プールと1対1で対応し、実ファイルが存在する', () => {
    const pool = loadHiraWordPool();
    const library = loadWordImageLibrary();
    expect(library.generator.model).toBe('Images 2.0');
    expect(library.items).toHaveLength(16);
    expect(new Set(library.items.map((item) => item.key)).size).toBe(16);
    expect(new Set(library.items.map((item) => item.src)).size).toBe(16);

    for (const poolItem of pool.items) {
      const asset = library.items.find((item) => item.key === poolItem.visual);
      expect(asset?.word).toBe(poolItem.w);
      if (!asset) throw new Error(`画像ライブラリに ${poolItem.visual} がありません。`);
      const assetPath = resolve('public', asset.src);
      expect(existsSync(assetPath)).toBe(true);
      const png = readFileSync(assetPath);
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(512);
      expect(png.byteLength).toBeLessThan(500 * 1024);
    }
  });

  it('1000種類のseedで、絵の正解語を含む重複なし4択を10問生成する', () => {
    const pool = loadHiraWordPool();
    for (let seed = 0; seed < 1000; seed += 1) {
      const questions = makeHiraSeionQuiz(pool.items, 10, seed);
      expect(questions).toHaveLength(10);
      expect(new Set(questions.map((question) => question.key)).size).toBe(10);
      questions.forEach((question) => {
        expect(question.choices).toHaveLength(4);
        expect(new Set(question.choices).size).toBe(4);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(4);
        const item = pool.items.find((candidate) => candidate.visual === question.visual);
        expect(question.choices[question.answer]).toBe(item?.w);
      });
    }
  });
});

describe('canonical character name', () => {
  it('uses ダジャーレせんちょう consistently in the title and story data', () => {
    const sea = loadSea();
    expect(GAME_TITLE).toContain('ダジャーレせんちょう');
    expect(GAME_TITLE).not.toContain('ダジャレせんちょう');
    expect(sea.challenge[0]).toMatchObject({
      speaker: 'ダジャーレせんちょう',
      role: 'dajare-sencho',
    });
  });
});
