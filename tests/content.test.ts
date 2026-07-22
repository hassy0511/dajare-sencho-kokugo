import { describe, expect, it } from 'vitest';

import { makeHiraSeionQuiz } from '../src/content/gen/hiraSeion';
import { loadHiraWordPool, loadSea } from '../src/content/loader';

describe('ひらがな清音の問題生成', () => {
  it('データファイルをスキーマ検証して読み込める', () => {
    const sea = loadSea();
    expect(sea.islands[0]?.stages[0]?.id).toBe('g1-moji-seion');
    expect(sea.islands).toHaveLength(5);
    expect(sea.islands.flatMap((island) => island.stages)).toHaveLength(41);
    expect(loadHiraWordPool().items.length).toBeGreaterThanOrEqual(8);
  });

  it('1000種類のseedで、絵の正解語を含む重複なし4択を8問生成する', () => {
    const pool = loadHiraWordPool();
    for (let seed = 0; seed < 1000; seed += 1) {
      const questions = makeHiraSeionQuiz(pool.items, 8, seed);
      expect(questions).toHaveLength(8);
      expect(new Set(questions.map((question) => question.key)).size).toBe(8);
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
