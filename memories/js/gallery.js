(() => {
  const albums = {
    coffee:{title:"早上的第一杯咖啡",folder:"01_咖啡",key:"coffee",description:"從一杯咖啡，收藏故事的開始。"},
    brunch:{title:"莉莉安的美麗可頌",folder:"02_早午餐",key:"brunch",description:"把可頌香氣與一起分享的時光留下。"},
    pier2:{title:"在駁二預見的 AI",folder:"04_駁二",key:"pier2",description:"港邊的藝術、探索，還有意想不到的相遇。"}
  };
  const params = new URLSearchParams(location.search);
  const album = albums[params.get("album")] || albums.coffee;
  const $ = id => document.getElementById(id);
  $("album-title").textContent = album.title;
  $("folder-label").textContent = `CHAPTER 01 · ${album.folder}`;
  $("album-description").textContent = album.description;
  const cfg = window.ALBUM_CONFIG || {};
  const grid = $("photo-grid"), empty = $("empty-state"), count = $("photo-count"), more = $("load-more"), status = $("api-status");
  let items = [], shown = 0;
  const PAGE = 18;
  const base = (cfg.ALBUM_API_BASE || "").replace(/\/+$/, "");
  function demo() {
    count.textContent = "版面預覽";
    empty.hidden = false;
    empty.querySelector("h2").textContent = "相簿入口已準備好";
    empty.querySelector("p").textContent = `接上 Cloud Run 並啟用 ${album.folder} 資料夾後，這裡就會顯示對應照片。`;
  }
  if (cfg.DEMO_MODE || !base || base.includes("請填入")) { demo(); return; }
  async function start(){
    try{
      const [statusRes,res] = await Promise.all([
        fetch(`${base}/public/status`,{cache:"no-store"}),
        fetch(`${base}/public/library`,{cache:"no-store"})
      ]);
      if(!statusRes.ok) throw new Error(`相簿狀態讀取失敗（${statusRes.status}）`);
      if(!res.ok) throw new Error(`相簿清單讀取失敗（${res.status}）`);
      const [state,data] = await Promise.all([statusRes.json(),res.json()]);
      if(!state.isOpen) throw new Error("相簿目前已關閉。");
      const folder = (data.folders||[]).find(f => f.pageKey===album.key || f.name===album.folder);
      if(!folder){
        throw new Error(`找不到雲端資料夾「${album.folder}」。請確認該資料夾已啟用公開顯示，並設定 pageKey=${album.key}。`);
      }
      items = (data.mediaFiles||[]).filter(m => m.folderId===folder.id);
      count.textContent = `共 ${items.length} 個回憶`;
      if(!items.length){empty.hidden=false;return;}
      renderNext();
      more.hidden = items.length <= shown;
      status.textContent = "已連接雲端回憶。";
    }catch(e){count.textContent="無法載入相簿";status.textContent=e.message;empty.hidden=false;empty.querySelector("h2").textContent="暫時無法打開這本相簿";empty.querySelector("p").textContent=e.message;}
  }
  function renderNext(){
    const batch=items.slice(shown,shown+PAGE);
    batch.forEach((m,i)=>{
      const a=document.createElement("a");
      a.className="photo-tile"+(m.mediaType==="video"?" video-tile":"");
      a.href=`viewer.html?id=${encodeURIComponent(m.id)}&type=${encodeURIComponent(m.mediaType)}&name=${encodeURIComponent(m.name||"")}&album=${encodeURIComponent(params.get("album")||"coffee")}`;
      const img=document.createElement("img");
      img.loading=(shown+i)<6?"eager":"lazy";img.decoding="async";img.fetchPriority=(shown+i)<6?"high":"auto";img.alt=m.name||"回憶照片";
      img.src=`${base}${m.url||`/media/${m.id}`}`;
      a.append(img);grid.append(a);
    });
    shown+=batch.length;
    more.hidden=shown>=items.length;
  }
  more.addEventListener("click",renderNext);
  start();
})();
