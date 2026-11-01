(() => {
  const cfg = window.ALBUM_CONFIG || {};
  const status = document.getElementById("api-status");
  if (cfg.DEMO_MODE || !cfg.ALBUM_API_BASE || cfg.ALBUM_API_BASE.includes("請填入")) {
    status.textContent = "目前為版面預覽模式；接上 Cloud Run 後會顯示實際雲端相簿狀態。";
    return;
  }
  fetch(`${cfg.ALBUM_API_BASE.replace(/\/+$/, "")}/public/status`, {cache:"no-store"})
    .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(data => { status.textContent = data.isOpen ? "雲端回憶已準備好，等你慢慢翻閱。" : "相簿目前暫時休息中。"; })
    .catch(() => { status.textContent = "目前無法連線雲端相簿，請稍後再試。"; });
})();
