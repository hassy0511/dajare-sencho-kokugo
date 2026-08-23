import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { makeGrade1Quiz } from '../src/content/gen/grade1';
import { makeGrade2Quiz } from '../src/content/gen/grade2';
import { makeHiraSeionQuiz } from '../src/content/gen/hiraSeion';
import { makeMojiChoiceQuiz } from '../src/content/gen/mojiChoice';
import {
  curriculumConceptId,
  curriculumFacetRequirements,
  loadCurriculumItems,
} from '../src/content/curriculum';
import {
  loadCharacterImageLibrary,
  loadCurriculumDefinition,
  loadGrade1Bank,
  loadGrade2Bank,
  loadHiraWordPool,
  loadSea,
  loadSeas,
  loadWordImageLibrary,
  loadWorldImageLibrary,
} from '../src/content/loader';
import { GAME_TITLE } from '../src/engine/constants';

describe('ひらがな清音の問題生成', () => {
  it('データファイルをスキーマ検証して読み込める', () => {
    const sea = loadSea();
    expect(sea.islands[0]?.stages[0]?.id).toBe('g1-moji-seion');
    expect(sea.islands).toHaveLength(5);
    expect(sea.islands.flatMap((island) => island.stages)).toHaveLength(41);
    expect(
      sea.islands.flatMap((island) => island.stages).filter((stage) => stage.status === 'playable'),
    ).toHaveLength(41);
    expect(
      sea.islands.flatMap((island) => island.stages).every((stage) => stage.gen !== null),
    ).toBe(true);
    const pool = loadHiraWordPool();
    expect(pool.items).toHaveLength(30);
    expect(pool.dakuon).toHaveLength(8);
    expect(pool.sokuon).toHaveLength(8);
    expect(pool.chouon).toHaveLength(8);
    expect(pool.recoveryWords).toHaveLength(17);
    const curriculum = loadCurriculumDefinition();
    expect(curriculum.hiragana).toHaveLength(46);
    expect(curriculum.katakana).toHaveLength(46);
    expect(loadCurriculumItems()).toHaveLength(197);
    const bank = loadGrade1Bank();
    expect(bank.kanji).toHaveLength(80);
    expect(new Set(bank.kanji.map((item) => item.char)).size).toBe(80);
    expect(new Set(bank.kanji.map((item) => item.char))).toEqual(
      new Set(
        [
          '一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大小男竹中虫町天田土二日入年白八百文木本名目立力林六',
        ].join(''),
      ),
    );
  });

  it('2年生の41ステージと必修漢字160字を台帳から読み込める', () => {
    const seas = loadSeas();
    expect(seas.map((sea) => sea.id)).toEqual(['g1', 'g2']);
    const sea = loadSea('g2');
    const stages = sea.islands.flatMap((island) => island.stages);
    expect(sea.islands).toHaveLength(5);
    expect(stages).toHaveLength(41);
    expect(stages.filter((stage) => stage.status === 'playable').map((stage) => stage.id)).toEqual([
      'g2-moji-gairaigo',
    ]);
    const bank = loadGrade2Bank();
    expect(bank.kanji).toHaveLength(160);
    expect(new Set(bank.kanji.map((item) => item.char)).size).toBe(160);
    expect(new Set(bank.kanji.map((item) => item.char))).toEqual(
      new Set(
        [
          '引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話',
        ].join(''),
      ),
    );
    expect(loadCurriculumItems('g2')).toHaveLength(193);
  });

  it('2年生の最初の問題は意味からカタカナ語を選ぶ重複なし8問になる', () => {
    const bank = loadGrade2Bank();
    for (let seed = 0; seed < 100; seed += 1) {
      const questions = makeGrade2Quiz('g2-moji-gairaigo', bank, 8, seed);
      expect(questions).toHaveLength(8);
      expect(new Set(questions.map((question) => question.key)).size).toBe(8);
      questions.forEach((question) => {
        expect(question.prompt).toContain('せつめいに あう');
        expect(question.emphasis).toBeTruthy();
        expect(question.choices).toHaveLength(4);
        expect(new Set(question.choices).size).toBe(4);
        expect(question.curriculumItemIds).toEqual(['g2-concept-g2-moji-gairaigo']);
      });
    }
  });

  it('承認済みキャラクター画像が台帳と対応し、配信用と原本が存在する', () => {
    const library = loadCharacterImageLibrary();
    expect(library.generator.model).toBe('Images 2.0');
    expect(library.generator.styleGuide).toBe('art/prompts/character-mascot-style.md');
    expect(existsSync(resolve(library.generator.styleGuide))).toBe(true);
    expect(library.items).toHaveLength(3);
    expect(new Set(library.items.map((item) => item.role))).toEqual(
      new Set(['dajare-sencho', 'sumizo', 'uragaeru']),
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

  it('画像ライブラリの30語が問題プールと1対1で対応し、実ファイルが存在する', () => {
    const pool = loadHiraWordPool();
    const library = loadWordImageLibrary();
    expect(library.generator.model).toBe('Images 2.0');
    expect(library.items).toHaveLength(30);
    expect(new Set(library.items.map((item) => item.key)).size).toBe(30);
    expect(new Set(library.items.map((item) => item.src)).size).toBe(30);

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

  it('背景・船・5つの島がImages 2.0の台帳と対応し、配信用に軽量化されている', () => {
    const library = loadWorldImageLibrary();
    expect(library.generator.model).toBe('Images 2.0');
    expect(library.items).toHaveLength(9);
    expect(new Set(library.items.map((item) => item.key))).toEqual(
      new Set([
        'welcome-background',
        'ocean-map-background',
        'island-board-background',
        'welcome-ship',
        'g1-moji',
        'g1-kanji',
        'g1-kotoba',
        'g1-yomitoki',
        'g1-kakikata',
      ]),
    );

    for (const asset of library.items) {
      const assetPath = resolve('public', asset.src);
      expect(existsSync(assetPath)).toBe(true);
      expect(existsSync(resolve(asset.source))).toBe(true);
      const image = readFileSync(assetPath);
      if (asset.kind === 'background') {
        expect(image.subarray(0, 4).toString('ascii')).toBe('RIFF');
        expect(image.subarray(8, 12).toString('ascii')).toBe('WEBP');
        expect(image.byteLength).toBeLessThan(150 * 1024);
      } else {
        expect(image.readUInt32BE(16)).toBe(512);
        expect(image.readUInt32BE(20)).toBe(512);
        expect(image.includes(Buffer.from('tRNS'))).toBe(true);
        expect(image.byteLength).toBeLessThan(150 * 1024);
      }
    }
  });

  it('1000種類のseedで、4択10問を重複なく生成する', () => {
    const pool = loadHiraWordPool();
    for (let seed = 0; seed < 1000; seed += 1) {
      const questions = makeHiraSeionQuiz(pool, 10, seed);
      expect(questions).toHaveLength(10);
      expect(new Set(questions.map((question) => question.key)).size).toBe(10);
      questions.forEach((question) => {
        expect(question.choices).toHaveLength(4);
        expect(new Set(question.choices).size).toBe(4);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(4);
        if (question.choiceVisuals) {
          expect(question.choiceVisuals).toHaveLength(4);
          expect(new Set(question.choiceVisuals).size).toBe(4);
        }
        expect(question.curriculumEvidence?.length ?? 0).toBeLessThanOrEqual(1);
      });
    }
  });

  it('ひらがな46字の必須観点を、文字と絵を往復する別問題で出題できる', () => {
    const pool = loadHiraWordPool();
    const items = loadCurriculumItems().filter(
      (item) => item.stageId === 'g1-moji-seion' && item.kind === 'hiragana',
    );
    expect(items).toHaveLength(46);
    for (const item of items) {
      for (const requirement of curriculumFacetRequirements(item)) {
        const evidence = { itemId: item.id, facet: requirement.id };
        const [question] = makeHiraSeionQuiz(pool, 1, item.order, [], [evidence]);
        expect(question?.curriculumEvidence).toEqual([evidence]);
        expect(question?.curriculumItemIds).toEqual([item.id]);
        if (requirement.id === 'hira-letter-to-word') {
          expect(question?.emphasis).toBe(item.display);
          expect(question?.choiceVisuals).toHaveLength(4);
          expect(question?.choices[question.answer]).toContain(item.display);
          question?.choices.forEach((choice, index) => {
            if (index !== question.answer) expect(choice).not.toContain(item.display);
          });
        } else if (requirement.id === 'hira-word-to-letter') {
          expect(question?.visual).toBeTruthy();
          expect(question?.prompt).toContain('□');
          expect(question?.choices[question.answer]).toBe(item.display);
        } else {
          expect(item.display).toBe('を');
          expect(question?.choices[question.answer]).toBe('を');
        }
      }
    }
  });

  it('ことば全体を読む問題は個別文字ではなく独立項目だけを回収する', () => {
    const pool = loadHiraWordPool();
    const conceptId = curriculumConceptId('g1-moji-seion');
    const [question] = makeHiraSeionQuiz(pool, 1, 7, [conceptId]);
    expect(question?.curriculumItemIds).toEqual([conceptId]);
    expect(question?.curriculumEvidence).toBeUndefined();
    expect(question?.emphasis).toBeTruthy();
    expect(question?.choiceVisuals).toHaveLength(4);
  });

  it('未達観点を優先すると、ひらがな46字とことば読みを10回以内で出題できる', () => {
    const hira = loadHiraWordPool();
    const stageItems = loadCurriculumItems().filter((item) => item.stageId === 'g1-moji-seion');
    const missingItemIds = new Set(stageItems.map((item) => item.id));
    const missingEvidence = new Map(
      stageItems.flatMap((item) =>
        curriculumFacetRequirements(item).map((requirement) => {
          const evidence = { itemId: item.id, facet: requirement.id };
          return [`${evidence.itemId}:${evidence.facet}`, evidence] as const;
        }),
      ),
    );
    for (let session = 0; session < 10 && missingItemIds.size > 0; session += 1) {
      const questions = makeHiraSeionQuiz(
        hira,
        10,
        session,
        [...missingItemIds],
        [...missingEvidence.values()],
      );
      questions.forEach((question) => {
        question.curriculumEvidence?.forEach((evidence) => {
          missingEvidence.delete(`${evidence.itemId}:${evidence.facet}`);
        });
        if (question.curriculumItemIds.includes(curriculumConceptId('g1-moji-seion'))) {
          missingItemIds.delete(curriculumConceptId('g1-moji-seion'));
        }
      });
      stageItems.forEach((item) => {
        const requirements = curriculumFacetRequirements(item);
        if (
          requirements.length > 0 &&
          requirements.every((requirement) => !missingEvidence.has(`${item.id}:${requirement.id}`))
        ) {
          missingItemIds.delete(item.id);
        }
      });
    }
    expect([...missingEvidence.keys()]).toEqual([]);
    expect([...missingItemIds]).toEqual([]);
  });

  it('未回収項目を優先すると、カタカナ46字と漢字80字を必ず出題できる', () => {
    const bank = loadGrade1Bank();
    const hira = loadHiraWordPool();
    for (const stageId of [
      'g1-moji-katakana',
      'g1-kanji-shizen',
      'g1-kanji-karada',
      'g1-kanji-kazu',
      'g1-kanji-gakko',
      'g1-kanji-muki',
    ]) {
      const missing = new Set(
        loadCurriculumItems()
          .filter((item) => item.stageId === stageId)
          .map((item) => item.id),
      );
      for (let session = 0; session < 10 && missing.size > 0; session += 1) {
        const questions = makeGrade1Quiz(stageId, bank, hira, 10, session, [...missing]);
        questions
          .flatMap((question) => question.curriculumItemIds)
          .forEach((id) => missing.delete(id));
      }
      expect([...missing], `${stageId}に回収できない項目があります`).toEqual([]);
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

  it('残り37ステージが100種類のseedで必要問題数の重複なし4択を生成する', () => {
    const sea = loadSea();
    const bank = loadGrade1Bank();
    const hira = loadHiraWordPool();
    const stages = sea.islands
      .flatMap((island) => island.stages)
      .filter((stage) => stage.gen === 'grade1');
    expect(stages).toHaveLength(37);

    for (const stage of stages) {
      for (let seed = 0; seed < 100; seed += 1) {
        const questions = makeGrade1Quiz(stage.id, bank, hira, stage.n, seed);
        expect(questions).toHaveLength(stage.n);
        expect(new Set(questions.map((question) => question.key)).size).toBe(stage.n);
        for (const question of questions) {
          expect(question.choices).toHaveLength(4);
          expect(new Set(question.choices).size).toBe(4);
          expect(question.answer).toBeGreaterThanOrEqual(0);
          expect(question.answer).toBeLessThan(4);
          expect(question.choices[question.answer]).toBeTruthy();
          const kanjiByCharacter = new Map(
            bank.kanji.map((item) => [item.char, item.reading] as const),
          );
          if (question.choices.every((choice) => kanjiByCharacter.has(choice))) {
            const answerReading = kanjiByCharacter.get(question.choices[question.answer] ?? '');
            expect(
              question.choices.filter((choice) => kanjiByCharacter.get(choice) === answerReading),
            ).toHaveLength(1);
          }
        }
      }
    }
  });

  it('読解のことば探しは本文にある正解だけを選択肢に含める', () => {
    const bank = loadGrade1Bank();
    const hira = loadHiraWordPool();
    for (let seed = 0; seed < 100; seed += 1) {
      const questions = makeGrade1Quiz('g1-yomi-kotoba', bank, hira, 8, seed);
      for (const question of questions) {
        const text = question.emphasis ?? '';
        const answer = question.choices[question.answer] ?? '';
        expect(text).toContain(answer);
        for (const [index, choice] of question.choices.entries()) {
          if (index !== question.answer) expect(text).not.toContain(choice);
        }
      }
    }
  });

  it('もじの確認テストとボスでも承認済み画像問題を出題する', () => {
    const bank = loadGrade1Bank();
    const hira = loadHiraWordPool();
    for (const stageId of ['g1-moji-test1', 'g1-moji-boss']) {
      const questions = Array.from({ length: 20 }, (_, seed) =>
        makeGrade1Quiz(stageId, bank, hira, 12, seed),
      ).flat();
      expect(questions.some((question) => question.visual !== null)).toBe(true);
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

  it('2年生の挑戦状に承認済みのウラガエルが登場する', () => {
    const sea = loadSea('g2');
    expect(sea.challenge).toContainEqual({
      speaker: 'ウラガエル',
      role: 'uragaeru',
      text: expect.stringContaining('カエルだけに な!'),
    });
  });
});
