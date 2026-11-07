/* Chapter 02 private cloud client v5.8.0 */
(function () {
  'use strict';
  const API = 'https://private-album-api-796382184623.asia-east1.run.app';
  const KEY = 'ch2_journey_v2';
  const TOKEN_KEY = 'ch2_google_id_token_session';
  const DEFINITIONS = [
    { name: '書籤', meaning: '願你讀過千百種故事，依然對世界保持好奇；看過無數種美，依然能發現生活裡獨有的風景。' },
    { name: '狗狗針織小吊飾', meaning: '生活不一定每天都有驚喜，但希望你每天都能遇見一些小小的可愛。就像這隻小狗，沒有什麼宏大的使命，只是單純地為你的日常增添一點快樂。' },
    { name: '阿美嬤紅茶奶鑰匙圈', meaning: '有些味道，會讓人想起一段時光；有些溫暖，會讓人記得很久。希望這個小小的鑰匙圈，能把台南古早味的甜與溫度，帶進妳的日常。' }
  ];
  const FINAL_MEANING = '願你有欣賞世界的眼光，有感受溫暖的能力，也有歷經歲月後依然保有甜美的初心。\n願美好值得收藏，溫暖時常相伴，而生活的每一個平凡瞬間，都能成為值得回味的故事。';

  let clientIdPromise = null;
  let gisPromise = null;
  let authPromise = null;
  let token = null;
  let loginOverlay = null;
  let loginMessage = null;
  let loginButton = null;
  let resolveAuth = null;
  let rejectAuth = null;
  let gisInitialized = false;

  function decodeJwtPayload(jwt) {
    try {
      const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(Array.from(atob(part), c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')));
    } catch (_) { return null; }
  }
  function sessionGet(key) { try { return sessionStorage.getItem(key); } catch (_) { return null; } }
  function sessionSet(key, value) { try { sessionStorage.setItem(key, value); } catch (_) {} }
  function sessionRemove(key) { try { sessionStorage.removeItem(key); } catch (_) {} }
  function readStoredToken() {
    const stored = token || sessionGet(TOKEN_KEY);
    if (!stored) return null;
    const payload = decodeJwtPayload(stored);
    if (!payload || !payload.exp || payload.exp * 1000 < Date.now() + 30000) {
      token = null;
      sessionRemove(TOKEN_KEY);
      return null;
    }
    token = stored;
    return stored;
  }
  async function getClientId() {
    if (!clientIdPromise) {
      clientIdPromise = fetch(API + '/public/chapter-02/auth-config', { cache: 'no-store' })
        .then(async response => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.clientId) throw new Error(data.error || '無法取得 Google 登入設定。');
          return data.clientId;
        });
    }
    return clientIdPromise;
  }
  function ensureLoginUi() {
    if (loginOverlay) return;
    loginOverlay = document.createElement('div');
    loginOverlay.className = 'ch2-auth-overlay';
    loginOverlay.innerHTML = '<section class="ch2-auth-panel" role="dialog" aria-modal="true" aria-labelledby="ch2AuthTitle"><div class="ch2-auth-mark">PRIVATE JOURNEY</div><h2 id="ch2AuthTitle">登入後開始這段旅程</h2><p>第二章內容僅開放給已授權的 Google 帳號。請使用雙方其中一個已授權帳號登入。</p><div class="ch2-auth-google" id="ch2GoogleButton"></div><div class="ch2-auth-message" id="ch2AuthMessage" role="status" aria-live="polite">正在準備安全登入……</div></section>';
    document.body.appendChild(loginOverlay);
    loginMessage = loginOverlay.querySelector('#ch2AuthMessage');
    loginButton = loginOverlay.querySelector('#ch2GoogleButton');
  }
  function loadGis() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (gisPromise) return gisPromise;
    gisPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Google 登入服務載入失敗，請確認網路連線或稍後重試。'));
      document.head.appendChild(script);
    });
    return gisPromise;
  }
  async function beginGoogleLogin() {
    ensureLoginUi();
    loginMessage.textContent = '正在連接 Google 安全登入……';
    try {
      const clientId = await getClientId();
      await loadGis();
      if (!gisInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: false,
          callback: response => {
            if (!response?.credential) {
              if (loginMessage) loginMessage.textContent = '未取得 Google 登入憑證，請再試一次。';
              return;
            }
            token = response.credential;
            sessionSet(TOKEN_KEY, token);
            if (loginOverlay) loginOverlay.remove();
            loginOverlay = null;
            const resolve = resolveAuth;
            resolveAuth = null;
            rejectAuth = null;
            if (resolve) resolve(token); else window.location.reload();
          }
        });
        gisInitialized = true;
      }
      loginButton.innerHTML = '';
      window.google.accounts.id.renderButton(loginButton, {
        type: 'standard', theme: 'outline', size: 'large',
        text: 'signin_with', shape: 'pill', width: 280,
        logo_alignment: 'left', locale: 'zh_TW'
      });
      loginMessage.textContent = '請選擇已授權的 Google 帳號登入。';
      window.google.accounts.id.prompt();
    } catch (error) {
      loginMessage.textContent = error.message || 'Google 登入初始化失敗。';
    }
  }
  function ensureAuth() {
    const existing = readStoredToken();
    if (existing) return Promise.resolve(existing);
    if (authPromise) return authPromise;
    ensureLoginUi();
    authPromise = new Promise((resolve, reject) => {
      resolveAuth = resolve;
      rejectAuth = reject;
    });
    beginGoogleLogin();
    return authPromise.finally(() => { authPromise = null; });
  }
  async function request(path, options) {
    const idToken = await ensureAuth();
    const requestOptions = Object.assign({ cache: 'no-store' }, options || {});
    requestOptions.headers = Object.assign({}, requestOptions.headers || {}, { Authorization: 'Bearer ' + idToken });
    const response = await fetch(API + path, requestOptions);
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {};
    if (response.status === 401 || response.status === 403) {
      token = null;
      sessionRemove(TOKEN_KEY);
      ensureLoginUi();
      if (loginMessage) loginMessage.textContent = data.error || '這個 Google 帳號尚未取得第二章使用權限，請改用另一個已授權帳號。';
      beginGoogleLogin();
      throw new Error(data.error || '登入驗證失敗，請重新選擇已授權帳號。');
    }
    if (!response.ok || data.success === false) throw new Error(data.error || ('服務暫時無法使用（HTTP ' + response.status + '）'));
    return data;
  }
  function canPreviewImage(media) {
    const type = String(media?.mimeType || media?.type || '').toLowerCase();
    return ['image/jpeg','image/png','image/webp','image/gif','image/avif','image/heic','image/heif','image/tiff'].includes(type);
  }
  function mediaUrl(media, download) {
    if (!media) return '';
    if (download && media.downloadUrl) return API + media.downloadUrl;
    if (!download && media.url) return API + media.url;
    return API + '/public/chapter-02/media/' + encodeURIComponent(media.id);
  }
  async function loadState() {
    const data = await request('/public/chapter-02/state');
    const gifts = Array.isArray(data.gifts && data.gifts.gifts) ? data.gifts.gifts : [];
    const normalizedGifts = DEFINITIONS.map((definition, index) => {
      const saved = gifts[index] || {};
      return Object.assign({}, definition, saved, {
        photo: saved.photo ? Object.assign({}, saved.photo, { url: mediaUrl(saved.photo), downloadUrl: mediaUrl(saved.photo, true) }) : null,
        revealed: !!saved.revealed
      });
    });
    const places = (data.journeys || []).map(item => {
      const media = (item.media || []).map(file => Object.assign({}, file, { url: mediaUrl(file), downloadUrl: mediaUrl(file, true) }));
      return Object.assign({}, item, { name: item.place, media, photos: media });
    });
    const state = { places, gifts: normalizedGifts, giftFlowCompleted: !!(data.gifts && data.gifts.completed), illustration: '' };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
    return state;
  }
  async function generateTasks(place, note) {
    return request('/public/chapter-02/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place, note })
    });
  }
  async function saveJourney(place) {
    const body = {
      id: place.id, place: place.name, note: place.note || '', answer: place.answer || '',
      tasks: place.tasks || [], sources: place.sources || [], mediaIds: (place.media || []).map(item => item.id), createdAt: place.createdAt
    };
    return request('/public/chapter-02/journeys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }
  async function uploadFile(file, onProgress) {
    if (!file || !file.size) throw new Error('請先選擇檔案。');
    if (file.size > 500 * 1024 * 1024) throw new Error('單一檔案目前上限為 500 MB。');
    const init = await request('/public/chapter-02/uploads/init', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size })
    });
    const chunkSize = Number(init.chunkSize) || 8 * 1024 * 1024;
    let offset = 0, result = null;
    while (offset < file.size) {
      const endExclusive = Math.min(offset + chunkSize, file.size);
      const chunk = file.slice(offset, endExclusive);
      const idToken = await ensureAuth();
      const response = await fetch(API + '/public/chapter-02/uploads/' + encodeURIComponent(init.uploadId) + '/chunk', {
        method: 'PUT', cache: 'no-store',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Range': 'bytes ' + offset + '-' + (endExclusive - 1) + '/' + file.size,
          Authorization: 'Bearer ' + idToken
        },
        body: chunk
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        token = null; sessionRemove(TOKEN_KEY);
        throw new Error(data.error || '登入已逾期，請重新登入後再上傳。');
      }
      if (!response.ok || !data.success) throw new Error(data.error || ('檔案上傳失敗（HTTP ' + response.status + '）'));
      offset = data.complete ? file.size : Number(data.nextOffset);
      if (!Number.isFinite(offset) || offset <= 0) throw new Error('雲端回傳的上傳進度無效。');
      if (onProgress) onProgress(Math.round(offset / file.size * 100));
      if (data.complete) result = data.media;
    }
    if (!result) throw new Error('檔案尚未完成雲端保存。');
    result.url = mediaUrl(result);
    result.downloadUrl = mediaUrl(result, true);
    return result;
  }
  async function saveGift(index, photo) {
    return request('/public/chapter-02/gifts/' + index, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo })
    });
  }
  async function completeGifts() {
    return request('/public/chapter-02/gifts/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  }
  async function authorizedFetch(path, options) {
    const idToken = await ensureAuth();
    return fetch(API + path, Object.assign({ cache: 'no-store' }, options || {}, {
      headers: Object.assign({}, options?.headers || {}, { Authorization: 'Bearer ' + idToken })
    }));
  }
  window.Chapter02Cloud = { API, DEFINITIONS, FINAL_MEANING, canPreviewImage, request, authorizedFetch, ensureAuth, mediaUrl, loadState, generateTasks, saveJourney, uploadFile, saveGift, completeGifts };
})();
