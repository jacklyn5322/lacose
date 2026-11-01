(() => {
 const p=new URLSearchParams(location.search),cfg=window.ALBUM_CONFIG||{},base=(cfg.ALBUM_API_BASE||'').replace(/\/+$/,'');
 const album=p.get('album')||'coffee',stage=document.getElementById('viewer-stage'),caption=document.getElementById('viewer-caption'),indexLabel=document.getElementById('viewer-index'),close=document.getElementById('viewer-back');
 let items=[],current=0,media=null,startX=0,startY=0,gesture=false;
 const urlFor=m=>`${base}/media/${encodeURIComponent(m.id)}`,safeName=s=>String(s||'OUR MEMORY'),closeUrl=()=>`gallery.html?album=${encodeURIComponent(album)}`;
 close.href=closeUrl();
 function stopCurrent(){if(media?.tagName==='VIDEO'){media.pause();media.removeAttribute('src');media.load();}media=null;}
 function address(m){const u=new URL(location.href);u.searchParams.set('id',m.id);u.searchParams.set('type',m.mediaType);u.searchParams.set('name',m.name||'');history.replaceState(null,'',u);}
 function render(){if(!items.length)return;current=Math.max(0,Math.min(current,items.length-1));const m=items[current];stopCurrent();caption.textContent=safeName(m.name);indexLabel.textContent=`${current+1} / ${items.length}`;address(m);stage.replaceChildren();
   const loading=document.createElement('div');loading.className='viewer-loading';loading.textContent=m.mediaType==='video'?'正在載入影片…':'正在載入照片…';stage.append(loading);
   if(m.mediaType==='video'){const v=document.createElement('video');media=v;v.controls=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.muted=true;v.autoplay=true;v.addEventListener('loadeddata',()=>loading.remove(),{once:true});v.addEventListener('error',()=>loading.textContent='影片載入失敗，請確認網路或影片格式。',{once:true});v.src=urlFor(m);stage.append(v);const play=v.play();if(play?.catch)play.catch(()=>{v.controls=true;loading.textContent='請點擊播放鍵開始影片。';});
   }else{const img=document.createElement('img');media=img;img.alt=safeName(m.name);img.decoding='async';img.addEventListener('load',()=>loading.remove(),{once:true});img.addEventListener('error',()=>loading.textContent='照片載入失敗，請返回相簿後重試。',{once:true});img.src=urlFor(m);stage.append(img);}
 }
 function move(delta){const next=current+delta;if(next<0||next>=items.length)return;current=next;render();}
 stage.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;startX=e.touches[0].clientX;startY=e.touches[0].clientY;gesture=true;},{passive:true});
 stage.addEventListener('touchend',e=>{if(!gesture||e.changedTouches.length!==1)return;gesture=false;const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.25)move(dx<0?1:-1);},{passive:true});
 close.addEventListener('click',e=>{e.preventDefault();stopCurrent();location.href=closeUrl();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){location.href=closeUrl();}else if(e.key==='ArrowLeft')move(-1);else if(e.key==='ArrowRight')move(1);});
 async function fetchWithTimeout(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);try{return await fetch(url,{cache:'no-store',signal:c.signal});}finally{clearTimeout(t);}}
 (async()=>{try{if(!base)throw Error('相簿設定不存在。');const cacheKey=`album-items:${album}`;try{items=JSON.parse(sessionStorage.getItem(cacheKey)||'[]');}catch{items=[];}
   if(!Array.isArray(items)||!items.length){const s=await fetchWithTimeout(`${base}/public/status`);if(!s.ok)throw Error(`相簿狀態讀取失敗（HTTP ${s.status}）`);const state=await s.json();if(!state.isOpen)throw Error('相簿目前已關閉。');const l=await fetchWithTimeout(`${base}/public/library`);if(!l.ok)throw Error(`相簿清單讀取失敗（HTTP ${l.status}）`);const data=await l.json();const folder=data.folders?.find(f=>f.pageKey===album)||data.folders?.find(f=>({coffee:'01_咖啡',brunch:'02_早午餐',pier2:'04_駁二'})[album]===f.name);if(!folder)throw Error('找不到這本相簿的雲端資料夾。');items=(data.mediaFiles||[]).filter(m=>m.folderId===folder.id);sessionStorage.setItem(cacheKey,JSON.stringify(items));}
   const id=p.get('id');current=items.findIndex(x=>x.id===id);if(current<0)throw Error('找不到這張照片，請返回相簿重新開啟。');render();
 }catch(e){stage.textContent=e.name==='AbortError'?'雲端連線逾時，請返回相簿後重試。':e.message;}})();
})();