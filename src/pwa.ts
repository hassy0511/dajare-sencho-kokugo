import { registerSW } from 'virtual:pwa-register';

export function registerPwa(): void {
  if (!('serviceWorker' in navigator)) return;

  const updateButton = document.querySelector<HTMLButtonElement>('#pwa-update');
  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (updateButton) updateButton.hidden = false;
    },
    onOfflineReady() {
      document.documentElement.dataset.offlineReady = 'true';
    },
    onRegisterError(error) {
      console.error('Service Worker の登録に失敗しました。', error);
    },
  });

  updateButton?.addEventListener('click', () => {
    updateButton.hidden = true;
    void updateServiceWorker(true);
  });
}
