import { describe, expect, it, vi } from 'vitest';

import { checkForPwaUpdate } from '../src/pwa-update';

function registration(installing: ServiceWorker | null = null): {
  value: Pick<ServiceWorkerRegistration, 'installing' | 'update'>;
  update: ReturnType<typeof vi.fn>;
} {
  const update = vi.fn(async () => ({}) as ServiceWorkerRegistration);
  return {
    value: { installing, update },
    update,
  };
}

describe('PWA更新確認', () => {
  it('オンライン時はService Workerをキャッシュなしで確認して更新する', async () => {
    const current = registration();
    const fetcher = vi.fn(async () => new Response('', { status: 200 }));

    await expect(
      checkForPwaUpdate('/sw.js', current.value, {
        fetcher: fetcher as typeof fetch,
        online: true,
      }),
    ).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledWith('/sw.js', {
      cache: 'no-store',
      headers: {
        cache: 'no-store',
        'cache-control': 'no-cache',
      },
    });
    expect(current.update).toHaveBeenCalledOnce();
  });

  it('オフライン中またはインストール中は更新確認を行わない', async () => {
    const offline = registration();
    const installing = registration({} as ServiceWorker);
    const fetcher = vi.fn(async () => new Response('', { status: 200 }));

    await expect(
      checkForPwaUpdate('/sw.js', offline.value, {
        fetcher: fetcher as typeof fetch,
        online: false,
      }),
    ).resolves.toBe(false);
    await expect(
      checkForPwaUpdate('/sw.js', installing.value, {
        fetcher: fetcher as typeof fetch,
        online: true,
      }),
    ).resolves.toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('取得失敗時は現在の版を維持する', async () => {
    const current = registration();
    const fetcher = vi.fn(async () => new Response('', { status: 503 }));

    await expect(
      checkForPwaUpdate('/sw.js', current.value, {
        fetcher: fetcher as typeof fetch,
        online: true,
      }),
    ).resolves.toBe(false);
    expect(current.update).not.toHaveBeenCalled();
  });
});
