import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

import type { SeaDefinition } from '../src/types/content';

const sea = JSON.parse(
  readFileSync(new URL('../data/g1/sea.json', import.meta.url), 'utf8'),
) as SeaDefinition;
const grade1StageIds = sea.islands.flatMap((island) => island.stages.map((stage) => stage.id));
const curriculum = JSON.parse(
  readFileSync(new URL('../data/g1/curriculum_items.json', import.meta.url), 'utf8'),
) as {
  hiragana: string[];
  katakana: string[];
  concepts: { stageId: string }[];
};
const grade1Bank = JSON.parse(
  readFileSync(new URL('../data/g1/pools/grade1_bank.json', import.meta.url), 'utf8'),
) as { kanji: { char: string; group: 'nature' | 'body' | 'number' | 'school' | 'action' }[] };
const kanjiStageByGroup = {
  nature: 'g1-kanji-shizen',
  body: 'g1-kanji-karada',
  number: 'g1-kanji-kazu',
  school: 'g1-kanji-gakko',
  action: 'g1-kanji-muki',
} as const;
const grade1CurriculumItems = [
  ...curriculum.hiragana.map((character) => ({
    id: `g1-hira-${character}`,
    stageId: 'g1-moji-seion',
  })),
  ...curriculum.katakana.map((character) => ({
    id: `g1-kata-${character}`,
    stageId: 'g1-moji-katakana',
  })),
  ...grade1Bank.kanji.map((item) => ({
    id: `g1-kanji-${item.char}`,
    stageId: kanjiStageByGroup[item.group],
  })),
  ...curriculum.concepts.map((concept) => ({
    id: `g1-concept-${concept.stageId}`,
    stageId: concept.stageId,
  })),
];
const APP_BASE = '/dajare-sencho-kokugo/';

function completedGrade1State(stageIds: readonly string[]) {
  const clearedStageIds = new Set(stageIds);
  return {
    v: 4,
    stages: Object.fromEntries(
      stageIds.map((stageId) => [stageId, { bestScore: 8, bestStars: 3, cleared: true }]),
    ),
    collection: Object.fromEntries(
      grade1CurriculumItems
        .filter((item) => clearedStageIds.has(item.stageId))
        .map((item) => [
          item.id,
          {
            recovered: true,
            facets: item.id.startsWith('g1-hira-')
              ? item.id === 'g1-hira-を'
                ? { 'hira-use': true }
                : { 'hira-letter-to-word': true, 'hira-word-to-letter': true }
              : {},
            firstTryCorrect: 1,
            correctCount: 1,
            missCount: 0,
            lastAnsweredAt: '2026-08-23T00:00:00.000Z',
          },
        ]),
    ),
    seen: { 'challenge:g1': true },
    settings: { bgm: true, sfx: true, reducedMotion: false },
  };
}

async function startUpdateTestServer(): Promise<{
  activateUpdate: () => void;
  close: () => Promise<void>;
  origin: string;
}> {
  const distRoot = resolve('dist');
  let updated = false;
  const mimeTypes: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.webmanifest': 'application/manifest+json',
    '.woff': 'font/woff',
  };
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (!url.pathname.startsWith(APP_BASE)) {
        response.writeHead(404).end();
        return;
      }
      const relativePath = url.pathname.slice(APP_BASE.length) || 'index.html';
      const filePath = resolve(distRoot, relativePath);
      if (!filePath.startsWith(`${distRoot}${sep}`)) {
        response.writeHead(403).end();
        return;
      }
      let contents: Buffer | string = await readFile(filePath);
      if (relativePath === 'sw.js') {
        if (!updated) {
          contents = `${contents.toString('utf8')}\n/* update-test-version: before */`;
        }
      }
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
        'Service-Worker-Allowed': APP_BASE,
      });
      response.end(contents);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolveListen) => {
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('更新テスト用サーバを起動できません。');
  return {
    activateUpdate: () => {
      updated = true;
    },
    close: () =>
      new Promise<void>((resolveClose, rejectClose) => {
        server.close((error) => (error ? rejectClose(error) : resolveClose()));
      }),
    origin: `http://127.0.0.1:${address.port}`,
  };
}

