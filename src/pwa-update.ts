type UpdateRegistration = Pick<ServiceWorkerRegistration, 'installing' | 'update'>;

interface UpdateCheckOptions {
  fetcher?: typeof fetch;
  online?: boolean;
}

export async function checkForPwaUpdate(
  swUrl: string,
  registration: UpdateRegistration,
  options: UpdateCheckOptions = {},
): Promise<boolean> {
  const online = options.online ?? (typeof navigator === 'undefined' ? true : navigator.onLine);
  if (registration.installing || !online) return false;

  try {
    const response = await (options.fetcher ?? fetch)(swUrl, {
      cache: 'no-store',
      headers: {
        cache: 'no-store',
        'cache-control': 'no-cache',
      },
    });
    if (response.status !== 200) return false;
    await registration.update();
    return true;
  } catch {
    return false;
  }
}
