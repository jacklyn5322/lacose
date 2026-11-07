/* Chapter 02 public cloud client v5.11.0 */
(function () {
  'use strict';
  const API = 'https://private-album-api-796382184623.asia-east1.run.app';
  const KEY = 'ch2_journey_v2';
  const DEFINITIONS = [
    { name: '書籤', meaning: '願你讀過千百種故事，依然對世界保持好奇；看過無數種美，依然能發現生活裡獨有的風景。' },
    { name: '狗狗針織小吊飾', meaning: '生活不一定每天都有驚喜，但希望你每天都能遇見一些小小的可愛。就像這隻小狗，沒有什麼宏大的使命，只是單純地為你的日常增添一點快樂。' },
    { name: '阿美嬤紅茶奶鑰匙圈', meaning: '有些味道，會讓人想起一段時光；有些溫暖，會讓人記得很久。希望這個小小的鑰匙圈，能把台南古早味的甜與溫度，帶進妳的日常。' }
  ];
  const FINAL_MEANING = '願你有欣賞世界的眼光，有感受溫暖的能力，也有歷經歲月後依然保有甜美的初心。\n願美好值得收藏，溫暖時常相伴，而生活的每一個平凡瞬間，都能成為值得回味的故事。';

  async function request(path, options) {
    const requestOptions = Object.assign({ cache: 'no-store' }, options || {});
    const response = await fetch(API + path, requestOptions);
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {};
    if (!response.ok || data.success === false) throw new Error(data.error || ('服務暫時無法使用（HTTP ' + response.status + '）'));
    return data;
  }

  function canPreviewImage(media) {
    const type = String(media?.mimeType || media?.type || '').toLowerCase().split(';')[0].trim();
    const name = String(media?.name || media?.filename || '').toLowerCase();
    // HEIC/HEIF, TIFF and camera RAW formats are intentionally treated as original-file downloads;
    // browsers do not consistently decode them, especially on iOS.
    if (['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/avif','image/bmp'].includes(type)) return true;
    return /\.(jpe?g|png|webp|gif|avif|bmp)$/.test(name);
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
  async function uploadFile(file, onProgress, context) {
    if (!file || !file.size) throw new Error('請先選擇檔案。');
    if (file.size > 500 * 1024 * 1024) throw new Error('單一檔案目前上限為 500 MB。');
    const init = await request('/public/chapter-02/uploads/init', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size }, context || {}))
    });
    const chunkSize = Number(init.chunkSize) || 8 * 1024 * 1024;
    let offset = 0, result = null;
    while (offset < file.size) {
      const endExclusive = Math.min(offset + chunkSize, file.size);
      const chunk = file.slice(offset, endExclusive);
      const response = await fetch(API + '/public/chapter-02/uploads/' + encodeURIComponent(init.uploadId) + '/chunk', {
        method: 'PUT', cache: 'no-store',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Range': 'bytes ' + offset + '-' + (endExclusive - 1) + '/' + file.size,
        },
        body: chunk
      });
      const data = await response.json().catch(() => ({}));
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
    return fetch(API + path, Object.assign({ cache: 'no-store' }, options || {}));
  }
  window.Chapter02Cloud = { API, DEFINITIONS, FINAL_MEANING, canPreviewImage, request, authorizedFetch, mediaUrl, loadState, generateTasks, saveJourney, uploadFile, saveGift, completeGifts };
})();