async function tapGamePoint(
  page: Page,
  canvas: Locator,
  gameX: number,
  gameY: number,
): Promise<void> {
  const box = await canvas.boundingBox();
  if (!box) throw new Error('ゲームCanvasの表示領域を取得できません。');

  await page.touchscreen.tap(
    box.x + (box.width * gameX) / 810,
    box.y + (box.height * gameY) / 1080,
  );
}

const choiceCenters = [
  { x: 220, y: 680 },
  { x: 590, y: 680 },
  { x: 220, y: 855 },
  { x: 590, y: 855 },
] as const;

const pictureChoiceCenters = [
  { x: 220, y: 570 },
  { x: 590, y: 570 },
  { x: 220, y: 815 },
  { x: 590, y: 815 },
] as const;

async function answerCenter(shell: Locator, answer: number): Promise<{ x: number; y: number }> {
  const centers =
    (await shell.getAttribute('data-choice-layout')) === 'picture'
      ? pictureChoiceCenters
      : choiceCenters;
  const center = centers[answer];
  if (!center) throw new Error(`正解位置 ${answer} が選択肢の範囲外です。`);
  return center;
}

async function answerQuiz(
  page: Page,
  canvas: Locator,
  shell: Locator,
  questionCount: number,
): Promise<void> {
  await answerQuizFrom(page, canvas, shell, 0, questionCount);
}

async function answerQuizFrom(
  page: Page,
  canvas: Locator,
  shell: Locator,
  startIndex: number,
  questionCount: number,
): Promise<void> {
  for (let index = startIndex; index < questionCount; index += 1) {
    const answer = await page.evaluate(() => window.__DSK_APP__?.answerIndex);
    if (answer === undefined) throw new Error(`${index + 1}問目の正解位置を取得できません。`);
    const center = await answerCenter(shell, answer);
    await tapGamePoint(page, canvas, center.x, center.y);
    if (index < questionCount - 1) {
      await expect(shell).toHaveAttribute('data-question', String(index + 1));
    }
  }
  await expect(shell).toHaveAttribute('data-scene', 'result');
  await expect(shell).toHaveAttribute('data-stars', '3');
}

async function recoverAndClearCurrentStage(
  page: Page,
  canvas: Locator,
  shell: Locator,
  questionCount: number,
): Promise<void> {
  for (let session = 0; session < 10; session += 1) {
    await answerQuiz(page, canvas, shell, questionCount);
    if ((await shell.getAttribute('data-stage-cleared')) === 'true') return;
    await tapGamePoint(page, canvas, 580, 790);
    await expect(shell).toHaveAttribute('data-scene', 'stage-intro');
    await tapGamePoint(page, canvas, 405, 835);
    await expect(shell).toHaveAttribute('data-scene', 'quiz');
  }
  throw new Error('10回のちょうせんで必修項目をすべて回収できませんでした。');
}

async function openIslandMap(
  page: Page,
  canvas: Locator,
  shell: Locator,
  island: { x: number; y: number },
): Promise<void> {
  await tapGamePoint(page, canvas, 405, 882);
  await expect(shell).toHaveAttribute('data-scene', 'sea-select');
  await tapGamePoint(page, canvas, 405, 315);
  await expect(shell).toHaveAttribute('data-scene', 'island-select');
  await tapGamePoint(page, canvas, island.x, island.y);
  await expect(shell).toHaveAttribute('data-scene', 'island-map');
}

