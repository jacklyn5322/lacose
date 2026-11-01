(() => {
 const p=new URLSearchParams(location.search),id=p.get("id"),type=p.get("type"),name=p.get("name")||"OUR MEMORY",album=p.get("album")||"coffee";
 const cfg=window.ALBUM_CONFIG||{},base=(cfg.ALBUM_API_BASE||"").replace(/\/+$/,"");
 document.getElementById("viewer-caption").textContent=name;
 document.getElementById("viewer-back").href=`gallery.html?album=${encodeURIComponent(album)}`;
 const stage=document.getElementById("viewer-stage");
 if(!id||!base||base.includes("請填入")){stage.innerHTML='<div class="viewer-loading">請先設定 Cloud Run API 網址，再開啟雲端原始照片。</div>';return;}
 const url=`${base}/media/${encodeURIComponent(id)}`;
 const el=document.createElement(type==="video"?"video":"img");
 if(type==="video"){el.controls=true;el.playsInline=true;el.preload="metadata";}else{el.alt=name;el.decoding="async";}
 el.src=url;stage.replaceChildren(el);
})();
