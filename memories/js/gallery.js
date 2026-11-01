(() => {
  const albums={coffee:{title:'早上的第一杯咖啡',folder:'01_咖啡',key:'coffee',description:'從一杯咖啡，收藏故事的開始。'},brunch:{title:'莉莉安的美麗可頌',folder:'02_早午餐',key:'brunch',description:'把可頌香氣與一起分享的時光留下。'},pier2:{title:'在駁二預見的 AI',folder:'04_駁二',key:'pier2',description:'港邊的藝術、探索，還有意想不到的相遇。'}};
  const params=new URLSearchParams(location.search),album=albums[params.get('album')]||albums.coffee;
  const $=id=>document.getElementById(id),cfg=window.ALBUM_CONFIG||{},base=(cfg.ALBUM_API_BASE||'').replace(/\/+$/,'');
  const grid=$('photo-grid'),empty=$('empty-state'),count=$('photo-count'),more=$('load-more'),status=$('api-status');
  $('album-title').textContent=album.title;$('folder-label').textContent=`CHAPTER 01 · ${album.folder}`;$('album-description').textContent=album.description;
  if(cfg.DEMO_MODE||!base||base.includes('請填入')){count.textContent='版面預覽';empty.hidden=false;empty.querySelector('h2').textContent='相簿入口已準備好';empty.querySelector('p').textContent='目前為預覽模式，尚未連接雲端相簿。';return;}
  const key=`private-album-library:${album.key}`,manifestKey=`album-items:${album.key}`;let items=[],shown=0;const PAGE=24;
  const cachedScroll=Number(sessionStorage.getItem(`album-scroll:${album.key}`)||0);
  const timeoutFetch=async(url,ms=18000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{return await fetch(url,{cache:'no-store',signal:c.signal,credentials:'omit'});}catch(e){if(e.name==='AbortError')throw Error('雲端連線逾時，請稍後重新整理。');throw Error('無法連線雲端相簿，請檢查網路或 Cloud Run 服務。');}finally{clearTimeout(t);}};
  function rememberScroll(){sessionStorage.setItem(`album-scroll:${album.key}`,String(window.scrollY));}
  window.addEventListener('pagehide',rememberScroll);
  function showError(e){count.textContent='無法載入相簿';status.textContent=e.message;empty.hidden=false;empty.querySelector('h2').textContent='暫時無法打開這本相簿';empty.querySelector('p').textContent=e.message;}
  async function loadLibrary(){
    // Always validate the live switch before rendering a cached manifest.
    const sr=await timeoutFetch(`${base}/public/status`);if(!sr.ok)throw Error(`相簿狀態讀取失敗（HTTP ${sr.status}）`);
    const state=await sr.json();if(state.isOpen!==true)throw Error('相簿目前已關閉。');
    const cached=sessionStorage.getItem(key);if(cached){try{const v=JSON.parse(cached);if(v.library&&Date.now()-v.savedAt<3*60*1000)return v.library;}catch{sessionStorage.removeItem(key);}}
    const lr=await timeoutFetch(`${base}/public/library`);if(!lr.ok)throw Error(lr.status===403?'相簿目前已關閉。':`相簿清單讀取失敗（HTTP ${lr.status}）`);
    const library=await lr.json();if(library.success===false||!Array.isArray(library.folders)||!Array.isArray(library.mediaFiles))throw Error('雲端回傳的相簿資料格式不完整。');
    sessionStorage.setItem(key,JSON.stringify({savedAt:Date.now(),library}));return library;
  }
  function renderNext(){const batch=items.slice(shown,shown+PAGE);batch.forEach((m,i)=>{const a=document.createElement('a');a.className='photo-tile'+(m.mediaType==='video'?' video-tile':'');a.href=`viewer.html?id=${encodeURIComponent(m.id)}&type=${encodeURIComponent(m.mediaType)}&name=${encodeURIComponent(m.name||'')}&album=${encodeURIComponent(album.key)}`;a.addEventListener('click',rememberScroll);
    const img=document.createElement('img');img.loading=shown+i<9?'eager':'lazy';img.decoding='async';img.alt=m.name||'回憶照片';img.src=`${base}${m.thumbnailUrl||`/thumbnail/${encodeURIComponent(m.id)}`}`;img.onerror=()=>{if(img.dataset.fallback)return;img.dataset.fallback='1';img.src=`${base}${m.url||`/media/${encodeURIComponent(m.id)}`}`;};a.append(img);grid.append(a);});shown+=batch.length;more.hidden=shown>=items.length;}
  more.addEventListener('click',renderNext);
  (async()=>{try{const data=await loadLibrary();let folder=data.folders.find(f=>f.pageKey===album.key)||data.folders.find(f=>f.name===album.folder);if(!folder){const candidates=data.mediaFiles.filter(m=>m.folderName===album.folder);if(candidates.length)folder={id:candidates[0].folderId};}
    if(!folder)throw Error(`雲端找不到「${album.folder}」相簿。請確認此資料夾已啟用公開顯示，並設定對應 pageKey。`);
    items=data.mediaFiles.filter(m=>m.folderId===folder.id);count.textContent=`共 ${items.length} 個回憶`;if(!items.length){empty.hidden=false;empty.querySelector('h2').textContent='這本相簿目前沒有照片';empty.querySelector('p').textContent='雲端資料夾已連接，但目前沒有可顯示的媒體。';status.textContent='相簿已連線。';return;}
    sessionStorage.setItem(manifestKey,JSON.stringify(items));renderNext();status.textContent='已連接雲端回憶。';requestAnimationFrame(()=>window.scrollTo(0,cachedScroll));
  }catch(e){showError(e);}})();
})();