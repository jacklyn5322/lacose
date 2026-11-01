第一章｜初次的風景・海風收藏所（修正版 v3）

本 ZIP 的部署位置
- 本 ZIP 是 memories/ 子站完整內容。
- 將 ZIP 解壓後，將 first-chapter-memory-album 資料夾內的所有內容放入 GitHub Repository 的 memories/ 目錄。
- 本次三格旅程卡片、抹茶分類移除、正式背景底圖及三張代表照片，均位於 memories/index.html 與 memories/assets/，不需要為這些項目修改根目錄共同首頁 index.html。

七項修改在 memories/ 子站的處理
1. 相簿首頁、分類相簿、手繪地圖、照片/影片檢視頁提供返回共同首頁連結（../index.html）。
2. 相簿首頁手繪地圖/第一次約會足跡區塊標題為「2026.10.25 第一次的高雄小旅程」，並置於三格旅程入口之前。
3. 相簿清單與狀態請求並行，前 6 張優先載入，後續縮圖延遲載入。
4. 照片檢視器採沉浸式全視窗；影片設定 muted autoplay 並嘗試 iOS 原生全螢幕。iOS Safari 對自動播放/全螢幕仍可能因系統政策要求使用者直接操作，不能保證強制播放有聲影片。
5. 相簿背景使用使用者提供的原始「高雄港午後：花影與海光.png」。
6. 三格代表照片使用使用者提供的咖啡、可頌、駁二原始照片及其網頁顯示壓縮版本。
7. memories/index.html 僅保留三格：早上的第一杯咖啡、莉莉安的美麗可頌、在駁二預見的 AI。抹茶卡片移除；駁二仍以原本 pageKey=pier2 對應雲端 04_駁二，不改 Drive 資料夾名稱或 ID。

正式設定
config.js 已保留使用者確認的正式 Cloud Run URL，DEMO_MODE=false。

重要技術限制
- Cloud Run 目前公開 API 沒有獨立 thumbnail API 或後端分頁；本版本先優化前端載入順序，仍以 /media 原始媒體作為縮圖來源。若照片很多，真正縮圖效能需另增後端縮圖 API。
- 未修改 Code.gs、Cloud Run index.js、package.json、雲端資料夾名稱/ID、同步授權或相簿總開關。
- 本 ZIP 只包含 memories/ 子站，不包含根目錄共同首頁。共同首頁本身不需要為了第 6、7 項修改而更動，因為三格旅程卡片就在 memories/index.html。
