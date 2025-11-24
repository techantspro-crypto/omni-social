OmniSocial AI Platform 部署指南



環境準備



安裝 Node.js (版本 18+)。



建立資料夾 OmniSocial-Project，將 backend 和 frontend 資料夾放入其中。



後端部署 (Backend)



進入後端資料夾：cd backend



安裝套件：npm install



下載 Firebase 金鑰：



前往 Firebase Console > 專案設定 > 服務帳戶



下載私密金鑰，重新命名為 serviceAccountKey.json 並放入 backend 資料夾。



設定 .env 檔案：



複製以下內容建立 .env 檔案：



PORT=3000

OPENAI\_API\_KEY=你的\_OpenAI\_Key

FB\_PAGE\_ACCESS\_TOKEN=你的\_FB\_Token

WEBHOOK\_VERIFY\_TOKEN=自訂密碼\_123





啟動伺服器：npm start



伺服器將運行在 http://localhost:3000。



使用 ngrok 讓外網可存取：ngrok http 3000。



前端部署 (Frontend)



將 OmniSocialApp.jsx 的內容整合進您的 React 專案 (如使用 Create React App 或 Next.js)。



確保安裝了依賴：npm install lucide-react firebase。



將 backend\_server.js 中的 Firebase Config 填入前端程式碼中。



串接測試



啟動前後端。



在「系統設定」頁面點擊任一平台的「連接」。



檢查「統一收件匣」，應會收到系統自動發送的測試訊息。

