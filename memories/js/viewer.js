(() => {
 const p=new URLSearchParams(location.search),id=p.get("id"),type=p.get("type"),name=p.get("name")||"OUR MEMORY",album=p.get("album")||"coffee";
 const cfg=window.ALBUM_CONFIG||{},base=(cfg.ALBUM_API_BASE||"").replace(/\/+$/,"");
 document.getElementById("viewer-caption").textContent=name;
 document.getElementById("viewer-back").href=`../index.html`;
 const stage=document.getElementById("viewer-stage");
 if(!id||!base){stage.innerHTML='<div class="viewer-loading">無法取得照片網址，請確認相簿設定。</div>';return;}
 const url=`${base}/media/${encodeURIComponent(id)}`;
 const el=document.createElement(type==="video"?"video":"img");
 if(type==="video"){
   el.controls=true;el.playsInline=false;el.autoplay=true;el.muted=true;el.setAttribute("autoplay","");el.setAttribute("muted","");el.preload="auto";
   el.addEventListener("loadedmetadata",()=>{
     const play=el.play(); if(play&&play.catch)play.catch(()=>{el.controls=true;});
     // Native iOS video fullscreen is attempted after playback starts; Safari may require a direct tap.
     if(typeof el.webkitEnterFullscreen==="function") { try{el.webkitEnterFullscreen();}catch(_){} }
   },{once:true});
 }else{el.alt=name;el.decoding="async";el.fetchPriority="high";}
 el.src=url;stage.replaceChildren(el);
})();
