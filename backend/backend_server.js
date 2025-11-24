/**
 * OmniSocial 後端伺服器 (Node.js + Express + Firebase Admin)
 * 啟動指令: npm install && npm start
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { OpenAI } = require('openai');
const axios = require('axios');

// ------------------------------------------------------------------
// 1. 初始化設定
// ------------------------------------------------------------------

// 檢查金鑰是否存在
try {
  var serviceAccount = require('./serviceAccountKey.json');
} catch (e) {
  console.error("錯誤: 找不到 'serviceAccountKey.json'。請確認您已從 Firebase 下載並放入此資料夾。");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const app = express();
const PORT = process.env.PORT || 3000;
const APP_ID = 'default-app-id'; // 與前端對應的 App ID

app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ------------------------------------------------------------------
// 2. 路由 (Routes)
// ------------------------------------------------------------------

// 首頁測試
app.get('/', (req, res) => {
  res.send('OmniSocial Backend is Running! 🚀');
});

// Meta (FB/IG) Webhook 驗證
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// 接收訊息 Webhook
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page' || body.object === 'instagram') {
    for (const entry of body.entry) {
      const webhook_event = entry.messaging[0];
      const senderPsid = webhook_event.sender.id;
      
      if (webhook_event.message && !webhook_event.message.is_echo) {
        await handleMessage(senderPsid, webhook_event.message, body.object);
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// 訂單同步 Webhook (來自 Shopify/WooCommerce)
app.post('/webhook/orders', async (req, res) => {
  const orderData = req.body;
  console.log("收到新訂單:", orderData);

  try {
    await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('orders').add({
      displayId: orderData.id || `ORD-${Date.now()}`,
      customer: orderData.customer_name || "Guest",
      amount: orderData.total || 0,
      source: 'website',
      item: orderData.items ? orderData.items[0].name : "一般商品",
      status: 'pending',
      date: new Date().toLocaleDateString(),
      synced: true
    });
    res.status(200).send('Order Synced to Firebase');
  } catch (e) {
    console.error("訂單同步失敗:", e);
    res.status(500).send('Error');
  }
});

// ------------------------------------------------------------------
// 3. 邏輯處理
// ------------------------------------------------------------------

async function handleMessage(senderPsid, receivedMessage, platform) {
  const userText = receivedMessage.text;
  console.log(`[New Message] ID:${senderPsid} Text:${userText}`);

  const chatRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('chats').doc(senderPsid);
  const chatDoc = await chatRef.get();
  
  let history = [];
  if (chatDoc.exists) {
    history = chatDoc.data().history || [];
  } else {
    // 新建對話
    await chatRef.set({
      user: `User ${senderPsid.substring(0,4)}`,
      platform: platform === 'instagram' ? 'instagram' : 'facebook',
      avatar: `https://ui-avatars.com/api/?name=${senderPsid}&background=random`,
      unread: 0,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  // 更新用戶訊息
  const newHistory = [...history, { sender: 'user', text: userText }];
  
  await chatRef.update({
    history: newHistory,
    lastMessage: "您: " + userText,
    timestamp: new Date().toLocaleTimeString(),
    unread: (chatDoc.data()?.unread || 0) + 1
  });

  // 觸發 AI
  await generateAIReply(senderPsid, newHistory, chatRef);
}

async function generateAIReply(senderId, history, chatRef) {
  if (!process.env.OPENAI_API_KEY) return;

  try {
    // 取得 AI 設定 (可選)
    const configDoc = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('ai_settings').doc('config').get();
    const systemPrompt = configDoc.exists ? configDoc.data().systemPrompt : "你是一個專業的客服助手。";

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-5).map(msg => ({ // 只取最近 5 則以節省 Token
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    ];

    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4",
    });

    const aiText = completion.choices[0].message.content;

    // 更新 AI 回覆到資料庫
    const updatedHistory = [...history, { sender: 'ai', text: aiText }];
    await chatRef.update({
      history: updatedHistory,
      lastMessage: aiText,
      unread: 0
    });

    // 回傳給平台 (取消註解以啟用)
    // await sendToPlatform(senderId, aiText);

  } catch (error) {
    console.error("AI Generation Error:", error);
  }
}

async function sendToPlatform(recipientId, responseText) {
  const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!PAGE_ACCESS_TOKEN) return;

  try {
    await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      recipient: { id: recipientId },
      message: { text: responseText }
    });
  } catch (error) {
    console.error("Platform Send Error:", error.response ? error.response.data : error.message);
  }
}

// 啟動
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`✅ 後端伺服器已啟動: http://localhost:${PORT}`);
  console.log(`✅ Webhook 路徑: /webhook`);
  console.log(`=========================================`);
});