test('物語から入り、文字を図鑑へ回収して最初のステージをクリアする', async ({ page }, testInfo) => {
  test.setTimeout(360_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');

  const shell = page.locator('#game-shell');
  const canvas = page.locator('canvas');
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '810');
  await expect(canvas).toHaveAttribute('height', '1080');
  await expect(page.locator('#audio-toggle')).toHaveAttribute('data-enabled', 'true');
  await expect(shell).toHaveAttribute('data-bgm', 'map');

  await page.screenshot({ path: testInfo.outputPath('welcome.png'), fullPage: true });

  await tapGamePoint(page, canvas, 405, 882);
  await expect(shell).toHaveAttribute('data-scene', 'sea-select');
  await expect(shell).toHaveAttribute('data-audio-context', 'running');
  await expect(shell).toHaveAttribute('data-bgm-playing', 'map');
  await expect(shell).toHaveAttribute('data-last-sfx', 'tap');
  await page.screenshot({ path: testInfo.outputPath('sea-select.png'), fullPage: true });

  await tapGamePoint(page, canvas, 405, 315);
  await expect(shell).toHaveAttribute('data-scene', 'challenge-story');
  await page.screenshot({ path: testInfo.outputPath('challenge-story.png'), fullPage: true });
  await tapGamePoint(page, canvas, 405, 910);
  await expect.poll(() => page.evaluate(() => window.__DSK_APP__?.storyPage)).toBe(1);
  await page.screenshot({
    path: testInfo.outputPath('challenge-story-sumizo.png'),
    fullPage: true,
  });
  await tapGamePoint(page, canvas, 405, 910);
  await expect.poll(() => page.evaluate(() => window.__DSK_APP__?.storyPage)).toBe(2);
  await page.screenshot({ path: testInfo.outputPath('challenge-story-rule.png'), fullPage: true });
  await tapGamePoint(page, canvas, 405, 910);
  await expect.poll(() => page.evaluate(() => window.__DSK_APP__?.storyPage)).toBe(3);
  await page.screenshot({ path: testInfo.outputPath('challenge-story-goal.png'), fullPage: true });
  await tapGamePoint(page, canvas, 405, 910);
  await expect(shell).toHaveAttribute('data-scene', 'island-select');
  await page.screenshot({ path: testInfo.outputPath('island-select.png'), fullPage: true });

  await tapGamePoint(page, canvas, 405, 1005);
  await expect(shell).toHaveAttribute('data-scene', 'collection');
  await expect(shell).toHaveAttribute('data-collection-total', '97');
  await page.screenshot({ path: testInfo.outputPath('collection-before.png'), fullPage: true });
  await tapGamePoint(page, canvas, 87, 60);
  await expect(shell).toHaveAttribute('data-scene', 'island-select');

  await tapGamePoint(page, canvas, 220, 315);
  await expect(shell).toHaveAttribute('data-scene', 'island-map');
  await expect(shell).toHaveAttribute('data-island', 'g1-moji');
  await page.screenshot({ path: testInfo.outputPath('moji-island-map.png'), fullPage: true });

  await tapGamePoint(page, canvas, 590, 245);
  await expect(page.locator('#game-status')).toHaveText(/ひとつ まえ/);
  await tapGamePoint(page, canvas, 220, 245);
  await expect(shell).toHaveAttribute('data-scene', 'stage-intro');
  await page.screenshot({ path: testInfo.outputPath('stage-intro.png'), fullPage: true });

  await tapGamePoint(page, canvas, 405, 835);
  await expect(shell).toHaveAttribute('data-scene', 'quiz');
  await expect(shell).toHaveAttribute('data-input-ready', 'true');
  await expect(shell).toHaveAttribute('data-bgm', 'quiz');
  await page.screenshot({ path: testInfo.outputPath('quiz-first-question.png'), fullPage: true });

  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 1000);
  const firstAnswer = await page.evaluate(() => window.__DSK_APP__?.answerIndex);
  if (firstAnswer === undefined) throw new Error('1もんめの正解位置を取得できませんでした。');
  const firstCenter = await answerCenter(shell, firstAnswer);
  await tapGamePoint(page, canvas, firstCenter.x, firstCenter.y);
  await expect(shell).toHaveAttribute('data-recovery-reveal', 'true');
  await expect(shell).toHaveAttribute('data-recovered-items', /.+/);
  await page.clock.runFor(16);
  await canvas.screenshot({ path: testInfo.outputPath('ink-reveal-register.png') });
  await page.clock.runFor(900);
  await page.clock.resume();
  await expect(shell).toHaveAttribute('data-question', '1');
  await answerQuizFrom(page, canvas, shell, 1, 10);
  if ((await shell.getAttribute('data-stage-cleared')) !== 'true') {
    await tapGamePoint(page, canvas, 580, 790);
    await expect(shell).toHaveAttribute('data-scene', 'stage-intro');
    await tapGamePoint(page, canvas, 405, 835);
    await expect(shell).toHaveAttribute('data-scene', 'quiz');
    await recoverAndClearCurrentStage(page, canvas, shell, 10);
  }
  await page.screenshot({ path: testInfo.outputPath('result-three-stars.png'), fullPage: true });

  await expect(shell).toHaveAttribute('data-next-stage', 'g1-moji-dakuon');
  await tapGamePoint(page, canvas, 580, 790);
  await expect(shell).toHaveAttribute('data-scene', 'stage-intro');
  await expect(shell).toHaveAttribute('data-stage', 'g1-moji-dakuon');
  await page.screenshot({ path: testInfo.outputPath('dakuon-stage-intro.png'), fullPage: true });
  await tapGamePoint(page, canvas, 405, 970);
  await expect(shell).toHaveAttribute('data-scene', 'island-map');
  await tapGamePoint(page, canvas, 725, 65);
  await expect(shell).toHaveAttribute('data-scene', 'collection');
  await tapGamePoint(page, canvas, 105, 335);
  await expect(shell).toHaveAttribute('data-collection-item', 'あ');
  await expect(shell).toHaveAttribute('data-collection-item-recovered', 'true');
  await page.screenshot({
    path: testInfo.outputPath('collection-after-detail.png'),
    fullPage: true,
  });
  const saved = await page.evaluate(() => localStorage.getItem('dsk_state'));
  expect(saved).toContain('g1-moji-seion');
  expect(saved).toContain('g1-hira-あ');
});

