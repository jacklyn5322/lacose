(() => {
  'use strict';
  const cfg = window.CHAPTER_05_CONFIG || {};
  const API = String(cfg.API_BASE || '').replace(/\/+$/, '');
  const $ = id => document.getElementById(id);
  const grid = $('memory-grid'), filter = $('month-filter'), empty = $('empty-state'), status = $('status-line');
  let memories = [], activeMonth = 'all';

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateLabel = value => {
    if (!value) return '';
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? value : `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };
  const monthOf = value => String(value || '').slice(5,7);
  const photoURL = photo => {
    if (photo.url) return photo.url;
    if (photo.thumbnailUrl) return photo.thumbnailUrl.startsWith('http') ? photo.thumbnailUrl : `${API}${photo.thumbnailUrl}`;
    if (photo.id) return `${API}/thumbnail/${encodeURIComponent(photo.id)}`;
    return '';
  };
  function renderFilters() {
    const months = [...new Set(memories.map(m => monthOf(m.date)).filter(Boolean))].sort();
    filter.innerHTML = `<button class="filter-chip ${activeMonth==='all'?'active':''}" data-month="all">全部</button>` +
      months.map(m => `<button class="filter-chip ${activeMonth===m?'active':''}" data-month="${m}">${Number(m)} 月</button>`).join('');
  }
  function render() {
    const visible = memories.filter(m => activeMonth === 'all' || monthOf(m.date) === activeMonth);
    grid.innerHTML = '';
    empty.hidden = visible.length !== 0;
    if (!visible.length) return;
    visible.forEach((m, index) => {
      const cover = (m.photos || []).find(p => p.id === m.cover) || (m.photos || [])[0] || {};
      const src = photoURL(cover);
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'memory-card';
      card.innerHTML = `<span class="card-image">${src ? `<img src="${escapeHTML(src)}" alt="${escapeHTML(m.title || '日常回憶')}" loading="${index<4?'eager':'lazy'}">` : '<span class="image-placeholder">♡</span>'}<span class="image-count">${(m.photos||[]).length} 張照片</span></span><span class="card-meta"><span class="card-date">${escapeHTML(dateLabel(m.date))}</span><span class="card-title">${escapeHTML(m.title || '未命名的日常')}</span><span class="card-location">⌖ ${escapeHTML(m.location || '一起度過的地方')}</span></span>`;
      card.addEventListener('click', () => openMemory(m));
      grid.append(card);
    });
  }
  function openMemory(m) {
    $('dialog-date').textContent = dateLabel(m.date);
    $('dialog-title').textContent = m.title || '日常的風景';
    $('dialog-location').textContent = m.location || '';
    $('dialog-description').textContent = m.description || '';
    const photos = $('dialog-photos'); photos.innerHTML = '';
    (m.photos || []).forEach(p => { const src = photoURL(p); if (!src) return; const img = document.createElement('img'); img.src = src; img.alt = m.title || '回憶照片'; img.loading = 'lazy'; photos.append(img); });
    const cover = (m.photos || []).find(p => p.id === m.cover) || (m.photos || [])[0];
    $('dialog-cover').innerHTML = cover && photoURL(cover) ? `<img src="${escapeHTML(photoURL(cover))}" alt="">` : '<span>♡</span>';
    $('memory-dialog').showModal();
  }
  async function load() {
    if (cfg.DEMO_MODE) { memories = []; renderFilters(); render(); status.textContent = '預覽模式：尚未連接第五章資料 API。'; return; }
    if (!API) { status.textContent = '尚未設定 Cloud Run API。'; grid.innerHTML = ''; return; }
    try {
      const r = await fetch(`${API}/public/chapter-05/memories`, {cache:'no-store', credentials:'omit'});
      if (!r.ok) throw new Error(`讀取回憶失敗（HTTP ${r.status}）。`);
      const data = await r.json();
      if (!Array.isArray(data.memories)) throw new Error('第五章 API 回傳格式不正確。');
      memories = data.memories.slice().sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')));
      renderFilters(); render();
    } catch (e) {
      grid.innerHTML = '';
      status.textContent = `${e.message} 後端第五章 API 尚未完成或尚未部署；第一章不受影響。`;
      empty.hidden = false;
    }
  }
  filter.addEventListener('click', e => { const b = e.target.closest('[data-month]'); if (!b) return; activeMonth = b.dataset.month; renderFilters(); render(); });
  $('dialog-close').addEventListener('click', () => $('memory-dialog').close());
  $('memory-dialog').addEventListener('click', e => { if (e.target === $('memory-dialog')) $('memory-dialog').close(); });
  $('admin-entry').addEventListener('click', () => { if (!API) return; location.href = `${API}/admin/chapter-05`; });
  load();
})();
