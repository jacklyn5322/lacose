台南旅程第二章｜修正版測試包

檔案：
- index.html：旅程首頁（入口立即顯示台南手繪街景）
- destination.html：輸入目前景點與補充資訊
- game.html：可操作的旅程任務測試頁、照片預覽、任務完成勾選、紀錄保存及本機測試紀錄檢視/清空
- assets/destination-illustration.jpg：景點輸入頁插畫
- assets/tainan-home-scene.jpg：首頁手繪街景底圖

部署：請將 chapter-02 資料夾內所有檔案及 assets 資料夾完整上傳到 GitHub Pages 原本第二章目錄，維持相對路徑。

測試流程：首頁 → 開始今天的旅程 → 輸入景點 → 生成我的旅程任務 → 勾選任務/填寫回答/選擇照片 → 完成並保存這一站 → 回首頁的「查看旅程測試紀錄」。

重要說明：本版本提供可操作的本機測試任務，不是連線中的 AI 生成。遊戲任務為前端預設示範內容；紀錄使用 localStorage 儲存在目前瀏覽器/裝置，不會同步至雲端或其他裝置。清空功能只清除本章 localStorage 測試紀錄。
