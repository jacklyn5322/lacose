/* Chapter 02 global reset watcher v5.6.4 */
(function () {
  'use strict';
  const API = 'https://private-album-api-796382184623.asia-east1.run.app';
  const RESET_API = API + '/public/chapter-02/reset-state';
  const DATA_KEY = 'ch2_journey_v2';
  const MARKER_KEY = 'ch2_global_reset_seen_v1';
  let checking = false;

  async function checkGlobalReset() {
    if (checking) return;
    checking = true;
    try {
      const response = await fetch(RESET_API, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const state = await response.json();
      const resetAt = Number(state && state.resetAt || 0);
      if (!Number.isFinite(resetAt) || resetAt <= 0) return;
      const remote = String(resetAt);
      if (localStorage.getItem(MARKER_KEY) === remote) return;

      // Remove only Chapter 02's dedicated local data. Preserve the final map
      // (stored remotely) and all other chapters/site data.
      localStorage.removeItem(DATA_KEY);
      sessionStorage.removeItem(DATA_KEY);
      localStorage.setItem(MARKER_KEY, remote);
      window.dispatchEvent(new CustomEvent('chapter02:reset', { detail: { resetAt } }));
      window.dispatchEvent(new StorageEvent('storage', {
        key: DATA_KEY, oldValue: null, newValue: null, storageArea: localStorage
      }));
      console.info('[Chapter 02] Global test data reset applied:', remote);
    } catch (error) {
      console.warn('[Chapter 02] Global reset check will retry:', error);
    } finally {
      checking = false;
    }
  }

  // Check on initial load, when returning to the tab, after reconnecting,
  // and periodically while the page remains open.
  checkGlobalReset();
  window.addEventListener('online', checkGlobalReset);
  window.addEventListener('focus', checkGlobalReset);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') checkGlobalReset();
  });
  window.setInterval(checkGlobalReset, 10000);

  // Keep compatibility with the admin popup notification; polling remains
  // the cross-device mechanism and does not depend on window.opener.
  window.addEventListener('message', function (event) {
    if (event.origin === API && event.data && event.data.type === 'CHAPTER_02_RESET') {
      checkGlobalReset();
    }
  });
})();