test('2年生の海へ入り、意味からカタカナ語を選ぶ最初のステージを遊べる', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');

  const shell = page.locator('#game-shell');
  const canvas = page.locator('canvas');
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await tapGamePoint(page, canvas, 405, 882);
  await expect(shell).toHaveAttribute('data-scene', 'sea-select');
  await page.screenshot({ path: testInfo.outputPath('grade2-sea-card.png'), fullPage: true });

  await tapGamePoint(page, canvas, 405, 495);
  await expect(shell).toHaveAttribute('data-scene', 'challenge-story');
  await page.screenshot({ path: testInfo.outputPath('grade2-challenge.png'), fullPage: true });
  await tapGamePoint(page, canvas, 405, 910);
  await expect.poll(() => page.evaluate(() => window.__DSK_APP__?.storyPage)).toBe(1);
  await page.screenshot({
    path: testInfo.outputPath('grade2-challenge-uragaeru.png'),
    fullPage: true,
  });
  await tapGamePoint(page, canvas, 405, 910);
  await tapGamePoint(page, canvas, 405, 910);
  await tapGamePoint(page, canvas, 405, 910);
  await expect(shell).toHaveAttribute('data-scene', 'island-select');
  await page.screenshot({ path: testInfo.outputPath('grade2-islands.png'), fullPage: true });

  await tapGamePoint(page, canvas, 405, 1005);
  await expect(shell).toHaveAttribute('data-scene', 'collection');
  await expect(shell).toHaveAttribute('data-collection-island', 'g2-moji');
  await expect(shell).toHaveAttribute('data-collection-total', '7');
  await tapGamePoint(page, canvas, 87, 60);
  await expect(shell).toHaveAttribute('data-scene', 'island-select');

  await tapGamePoint(page, canvas, 220, 315);
  await expect(shell).toHaveAttribute('data-scene', 'island-map');
  await expect(shell).toHaveAttribute('data-island', 'g2-moji');
  await tapGamePoint(page, canvas, 220, 245);
  await expect(shell).toHaveAttribute('data-stage', 'g2-moji-gairaigo');
  await tapGamePoint(page, canvas, 405, 835);
  await expect(shell).toHaveAttribute('data-scene', 'quiz');
  await page.screenshot({ path: testInfo.outputPath('grade2-first-question.png'), fullPage: true });

  await answerQuiz(page, canvas, shell, 8);
  await expect(shell).toHaveAttribute('data-stage-cleared', 'true');
  await expect(shell).not.toHaveAttribute('data-next-stage');
  await page.screenshot({ path: testInfo.outputPath('grade2-first-result.png'), fullPage: true });
  const saved = await page.evaluate(() => localStorage.getItem('dsk_state'));
  expect(saved).toContain('g2-moji-gairaigo');
  expect(saved).toContain('g2-concept-g2-moji-gairaigo');
});

