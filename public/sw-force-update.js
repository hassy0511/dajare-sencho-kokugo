/* global caches, Response, self */

const UPDATE_MARKER_CACHE = 'dsk-sw-update-marker-v1';
const UPDATE_MARKER_URL = `${self.registration.scope}__dsk_sw_update__`;

self.addEventListener('install', (event) => {
  if (!self.registration.active) return;
  event.waitUntil(
    caches
      .open(UPDATE_MARKER_CACHE)
      .then((cache) => cache.put(UPDATE_MARKER_URL, new Response('update'))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const markerCache = await caches.open(UPDATE_MARKER_CACHE);
      const isUpdate = Boolean(await markerCache.match(UPDATE_MARKER_URL));
      await caches.delete(UPDATE_MARKER_CACHE);
      await self.clients.claim();
      if (!isUpdate) return;
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      windows.forEach((client) => {
        void client.navigate(client.url);
      });
    })(),
  );
});
