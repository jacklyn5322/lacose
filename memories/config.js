/**
 * 第一章回憶相簿設定
 * 將 ALBUM_API_BASE 設為目前 Cloud Run 服務網址（不要加結尾斜線）。
 * 例如：https://your-service-xxxxx.run.app
 */
window.ALBUM_CONFIG = {
  ALBUM_API_BASE: "https://請填入你的-cloud-run-服務網址",
  // 若尚未設定 Cloud Run 網址，可先使用 DEMO_MODE 預覽版面。
  DEMO_MODE: true
};
