import { registerSW } from 'virtual:pwa-register';

import { checkForPwaUpdate } from './pwa-update';

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function registerPwa(): void {
  if (!('serviceWorker' in navigator)) return;

  const markOfflineReady = (): void => {
    document.documentElement.dataset.offlineReady = 'true';
  };
  void navigator.serviceWorker.ready.then(markOfflineReady);

  registerSW({
    immediate: true,
    onOfflineReady: markOfflineReady,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      const check = (): void => {
        void checkForPwaUpdate(swUrl, registration);
      };

      check();
      window.setInterval(check, UPDATE_CHECK_INTERVAL_MS);
      window.addEventListener('online', check);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
    onRegisterError(error) {
      console.error('Service Worker の登録に失敗しました。', error);
    },
  });
}
