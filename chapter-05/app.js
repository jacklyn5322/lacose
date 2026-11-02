(() => {
  'use strict';
  const cfg = window.CHAPTER_05_CONFIG || {};
  const API = String(cfg.API_BASE || '').replace(/\/+$/, '');
  const $ = id => document.getElementById(id);
  const grid = $('memory-grid'), filter = $('month-filter'), empty = $('empty-state'), status = $('status-line');
  let memories = [], activeMonth = 'all', activeYear = new Date().getFullYear();
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateLabel = value => { if (!value) return ''; const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value : `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`; };
  const monthOf = value => String(value || '').slice(5,7);
  const yearOf = value => Number(String(value || '').slice(0,4)) || activeYear;
  const absoluteURL = value => { const raw = String(value || ''); if (!raw) return ''; if (/^https?:\/\//i.test(raw)) return raw; return `${API}${raw.startsWith('/') ? '' : '/'}${raw}`; };
  const mediaURL = item => absoluteURL(item.url || item.thumbnailUrl || (item.id ? `/media/${encodeURIComponent(item.id)}` : ''));
  const imageURL = item => absoluteURL(item.thumbnailUrl || item.url || (item.id ? `/thumbnail/${encodeURIComponent(item.id)}` : ''));
  const isVideo = item => item.mediaType === 'video' || String(item.mimeType || '').startsWith('video/');
  function normalizeMemory(memory) {
    const media = Array.isArray(memory.media) ? memory.media : (Array.isArray(memory.photos) ? memory.photos : []);
    const items = media.map(item => ({...item, mediaType: item.mediaType || (String(item.mimeType || '').startsWith('video/') ? 'video' : 'photo')}));
    const coverId = memory.coverMediaId || memory.cover || '';
    return {...memory, photos: items, cover: coverId, photoCount: items.filter(x => !isVideo(x)).length, videoCount: items.filter(isVideo).length};
  }
  function sortMemories(items) {
    return items.slice().sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }
  function renderYearFilter() {
    const years = [...new Set(memories.map(m => yearOf(m.date)))].sort((a,b) => b-a);
    if (!years.length) years.push(new Date().getFullYear());
    if (!years.includes(activeYear)) activeYear = years[0];
    const yearSelect = $('year-chip');
    if (yearSelect) yearSelect.innerHTML = years.map(y => `<option value="${y}" ${y===activeYear?'selected':''}>${y} 年 ♡</option>`).join('');
  }
  function renderFilters() {
    const available = [...new Set(memories.filter(m => yearOf(m.date) === activeYear).map(m => monthOf(m.date)).filter(Boolean))].sort();
    filter.innerHTML = `<button class="filter-chip ${activeMonth==='all'?'active':''}" data-month="all">全部</button>` + available.map(m => `<button class="filter-chip ${activeMonth===m?'active':''}" data-month="${m}">${Number(m)}月</button>`).join('');
  }
  function render() {
    const visible = sortMemories(memories.filter(m => yearOf(m.date) === activeYear && (activeMonth === 'all' || monthOf(m.date) === activeMonth)));
    grid.innerHTML = ''; empty.hidden = visible.length !== 0;
    if (!visible.length && activeMonth !== 'all') { const heading = empty.querySelector('h3'); const copy = empty.querySelector('p'); if (heading) heading.textContent = `${Number(activeMonth)} 月，還沒有回憶`; if (copy) copy.innerHTML = '這個月份還沒有收藏的片刻，<br>等你把照片放進來吧 ♡'; }
    else { const heading = empty.querySelector('h3'); const copy = empty.querySelector('p'); if (heading) heading.textContent = '還沒有回憶'; if (copy) copy.innerHTML = '一起從「新增一段我們的片刻」開始，<br>把日常收藏進相簿裡吧 ♡'; }
    if (!visible.length) return;
    visible.forEach((m, index) => {
      const cover = m.photos.find(p => p.id === m.cover && !isVideo(p)) || m.photos.find(p => !isVideo(p)) || {};
      const src = imageURL(cover); const card = document.createElement('button'); card.type = 'button'; card.className = 'memory-card';
      const countText = `${m.photoCount} 張照片${m.videoCount ? `・${m.videoCount} 部影片` : ''}`;
      card.innerHTML = `<span class="card-image">${src ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(m.title || '日常回憶')}" loading="${index<4?'eager':'lazy'}">` : '<span class="image-placeholder">♡</span>'}<span class="image-count">${countText}</span></span><span class="card-meta"><span class="card-date">${escapeHTML(dateLabel(m.date))}</span><span class="card-title">${escapeHTML(m.title || '未命名的日常')}</span><span class="card-location">⌖ ${escapeHTML(m.location || '一起度過的地方')}</span></span>`;
      const image = card.querySelector('img'); if (image) image.addEventListener('error', () => { image.remove(); const placeholder = document.createElement('span'); placeholder.className = 'image-placeholder image-error'; placeholder.textContent = '照片暫時無法載入'; card.querySelector('.card-image').prepend(placeholder); });
      card.addEventListener('click', () => openMemory(m)); grid.append(card);
    });
  }
  function openMemory(m) {
    $('dialog-date').textContent = dateLabel(m.date); $('dialog-title').textContent = m.title || '日常的風景'; $('dialog-location').textContent = m.location || ''; $('dialog-description').textContent = m.description || '';
    const mediaBox = $('dialog-photos'); mediaBox.innerHTML = '';
    m.photos.forEach(item => {
      const src = mediaURL(item); if (!src) return;
      if (isVideo(item)) {
        const video = document.createElement('video'); video.src = src; video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.className = 'dialog-video'; mediaBox.append(video);
      } else {
        const img = document.createElement('img'); img.src = imageURL(item); img.alt = m.title || '回憶照片'; img.loading = 'lazy'; img.addEventListener('error', () => { img.alt = '照片暫時無法載入'; img.classList.add('photo-load-error'); }); mediaBox.append(img);
      }
    });
    const cover = m.photos.find(p => p.id === m.cover && !isVideo(p)) || m.photos.find(p => !isVideo(p));
    $('dialog-cover').innerHTML = cover && imageURL(cover) ? `<img src="${escapeHTML(imageURL(cover))}" alt="">` : '<span>♡</span>';
    $('memory-dialog').showModal();
  }
  async function load() {
    if (cfg.DEMO_MODE) { memories = []; renderYearFilter(); renderFilters(); render(); status.textContent = '預覽模式：尚未連接第五章資料 API。'; return; }
    if (!API) { status.textContent = '尚未設定 Cloud Run API。'; grid.innerHTML = ''; return; }
    try {
      const r = await fetch(`${API}/public/chapter-05/memories`, {cache:'no-store', credentials:'omit'});
      if (!r.ok) throw new Error(`讀取回憶失敗（HTTP ${r.status}）。`);
      const data = await r.json(); if (!Array.isArray(data.memories)) throw new Error('第五章 API 回傳格式不正確。');
      memories = sortMemories(data.memories.map(normalizeMemory));
      if (memories.length) activeYear = Math.max(...memories.map(m => yearOf(m.date)));
      renderYearFilter(); renderFilters(); render(); status.textContent = '';
    } catch (e) { grid.innerHTML = ''; status.textContent = `${e.message} 第五章資料服務尚未完成或尚未部署；第一章不受影響。`; empty.hidden = false; }
  }
  filter.addEventListener('click', e => { const b = e.target.closest('[data-month]'); if (!b) return; activeMonth = b.dataset.month; renderFilters(); render(); });
  $('year-chip')?.addEventListener('change', e => { activeYear = Number(e.target.value); activeMonth = 'all'; renderYearFilter(); renderFilters(); render(); });
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('active', x === b)); grid.classList.toggle('list-view', b.dataset.view === 'list'); }));
  $('dialog-close').addEventListener('click', () => $('memory-dialog').close()); $('memory-dialog').addEventListener('click', e => { if (e.target === $('memory-dialog')) $('memory-dialog').close(); });
  const adminURL = API ? `${API}/admin/chapter-05` : '#';
  ['add-memory','mobile-add'].forEach(id => { const el = $(id); if (el) el.href = adminURL; });
  load();
})();
