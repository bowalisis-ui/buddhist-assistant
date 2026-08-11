# 📿 讀經陪伴小助手 Web 應用程式 (reader_app)

本資料夾包含「讀經陪伴小助手」前端 Vite + React 應用程式。

## 🔑 API Key 金鑰設定說明

本應用程式串接 Google Gemini API 做為讀經小助手的 AI 解讀引擎：

1. 請參考資料夾內的 `.env.example` 檔案。
2. 建立 `.env.local` 檔案並填入您的 Gemini API 金鑰：
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. ⚠️ **安全規範**：切勿將包含真實金鑰的 `.env.local` 上傳至 Git 儲存庫。

## 🚀 本地開發啟動

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev
```
