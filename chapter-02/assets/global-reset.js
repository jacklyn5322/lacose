/* Chapter 02 global reset watcher v5.8.0 */
(function () {
  'use strict';
  const DATA_KEY = 'ch2_journey_v2';
  const MARKER_KEY = 'ch2_global_reset_seen_v1';
  let checking = false;
  async function checkGlobalReset() {
    if (checking || !window.Chapter02Cloud) return;
    checking = true;
    try {
      const state = await window.Chapter02Cloud.request('/public/chapter-02/reset-state');
      const resetAt = Number(state && state.resetAt || 0);
      if (!Number.isFinite(resetAt) || resetAt <= 0) return;
      const remote = String(resetAt);
      if (localStorage.getItem(MARKER_KEY) === remote) return;
      localStorage.removeItem(DATA_KEY);
      sessionStorage.removeItem(DATA_KEY);
      localStorage.setItem(MARKER_KEY, remote);
      window.dispatchEvent(new CustomEvent('chapter02:reset', { detail: { resetAt } }));
      window.dispatchEvent(new StorageEvent('storage', {
        key: DATA_KEY, oldValue: null, newValue: null, storageArea: localStorage
      }));
      console.info('[Chapter 02] Global test data reset applied:', remote);
      window.location.reload();
    } catch (error) {
      console.warn('[Chapter 02] Global reset check will retry:', error);
    } finally {
      checking = false;
    }
  }
  checkGlobalReset();
  window.addEventListener('online', checkGlobalReset);
  window.addEventListener('focus', checkGlobalReset);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') checkGlobalReset();
  });
  window.setInterval(checkGlobalReset, 10000);
  window.addEventListener('message', function (event) {
    if (event.origin === window.Chapter02Cloud?.API && event.data?.type === 'CHAPTER_02_RESET') checkGlobalReset();
  });
})();
