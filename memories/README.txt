第一章｜初次的風景・海風收藏所（初版）

部署方式
1. 將 memories 專案資料夾內所有內容放進 GitHub Pages 專案的 memories/ 目錄。
2. 共同首頁原本的 memories/index.html 連結需注意：目前共同首頁使用 memories/index.html。
   因此請將本套件的 index.html 放在 memories/index.html（即本資料夾內容直接上傳至網站的 memories/）。
3. 將 config.js 的 ALBUM_API_BASE 改成目前 Cloud Run 的 HTTPS 網址。
4. 完成設定後將 DEMO_MODE 改為 false。
5. Cloud Run 公開相簿設定需啟用四個資料夾，建議 pageKey 分別設定：
   01_咖啡 -> coffee
   02_早午餐 -> brunch
   03_抹茶 -> matcha
   04_駁二 -> pier2
   顯示名稱建議保留雲端原名稱，避免名稱與資料夾辨識不一致。

目前版本說明
- 本版完成：相簿首頁、四個入口、雲端資料夾對應、照片清單分批呈現、獨立照片/影片檢視頁、手繪地圖縮放頁。
- 目前 Cloud Run 的 /public/library 會回傳全部已啟用媒體的 metadata，前端再依 folderId 篩選；照片原始檔透過 /media/{id} 讀取。
- 目前後端沒有獨立 thumbnail API，因此本版照片格會以 lazy loading 方式載入原始媒體；這不是伺服器縮圖，後續正式大量照片前建議再增加縮圖 API 與後端分頁。
- 本版 DEMO_MODE 預設 true，尚未連接 Cloud Run 時可先檢查視覺和頁面流程。
- 地圖為原始上傳圖，單獨頁面支援指標拖曳、雙指縮放（手機）、雙擊放大及重設。