test('v2で自動コンプリートされた1年生図鑑を未回収へ戻す', async ({ page }, testInfo) => {
  const autoCollection = Object.fromEntries(
    grade1CurriculumItems.map((item) => [
      item.id,
      {
        recovered: true,
        firstTryCorrect: 1,
        correctCount: 1,
        missCount: 0,
        lastAnsweredAt: '1970-01-01T00:00:00.000Z',
      },
    ]),
  );
  await page.addInitScript(
    ({ collection, stageIds }) => {
      localStorage.setItem(
        'dsk_state',
        JSON.stringify({
          v: 2,
          stages: Object.fromEntries(
            stageIds.map((stageId) => [stageId, { bestScore: 8, bestStars: 3, cleared: true }]),
          ),
          collection,
          seen: { 'challenge:g1': true },
          settings: { bgm: true, sfx: true, reducedMotion: false },
        }),
      );
    },
    { collection: autoCollection, stageIds: grade1StageIds },
  );
  await page.goto('./');

  const shell = page.locator('#game-shell');
  const canvas = page.locator('canvas');
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await tapGamePoint(page, canvas, 405, 882);
  await expect(shell).toHaveAttribute('data-scene', 'sea-select');
  await tapGamePoint(page, canvas, 405, 315);
  await expect(shell).toHaveAttribute('data-scene', 'island-select');
  await tapGamePoint(page, canvas, 405, 1005);
  await expect(shell).toHaveAttribute('data-scene', 'collection');
  await expect(shell).toHaveAttribute('data-collection-total', '97');
  await expect(shell).toHaveAttribute('data-collection-recovered', '0');
  await page.screenshot({
    path: testInfo.outputPath('v2-auto-collection-reset.png'),
    fullPage: true,
  });
});

test('おとのオン・オフを保存し、再読み込み後も引き継ぐ', async ({ page }, testInfo) => {
  await page.goto('./');

  const shell = page.locator('#game-shell');
  const toggle = page.locator('#audio-toggle');
  await expect(toggle).toHaveAttribute('data-enabled', 'true');
  await page.screenshot({ path: testInfo.outputPath('audio-toggle-on.png'), fullPage: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('data-enabled', 'false');
  await expect(shell).toHaveAttribute('data-audio', 'off');
  await page.screenshot({ path: testInfo.outputPath('audio-toggle-off.png'), fullPage: true });
  expect(await page.evaluate(() => localStorage.getItem('dsk_state'))).toContain('"bgm":false');

  await page.reload();
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#audio-toggle')).toHaveAttribute('data-enabled', 'false');
  await expect(shell).toHaveAttribute('data-audio', 'off');
});

test('最初のタップで音声を開始し、BGMと効果音を再生する', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');

  const shell = page.locator('#game-shell');
  const canvas = page.locator('canvas');
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await tapGamePoint(page, canvas, 405, 882);

  await expect(shell).toHaveAttribute('data-scene', 'sea-select');
  await expect(shell).toHaveAttribute('data-audio-context', 'running');
  await expect(shell).toHaveAttribute('data-bgm-playing', 'map');
  await expect(shell).toHaveAttribute('data-last-sfx', 'tap');
});

test('音源視聴ページでBGMと効果音を個別に確認できる', async ({ page }, testInfo) => {
  await page.goto('./audio-preview.html');

  const preview = page.locator('#audio-preview');
  await expect(preview).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-kind="bgm"]')).toHaveCount(3);
  await expect(page.locator('[data-kind="sfx"]')).toHaveCount(8);
  await expect(page.locator('#preview-volume-value')).toHaveText('100%（ゲームと おなじ）');

  const mapButton = page.locator('[data-audio-key="bgm:map"] .play-button');
  await mapButton.click();
  await expect(preview).toHaveAttribute('data-playing', 'map');
  await expect(mapButton).toHaveText('とめる');
  await page.screenshot({ path: testInfo.outputPath('audio-preview-playing.png'), fullPage: true });

  await page.locator('#preview-stop').click();
  await expect(preview).toHaveAttribute('data-playing', 'none');
  await expect(mapButton).toHaveText('きく');
});

