第二章｜今日的台南旅程 v5.7.0

本次修改範圍：僅 chapter-02/ 與 Cloud Run 後端，不修改共同首頁、第一章、第五章或 memories/。

功能：
1. 第二章首頁加入返回共同首頁按鈕（../index.html）。
2. 今日旅程透過 Cloud Run 呼叫 Vertex AI Gemini 3.8 Flash，搭配 Google Search Grounding 產生三類任務；任務記錄於 Firestore，近期任務用於避免重複。AI 失敗會明確顯示錯誤，不會退回固定題庫。
3. 旅程資料保存於 Firestore，原始照片／影片保存於 Google Drive；採 8 MiB 分塊續傳，單一檔案上限 500 MiB。HEIC/HEIF、DNG/RAW、MOV/MP4/M4V 等原始檔保留；瀏覽器不能預覽時提供下載／開啟連結。
4. 三份禮物依序先上傳「與禮物合照」，成功後才進入意涵頁。三份禮物名稱與意涵由使用者提供，逐字保留。
5. 完成三份禮物後，Firestore 將 completed 設為 true。所有裝置重新開啟「今日的驚喜禮物」都直接顯示已完成頁面，不會重啟流程。
6. 保留 v5.6.4 全裝置清除輪詢；清除範圍仍是第二章專用資料與媒體資料夾，最後手繪地圖保留。
7. 後台只保留上傳最後手繪地圖、清除第二章測試資料兩項功能。

部署前必要設定：
- 啟用 Vertex AI API（aiplatform.googleapis.com）。
- Cloud Run 服務帳號新增 Vertex AI User（roles/aiplatform.user）；保留原 Cloud Datastore User 權限。
- 使用 Node.js 20 或以上；部署時執行 npm install。
- 可選環境變數 CHAPTER_02_GEMINI_MODEL，預設 gemini-3.8-flash。
- Cloud Run 目前在 asia-east1；模型呼叫使用 Vertex AI global endpoint，資料處理區域與模型推論區域不是同一件事。

媒體上傳：透過 Cloud Run 分塊代理至 Google Drive，單一檔案上限 500 MiB。檔案原樣保存，不做影像壓縮或格式轉換。瀏覽器支援預覽與否取決於裝置／瀏覽器。

重要安全提醒：目前 /public/chapter-02 API 尚未加入使用者身分驗證；GitHub Pages 本身是公開網站，任何知道 Cloud Run API 網址的人都可能呼叫資料 API，並讀取旅程資料與媒體。CORS 不是身分驗證，Drive 檔案雖未公開分享，但 API 會代為讀取。這一版適合先做功能測試，不應放入高度私密或不願讓未授權者讀取的真實照片。正式使用前必須再加入使用者登入／授權（例如雙方共用的安全登入流程），並在後端驗證每次讀寫與媒體請求；不可把 API Key 或密碼寫在前端。

部署：
A. GitHub Pages：只替換 Repository 的 chapter-02/ 資料夾內容，不要覆蓋根目錄 index.html、memories/、chapter-01/ 或 chapter-05/。
B. Cloud Run：將 chapter02-cloud-run-backend-v5.7.0.zip 解壓後，在包含 package.json 的目錄執行 npm install，部署到既有 private-album-api 服務。部署前先完成上方 API/IAM 設定。
C. 部署後檢查 /health 回報 5.7.0，再測試 AI 產生、雲端旅程保存、原始檔分塊上傳、三份禮物完成狀態與跨裝置讀取。

本版本尚未部署至你的 GitHub Pages 或 Cloud Run；需由管理者依部署說明操作。
