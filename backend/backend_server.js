/**
 * OmniSocial 後端伺服器 (Node.js + Express + Firebase Admin)
 * 用途：接收社群平台 Webhook、同步訂單、基礎自動回覆
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');

// 1. 初始化 Firebase Admin
try {
  var serviceAccount = require('./serviceAccountKey.json');
} catch (e) {
  console.error("錯誤: 找不到 'serviceAccountKey.json'。請確認檔案已放入 backend 資料夾。");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const app = express();
const PORT = process.env.PORT || 3000;
const APP_ID = 'default-app-id';

app.use(cors());
app.use(bodyParser.json());

// ------------------------------------------------------------------
// 路由
// ------------------------------------------------------------------

app.get('/', (req, res) => {
  res.send('OmniSocial Core Backend is Running! 🚀');
});

// 平台 Webhook 驗證 (Meta 通用)
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

// 接收訊息通知
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page' || body.object === 'instagram') {
    for (const entry of body.entry) {
      const webhook_event = entry.messaging[0];
      const senderPsid = webhook_event.sender.id;
      
      if (webhook_event.message) {
        await handleMessage(senderPsid, webhook_event.message, body.object);
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// 訂單同步 Webhook
app.post('/webhook/orders', async (req, res) => {
  const orderData = req.body;
  console.log("收到外部訂單:", orderData);

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
    res.status(200).send('Order Synced');
  } catch (e) {
    console.error("訂單同步失敗:", e);
    res.status(500).send('Error');
  }
});

// ------------------------------------------------------------------
// 邏輯處理
// ------------------------------------------------------------------

async function handleMessage(senderPsid, receivedMessage, platform) {
  const userText = receivedMessage.text;
  console.log(`收到訊息: ${userText} from ${senderPsid}`);

  const chatRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('chats').doc(senderPsid);
  const chatDoc = await chatRef.get();
  
  let history = [];
  if (chatDoc.exists) {
    history = chatDoc.data().history || [];
  } else {
    await chatRef.set({
      user: `User ${senderPsid.substring(0,4)}`,
      platform: platform === 'instagram' ? 'instagram' : 'facebook',
      avatar: `https://ui-avatars.com/api/?name=${senderPsid}&background=random`,
      unread: 0,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  const newHistory = [...history, { sender: 'user', text: userText }];
  
  await chatRef.update({
    history: newHistory,
    lastMessage: userText,
    timestamp: new Date().toLocaleTimeString(),
    unread: (chatDoc.data()?.unread || 0) + 1
  });

  // [基礎自動回覆] 關鍵字觸發
  if (userText.includes("營業時間")) {
      await sendAutoReply(senderPsid, "我們營業時間是週一至週五 10:00-21:00 喔！", chatRef, newHistory);
  } else if (userText.includes("地址")) {
      await sendAutoReply(senderPsid, "門市地址：台北市信義區...", chatRef, newHistory);
  }
}

async function sendAutoReply(senderId, text, chatRef, history) {
    // 1. 更新資料庫
    const updatedHistory = [...history, { sender: 'ai', text: text }];
    await chatRef.update({
        history: updatedHistory,
        lastMessage: text,
        unread: 0
    });

    // 2. 發送給 FB/IG API (需設定 Token)
    const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (PAGE_ACCESS_TOKEN) {
        try {
            await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
                recipient: { id: senderId },
                message: { text: text }
            });
        } catch (e) {
            console.error("API 發送失敗:", e.message);
        }
    }
}

app.listen(PORT, () => {
  console.log(`✅ 核心後端伺服器已啟動: http://localhost:${PORT}`);
});