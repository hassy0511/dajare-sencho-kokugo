import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

import type { SeaDefinition } from '../src/types/content';

const sea = JSON.parse(
  readFileSync(new URL('../data/g1/sea.json', import.meta.url), 'utf8'),
) as SeaDefinition;
const grade1StageIds = sea.islands.flatMap((island) => island.stages.map((stage) => stage.id));

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

async function answerQuiz(
  page: Page,
  canvas: Locator,
  shell: Locator,
  questionCount: number,
): Promise<void> {
  for (let index = 0; index < questionCount; index += 1) {
    const answer = await page.evaluate(() => window.__DSK_APP__?.answerIndex);
    if (answer === undefined) throw new Error(`${index + 1}問目の正解位置を取得できません。`);
    const center = choiceCenters[answer];
    if (!center) throw new Error(`正解位置 ${answer} が選択肢の範囲外です。`);
    await tapGamePoint(page, canvas, center.x, center.y);
    if (index < questionCount - 1) {
      await expect(shell).toHaveAttribute('data-question', String(index + 1));
    }
  }
  await expect(shell).toHaveAttribute('data-scene', 'result');
  await expect(shell).toHaveAttribute('data-stars', '3');
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

test('物語から入り、最初のステージをクリアして次へ進める', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');

  const shell = page.locator('#game-shell');
  const canvas = page.locator('canvas');
  await expect(shell).toHaveAttribute('data-ready', 'true');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '810');
  await expect(canvas).toHaveAttribute('height', '1080');

  await page.screenshot({ path: testInfo.outputPath('welcome.png'), fullPage: true });

  await tapGamePoint(page, canvas, 405, 882);
  await expect(shell).toHaveAttribute('data-scene', 'sea-select');
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
  await page.screenshot({ path: testInfo.outputPath('challenge-story-buddy.png'), fullPage: true });
  await tapGamePoint(page, canvas, 405, 910);
  await expect(shell).toHaveAttribute('data-scene', 'island-select');
  await page.screenshot({ path: testInfo.outputPath('island-select.png'), fullPage: true });

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
  await page.screenshot({ path: testInfo.outputPath('quiz-first-question.png'), fullPage: true });

  await answerQuiz(page, canvas, shell, 10);
  await page.screenshot({ path: testInfo.outputPath('result-three-stars.png'), fullPage: true });

  await expect(shell).toHaveAttribute('data-next-stage', 'g1-moji-dakuon');
  await tapGamePoint(page, canvas, 580, 790);
  await expect(shell).toHaveAttribute('data-scene', 'stage-intro');
  await expect(shell).toHaveAttribute('data-stage', 'g1-moji-dakuon');
  await page.screenshot({ path: testInfo.outputPath('dakuon-stage-intro.png'), fullPage: true });
  const saved = await page.evaluate(() => localStorage.getItem('dsk_state'));
  expect(saved).toContain('g1-moji-seion');
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
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((clearedStageIds) => {
      const stages = Object.fromEntries(
        clearedStageIds.map((stageId) => [stageId, { bestScore: 8, bestStars: 3, cleared: true }]),
      );
      localStorage.setItem(
        'dsk_state',
        JSON.stringify({ v: 1, stages, seen: { 'challenge:g1': true } }),
      );
    }, stageCase.cleared);
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
    await answerQuiz(page, canvas, shell, stageCase.questionCount);

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
    (stageIds) => {
      const stages = Object.fromEntries(
        stageIds.map((stageId) => [stageId, { bestScore: 8, bestStars: 3, cleared: true }]),
      );
      localStorage.setItem(
        'dsk_state',
        JSON.stringify({ v: 1, stages, seen: { 'challenge:g1': true } }),
      );
    },
    grade1StageIds.filter((stageId) => stageId !== 'g1-kaki-boss'),
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
      JSON.stringify({ v: 1, stages: {}, seen: { 'challenge:g1': true } }),
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