const additionalStageCases = [
  {
    id: 'g1-moji-test1',
    cleared: ['g1-moji-seion', 'g1-moji-dakuon', 'g1-moji-sokuon', 'g1-moji-chouon'],
    island: { x: 220, y: 315 },
    node: { x: 220, y: 529 },
    next: 'g1-moji-youon',
    questionCount: 10,
  },
  {
    id: 'g1-kanji-shizen',
    cleared: [],
    island: { x: 590, y: 315 },
    node: { x: 220, y: 245 },
    next: 'g1-kanji-karada',
    questionCount: 10,
  },
  {
    id: 'g1-kotoba-nakama',
    cleared: [],
    island: { x: 220, y: 565 },
    node: { x: 220, y: 245 },
    next: 'g1-kotoba-kazoe',
    questionCount: 8,
  },
  {
    id: 'g1-yomi-dare',
    cleared: [],
    island: { x: 590, y: 565 },
    node: { x: 220, y: 245 },
    next: 'g1-yomi-nani',
    questionCount: 8,
  },
  {
    id: 'g1-kaki-kumitate',
    cleared: [],
    island: { x: 405, y: 815 },
    node: { x: 220, y: 245 },
    next: 'g1-kaki-teniwoha',
    questionCount: 8,
  },
] as const;

for (const stageCase of additionalStageCases) {
  test(`${stageCase.id}を規定問題数クリアできる`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(
      (state) => localStorage.setItem('dsk_state', JSON.stringify(state)),
      completedGrade1State(stageCase.cleared),
    );
    await page.goto('./');

    const shell = page.locator('#game-shell');
    const canvas = page.locator('canvas');
    await expect(shell).toHaveAttribute('data-ready', 'true');
    await openIslandMap(page, canvas, shell, stageCase.island);
    await tapGamePoint(page, canvas, stageCase.node.x, stageCase.node.y);
    await expect(shell).toHaveAttribute('data-scene', 'stage-intro');
    await expect(shell).toHaveAttribute('data-stage', stageCase.id);
    await tapGamePoint(page, canvas, 405, 835);
    await expect(shell).toHaveAttribute('data-scene', 'quiz');
    await page.screenshot({
      path: testInfo.outputPath(`${stageCase.id}-first-question.png`),
      fullPage: true,
    });
    await recoverAndClearCurrentStage(page, canvas, shell, stageCase.questionCount);

    const saved = await page.evaluate(() => localStorage.getItem('dsk_state'));
    expect(saved).toContain(stageCase.id);
    await expect(shell).toHaveAttribute('data-next-stage', stageCase.next);
  });
}

test('全41ステージをクリアすると1年生の海のエンディングへ進める', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  expect(grade1StageIds).toHaveLength(41);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    (state) => localStorage.setItem('dsk_state', JSON.stringify(state)),
    completedGrade1State(grade1StageIds.filter((stageId) => stageId !== 'g1-kaki-boss')),
  );
  await page.goto('./');

  const shell = page.locator('#game-shell');
  const canvas = page.locator('canvas');
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await openIslandMap(page, canvas, shell, { x: 405, y: 815 });
  await tapGamePoint(page, canvas, 220, 671);
  await expect(shell).toHaveAttribute('data-stage', 'g1-kaki-boss');
  await tapGamePoint(page, canvas, 405, 835);
  await expect(shell).toHaveAttribute('data-scene', 'quiz');
  await answerQuiz(page, canvas, shell, 12);
  await expect(shell).toHaveAttribute('data-sea-complete', 'true');
  await page.screenshot({ path: testInfo.outputPath('grade1-final-result.png'), fullPage: true });

  await tapGamePoint(page, canvas, 580, 790);
  await expect(shell).toHaveAttribute('data-scene', 'grade-complete');
  await page.screenshot({ path: testInfo.outputPath('grade1-ending-sumizo.png'), fullPage: true });
  await tapGamePoint(page, canvas, 405, 919);
  await expect.poll(() => page.evaluate(() => window.__DSK_APP__?.storyPage)).toBe(1);
  await page.screenshot({ path: testInfo.outputPath('grade1-ending-captain.png'), fullPage: true });
  await tapGamePoint(page, canvas, 405, 919);
  await expect.poll(() => page.evaluate(() => window.__DSK_APP__?.storyPage)).toBe(2);
  await page.screenshot({ path: testInfo.outputPath('grade1-ending-compass.png'), fullPage: true });
  await tapGamePoint(page, canvas, 405, 919);
  await expect(shell).toHaveAttribute('data-scene', 'island-select');
  expect(await page.evaluate(() => localStorage.getItem('dsk_state'))).toContain('complete:g1');
});

