import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

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

test('物語と選択画面を通り、画像を読む10問をクリアしてマップへ戻れる', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
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
  await expect(page.locator('#game-status')).toHaveText(/じゅんびちゅう/);
  await tapGamePoint(page, canvas, 220, 245);
  await expect(shell).toHaveAttribute('data-scene', 'stage-intro');
  await page.screenshot({ path: testInfo.outputPath('stage-intro.png'), fullPage: true });

  await tapGamePoint(page, canvas, 405, 835);
  await expect(shell).toHaveAttribute('data-scene', 'quiz');
  await expect(shell).toHaveAttribute('data-input-ready', 'true');
  await page.screenshot({ path: testInfo.outputPath('quiz-first-question.png'), fullPage: true });

  const centers = [
    { x: 220, y: 680 },
    { x: 590, y: 680 },
    { x: 220, y: 855 },
    { x: 590, y: 855 },
  ];
  for (let index = 0; index < 10; index += 1) {
    const answer = await page.evaluate(() => window.__DSK_APP__?.answerIndex);
    if (answer === undefined) throw new Error(`${index + 1}問目の正解位置を取得できません。`);
    const center = centers[answer];
    if (!center) throw new Error(`正解位置 ${answer} が選択肢の範囲外です。`);
    await tapGamePoint(page, canvas, center.x, center.y);
    if (index < 9) await expect(shell).toHaveAttribute('data-question', String(index + 1));
  }

  await expect(shell).toHaveAttribute('data-scene', 'result');
  await expect(shell).toHaveAttribute('data-stars', '3');
  const saved = await page.evaluate(() => localStorage.getItem('dsk_state'));
  expect(saved).toContain('g1-moji-seion');
  await page.screenshot({ path: testInfo.outputPath('result-three-stars.png'), fullPage: true });

  await tapGamePoint(page, canvas, 580, 790);
  await expect(shell).toHaveAttribute('data-scene', 'island-map');
  await expect(shell).toHaveAttribute('data-island', 'g1-moji');
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
