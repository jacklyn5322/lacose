/* Chapter 02 accessible full-screen photo/video viewer */
(function(){
 'use strict';
 let items=[],index=0,overlay,stage,count,nameNode,download,prev,next,close;
 function setup(){
  if(overlay)return;
  overlay=document.createElement('div');overlay.className='ch2-lightbox';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','全螢幕媒體瀏覽');
  overlay.innerHTML='<div class="ch2-lightbox-inner"><div class="ch2-lightbox-top"><button type="button" data-close aria-label="關閉全螢幕">✕ 關閉</button><span class="ch2-lightbox-count"></span><span class="ch2-lightbox-name"></span></div><div class="ch2-lightbox-stage"></div><div class="ch2-lightbox-bottom"><button type="button" data-prev>‹ 上一頁</button><a data-download target="_blank" rel="noopener">下載原始檔案</a><button type="button" data-next>下一頁 ›</button></div></div>';
  document.body.appendChild(overlay);
  stage=overlay.querySelector('.ch2-lightbox-stage');count=overlay.querySelector('.ch2-lightbox-count');nameNode=overlay.querySelector('.ch2-lightbox-name');download=overlay.querySelector('[data-download]');prev=overlay.querySelector('[data-prev]');next=overlay.querySelector('[data-next]');close=overlay.querySelector('[data-close]');
  close.addEventListener('click',hide);prev.addEventListener('click',()=>show(index-1));next.addEventListener('click',()=>show(index+1));
  overlay.addEventListener('click',e=>{if(e.target===overlay)hide()});
  document.addEventListener('keydown',e=>{if(!overlay.classList.contains('open'))return;if(e.key==='Escape')hide();if(e.key==='ArrowLeft')show(index-1);if(e.key==='ArrowRight')show(index+1)});
  let touchX=0;
  overlay.addEventListener('touchstart',e=>{touchX=e.changedTouches[0]?.clientX||0},{passive:true});
  overlay.addEventListener('touchend',e=>{const dx=(e.changedTouches[0]?.clientX||0)-touchX;if(Math.abs(dx)>55)show(index+(dx<0?1:-1))},{passive:true});
 }
 function show(nextIndex){
  if(!items.length)return;
  index=(nextIndex+items.length)%items.length;
  const item=items[index];stage.innerHTML='';
  const isVideo=item.mediaType==='video'||item.mimeType?.startsWith('video/');
  let media;
  if(isVideo){media=document.createElement('video');media.controls=true;media.playsInline=true;media.preload='metadata';media.src=item.url;media.setAttribute('aria-label',item.name||'影片');}
  else{media=document.createElement('img');media.src=item.url;media.alt=item.name||'回憶照片';media.decoding='async';}
  stage.appendChild(media);
  media.addEventListener('error',()=>{
   stage.innerHTML='';
   const fallback=document.createElement('div');fallback.className='notice';fallback.textContent='此瀏覽器無法直接預覽這個原始媒體格式，原始檔案仍可下載／開啟。';
   const link=document.createElement('a');link.href=item.downloadUrl||item.url;link.textContent='下載／開啟原始檔案：'+(item.name||'媒體檔案');link.target='_blank';link.rel='noopener';
   stage.append(fallback,link);
  },{once:true});
  count.textContent=(index+1)+' / '+items.length;nameNode.textContent=item.name||'';download.href=item.downloadUrl||item.url;download.download=item.name||'';
  prev.disabled=items.length<2;next.disabled=items.length<2;
  if(isVideo){const p=media.play();if(p?.catch)p.catch(()=>{});}
  if(overlay.requestFullscreen&&!document.fullscreenElement)overlay.requestFullscreen().catch(()=>{});
 }
 async function hide(){
  overlay.classList.remove('open');stage.innerHTML='';
  if(document.fullscreenElement&&document.exitFullscreen)try{await document.exitFullscreen()}catch(_){}
 }
 function open(list,start){items=list||[];setup();overlay.classList.add('open');show(start||0)}
 function bind(root,list){
  items=list||[];
  root.addEventListener('click',e=>{const trigger=e.target.closest('[data-gallery-index]');if(!trigger)return;open(items,Number(trigger.dataset.galleryIndex)||0)});
 }
 window.Chapter02Lightbox={open,bind};
})();