test('横長画面でもCanvas全体が収まり、下部の操作へ進める', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    localStorage.setItem(
      'dsk_state',
      JSON.stringify({ v: 4, stages: {}, collection: {}, seen: { 'challenge:g1': true } }),
    );
  });
  await page.goto('./');

  const shell = page.locator('#game-shell');
  const canvas = page.locator('canvas');
  await expect(shell).toHaveAttribute('data-scene', 'welcome');

  const box = await canvas.boundingBox();
  if (!box) throw new Error('ゲームCanvasの表示領域を取得できません。');
  expect(box.width).toBeLessThanOrEqual(1280);
  expect(box.height).toBeLessThanOrEqual(720);
  expect(box.width / box.height).toBeCloseTo(810 / 1080, 2);

  await page.screenshot({
    path: testInfo.outputPath('pr-3-landscape-welcome.png'),
    fullPage: true,
  });
  await tapGamePoint(page, canvas, 405, 882);
  await expect(shell).toHaveAttribute('data-scene', 'sea-select');
  await tapGamePoint(page, canvas, 405, 315);
  await expect(shell).toHaveAttribute('data-scene', 'island-select');
  await tapGamePoint(page, canvas, 220, 315);
  await expect(shell).toHaveAttribute('data-scene', 'island-map');
});

test('PWAマニフェストとService Workerが有効で、オフライン再起動できる', async ({
  context,
  page,
}) => {
  await page.goto('./');
  await expect(page.locator('#game-shell')).toHaveAttribute('data-ready', 'true');

  const manifestResponse = await page.request.get('./manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as { display?: string; orientation?: string };
  expect(manifest.display).toBe('standalone');
  expect(manifest.orientation).toBe('portrait');

  const serviceWorkerResponse = await page.request.get('./sw.js');
  expect(serviceWorkerResponse.ok()).toBe(true);
  const serviceWorker = await serviceWorkerResponse.text();
  expect(serviceWorker).toContain('self.skipWaiting()');
  expect(serviceWorker).toContain('sw-force-update.js');

  const forceUpdateResponse = await page.request.get('./sw-force-update.js');
  expect(forceUpdateResponse.ok()).toBe(true);
  const forceUpdate = await forceUpdateResponse.text();
  expect(forceUpdate).toContain('self.registration.active');
  expect(forceUpdate).toContain('dsk-sw-update-marker-v1');
  expect(forceUpdate).toContain('self.clients.claim()');
  expect(forceUpdate).toContain('void client.navigate(client.url)');

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect(page.locator('html')).toHaveAttribute('data-offline-ready', 'true', {
    timeout: 30_000,
  });
  await page.goto('./');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  const cachedUrls = await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    const requests = await Promise.all(
      cacheNames.map(async (cacheName) => (await caches.open(cacheName)).keys()),
    );
    return requests.flat().map((request) => request.url);
  });
  expect(
    cachedUrls.some((url) => new URL(url).pathname.endsWith('/dajare-sencho-kokugo/index.html')),
  ).toBe(true);

  await context.setOffline(true);
  // A protocol-level forced reload can intentionally bypass a Service Worker once.
  // Navigating to the same URL models closing and reopening the installed PWA.
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#game-shell')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toBeVisible();
  await context.setOffline(false);
});

test('旧キャッシュを持つ画面も新しいService Workerで自動再読み込みする', async ({ page }) => {
  test.setTimeout(90_000);
  const server = await startUpdateTestServer();
  try {
    await page.addInitScript(() => {
      const count = Number(sessionStorage.getItem('dsk_test_load_count') ?? '0');
      sessionStorage.setItem('dsk_test_load_count', String(count + 1));
    });
    await page.goto(`${server.origin}${APP_BASE}`);
    await expect(page.locator('#game-shell')).toHaveAttribute('data-ready', 'true');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await expect
      .poll(() => page.evaluate(() => Number(sessionStorage.getItem('dsk_test_load_count') ?? '0')))
      .toBe(1);

    server.activateUpdate();
    const reloadPromise = page.waitForEvent('framenavigated', {
      predicate: (frame) => frame === page.mainFrame(),
      timeout: 30_000,
    });
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });
    await reloadPromise;
    await page.waitForLoadState('domcontentloaded');

    await expect
      .poll(
        () => page.evaluate(() => Number(sessionStorage.getItem('dsk_test_load_count') ?? '0')),
        { timeout: 30_000 },
      )
      .toBeGreaterThanOrEqual(2);
    await expect(page.locator('#game-shell')).toHaveAttribute('data-ready', 'true');
  } finally {
    await server.close();
  }
});
