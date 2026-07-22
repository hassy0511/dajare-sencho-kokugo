import { describe, expect, it } from 'vitest';

import { makeHiraSeionQuiz } from '../src/content/gen/hiraSeion';
import { loadHiraWordPool, loadSea } from '../src/content/loader';

describe('ひらがな清音の問題生成', () => {
  it('データファイルをスキーマ検証して読み込める', () => {
    expect(loadSea().islands[0]?.stages[0]?.id).toBe('g1-moji-seion');
    expect(loadHiraWordPool().items.length).toBeGreaterThanOrEqual(10);
  });

  it('1000種類のseedで、正解を含む重複なし4択を10問生成する', () => {
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
        expect(question.choices[question.answer]).toBe([...question.emphasis][0]);
      });
    }
  });
});
