import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { makeHiraSeionQuiz } from '../src/content/gen/hiraSeion';
import { makeMojiChoiceQuiz } from '../src/content/gen/mojiChoice';
import {
  loadCharacterImageLibrary,
  loadHiraWordPool,
  loadSea,
  loadWordImageLibrary,
} from '../src/content/loader';
import { GAME_TITLE } from '../src/engine/constants';

describe('ひらがな清音の問題生成', () => {
  it('データファイルをスキーマ検証して読み込める', () => {
    const sea = loadSea();
    expect(sea.islands[0]?.stages[0]?.id).toBe('g1-moji-seion');
    expect(sea.islands).toHaveLength(5);
    expect(sea.islands.flatMap((island) => island.stages)).toHaveLength(41);
    expect(sea.islands[0]?.stages.filter((stage) => stage.status === 'playable')).toHaveLength(4);
    const pool = loadHiraWordPool();
    expect(pool.items).toHaveLength(16);
    expect(pool.dakuon).toHaveLength(8);
    expect(pool.sokuon).toHaveLength(8);
    expect(pool.chouon).toHaveLength(8);
  });

  it('承認済みキャラクター画像が台帳と対応し、配信用と原本が存在する', () => {
    const library = loadCharacterImageLibrary();
    expect(library.generator.model).toBe('Images 2.0');
    expect(library.generator.styleGuide).toBe('art/prompts/character-mascot-style.md');
    expect(existsSync(resolve(library.generator.styleGuide))).toBe(true);
    expect(library.items).toHaveLength(2);
    expect(new Set(library.items.map((item) => item.role))).toEqual(
      new Set(['dajare-sencho', 'sumizo']),
    );

    for (const asset of library.items) {
      const assetPath = resolve('public', asset.src);
      expect(existsSync(assetPath)).toBe(true);
      expect(existsSync(resolve(asset.source))).toBe(true);
      const png = readFileSync(assetPath);
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(512);
      expect(png.byteLength).toBeLessThan(500 * 1024);
    }
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

  it('追加3ステージがseedにかかわらず重複なし8問・4択を生成する', () => {
    const pool = loadHiraWordPool();
    const categories = [
      ['hira-dakuon', pool.dakuon],
      ['hira-sokuon', pool.sokuon],
      ['hira-chouon', pool.chouon],
    ] as const;

    for (const [category, items] of categories) {
      for (let seed = 0; seed < 1000; seed += 1) {
        const questions = makeMojiChoiceQuiz(category, items, 8, seed);
        expect(questions).toHaveLength(8);
        expect(new Set(questions.map((question) => question.key)).size).toBe(8);
        questions.forEach((question) => {
          expect(question.visual).toBeNull();
          expect(question.choices).toHaveLength(4);
          expect(new Set(question.choices).size).toBe(4);
          expect(question.answer).toBeGreaterThanOrEqual(0);
          expect(question.answer).toBeLessThan(4);
          const source = items.find((item) => question.key.endsWith(item.key));
          expect(question.choices[question.answer]).toBe(source?.answer);
        });
      }
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
