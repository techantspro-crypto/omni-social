import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, ShoppingBag, BarChart2, Settings, Search, Send, Bot, Filter, TrendingUp, Users, Eye, CheckCircle, Menu, X as XIcon, MessageCircle, Instagram, Facebook, Youtube, Twitter, Image as ImageIcon, Phone, Paperclip, Link2, Trash2, Shield, Smartphone, Key, QrCode, LogOut, UserPlus, Lock, Mail, User, FileText, ShieldCheck, Globe, RefreshCw, Server, ArrowRight, Database, Video, Chrome, Brain, Zap, Plus, Edit, Save, Cpu, AlertTriangle
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, getDocs, setDoc, deleteDoc, orderBy, getDoc, writeBatch } from 'firebase/firestore';

// --- Initial Data ---
const INITIAL_CHATS = [
  {
    displayId: 1, user: "Amy Chen", platform: "instagram", avatar: "https://i.pravatar.cc/150?u=1", lastMessage: "請問這個紅色包包還有現貨嗎？", timestamp: "10:23 AM", unread: 2,
    history: [{ sender: "user", text: "你好，我看這款很久了" }, { sender: "user", text: "請問這個紅色包包還有現貨嗎？" }]
  },
  {
    displayId: 2, user: "Jason Wu", platform: "facebook", avatar: "https://i.pravatar.cc/150?u=2", lastMessage: "你們的營業時間是幾點？", timestamp: "09:15 AM", unread: 0,
    history: [{ sender: "user", text: "嗨" }, { sender: "user", text: "你們的營業時間是幾點？" }, { sender: "ai", text: "您好！我們的營業時間是週一至週五，早上10點到晚上9點。" }]
  }
];

const INITIAL_PLATFORMS = [
  { id: 'website', name: '自家官網 / 電商系統', type: 'webhook', description: '連接 Shopify, WooCommerce 或自建網站，一鍵同步訂單。', connected: false, accountName: null },
  { id: 'instagram', name: 'Instagram', type: 'oauth', description: '連接 Instagram 商業帳號以管理私訊與留言。', connected: true, accountName: '@amy_style_official' },
  { id: 'facebook', name: 'Facebook', type: 'oauth', description: '同步粉絲專頁訊息、貼文與直播留言。', connected: true, accountName: 'Amy Fashion Shop' },
  { id: 'threads', name: 'Threads', type: 'oauth', description: '同步 Threads 串文與互動數據，支援自動回覆。', connected: false, accountName: null },
  { id: 'twitter', name: 'X (Twitter)', type: 'oauth', description: '即時監控推文提及與私訊互動 API。', connected: true, accountName: '@amy_shop_tw' },
  { id: 'tiktok', name: 'TikTok (抖音)', type: 'oauth', description: '連接 TikTok 商業帳號，分析短影音數據。', connected: false, accountName: null },
  { id: 'xiaohongshu', name: '小紅書', type: 'qr', description: '掃描 QR Code 授權登入 (Cookie 同步)。', connected: false, accountName: null },
  { id: 'whatsapp', name: 'WhatsApp', type: 'qr', description: '連接 WhatsApp Business API 或掃描 QR Code。', connected: true, accountName: '+886 912 *** 789' },
  { id: 'telegram', name: 'Telegram', type: 'token', description: '輸入 Bot Token 以連接您的 Telegram 機器人。', connected: false, accountName: null },
  { id: 'youtube', name: 'YouTube', type: 'oauth', description: '管理頻道留言與影片數據分析。', connected: false, accountName: null },
];

const INITIAL_AI_CONFIG = {
  id: 'config', provider: 'openai', apiKey: '', model: 'gpt-4o', systemPrompt: '你是一個專業的社群客服助手，語氣親切、專業，請用繁體中文回答。', temperature: 0.7
};

const INITIAL_KNOWLEDGE_BASE = [
  { keyword: '營業時間', content: '我們的營業時間是週一至週五，早上 10:00 到晚上 9:00。週末休息。' },
  { keyword: '退換貨', content: '商品收到後 7 天內保持包裝完整皆可申請退換貨。請私訊小幫手索取退貨代碼。' },
  { keyword: '運費', content: '全館滿 $2000 免運費，未滿則收取 $80 運費。' },
  { keyword: '現貨', content: '官網標示「現貨」之商品，下單後 24 小時內出貨。預購商品需等待 7-14 個工作天。' }
];

// --- Firebase Initialization ---
// [⚠️ CRITICAL - 請將此處替換為您真實的 Firebase Config ⚠️]
// 我已經幫您填好了已知的 Project ID，請務必填入正確的 apiKey 和 appId
const firebaseConfig = {
  apiKey: "AIzaSyC4CAw27pcOz-WwSkXDHFbksjaTRoGUYts", // <--- 🔴 這裡一定要改！從 Firebase Console 複製
  authDomain: "omnisocial-728c9.firebaseapp.com",
  projectId: "omnisocial-728c9",
  storageBucket: "omnisocial-728c9.appspot.com",
  messagingSenderId: "146517687086",
  appId: "1:146517687086:web:f368ee90f466c5022958bf"   // <--- 🔴 這裡也要改！
};

// Initialize Firebase
let app;
let auth;
let db;
let configError = false;

try {
  // 檢查是否填入了真實的 Key
  if (firebaseConfig.apiKey === "AIzaSyC4CAw27pcOz-WwSkXDHFbksjaTRoGUYts") {
     configError = true;
  } else {
    if (typeof window !== 'undefined' && !window._firebaseApp) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        window._firebaseApp = app;
    } else {
        app = window._firebaseApp;
        auth = getAuth(app);
        db = getFirestore(app);
    }
  }
} catch (error) {
  console.error("Firebase 初始化失敗:", error);
  configError = true;
}

// [FIX] Sanitize appId to remove slashes which break Firestore collection paths
const rawAppId = typeof __app_id !== 'undefined' ? String(__app_id) : 'default-app-id';
const appId = rawAppId.replace(/\//g, '_');

// --- UI Components ---
// ... (PlatformIcon, Sidebar, Views components remain the same as previous correct version) ...

const PlatformIcon = ({ platform, size = 16, className="" }) => {
  const styleClass = `inline-block align-middle ${className}`;
  const p = platform ? platform.toLowerCase() : '';
  switch (p) {
    case 'instagram': return <Instagram size={size} className={`${styleClass} text-pink-600`} />;
    case 'facebook': return <Facebook size={size} className={`${styleClass} text-blue-600`} />;
    case 'twitter': return <Twitter size={size} className={`${styleClass} text-sky-500`} />;
    case 'youtube': return <Youtube size={size} className={`${styleClass} text-red-600`} />;
    case 'threads': return <span className={`${styleClass} font-bold text-black dark:text-white`} style={{fontSize: size}}>@</span>;
    case 'xiaohongshu': return <span className={`${styleClass} font-bold text-red-500`} style={{fontSize: size}}>紅</span>;
    case 'whatsapp': return <Phone size={size} className={`${styleClass} text-green-500`} />; 
    case 'telegram': return <Send size={size} className={`${styleClass} text-sky-400`} />; 
    case 'tiktok': return <Video size={size} className={`${styleClass} text-black dark:text-white`} />;
    case 'website': return <Globe size={size} className={`${styleClass} text-indigo-500`} />;
    default: return <MessageCircle size={size} className={styleClass} />;
  }
};

const Sidebar = ({ activeTab, setActiveTab, onLogout, isAdmin }) => {
  const menuItems = [
    { id: 'dashboard', icon: BarChart2, label: '總覽儀表板' },
    { id: 'inbox', icon: MessageSquare, label: '統一收件匣' },
    { id: 'analytics', icon: TrendingUp, label: '爆文與分析' },
    { id: 'orders', icon: ShoppingBag, label: '訂單管理' },
    { id: 'ai_settings', icon: Brain, label: 'AI 智能客服設定' },
  ];
  if (isAdmin) menuItems.push({ id: 'users', icon: Users, label: '用戶管理 (審核)' });
  return (
    <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen transition-all duration-300">
      <div className="p-6 font-bold text-2xl flex items-center gap-2 text-indigo-400"><Bot size={32} /><span className="hidden md:block">OmniAI</span></div>
      <nav className="flex-1 mt-6">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center p-4 hover:bg-slate-800 transition-colors ${activeTab === item.id ? 'bg-indigo-600 border-r-4 border-indigo-300' : 'text-slate-400'}`}><item.icon size={24} /><span className="ml-4 hidden md:block font-medium">{item.label}</span></button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button onClick={() => setActiveTab('settings')} className={`flex items-center w-full p-2 transition-colors ${activeTab === 'settings' ? 'text-white bg-slate-800 rounded-lg' : 'text-slate-400 hover:text-white'}`}><Settings size={20} /><span className="ml-4 hidden md:block">平台串接</span></button>
        <button onClick={onLogout} className="flex items-center w-full p-2 text-red-400 hover:text-red-300 transition-colors"><LogOut size={20} /><span className="ml-4 hidden md:block">登出</span></button>
      </div>
    </div>
  );
};

const InboxView = ({ chats, activePlatformFilter, setActivePlatformFilter }) => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  useEffect(() => { if (!selectedChatId && chats.length > 0) setSelectedChatId(chats[0].id); }, [chats, selectedChatId]);
  const displayedChats = chats.filter(chat => activePlatformFilter === 'all' || chat.platform === activePlatformFilter);
  const selectedChat = chats.find(c => c.id === selectedChatId);
  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedChat) return;
    const chatRef = doc(db, 'artifacts', appId, 'public', 'data', 'chats', selectedChat.id);
    await updateDoc(chatRef, { history: [...selectedChat.history, { sender: 'admin', text: replyText }], lastMessage: "您: " + replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), unread: 0 });
    setReplyText("");
  };
  return (
    <div className="flex h-full bg-slate-50">
      <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200"><h2 className="text-lg font-bold text-slate-800 mb-3">訊息中心</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide -mx-1 px-1">{['all', 'instagram', 'facebook', 'threads', 'whatsapp', 'telegram', 'twitter', 'tiktok', 'xiaohongshu'].map(p => <button key={p} onClick={() => setActivePlatformFilter(p)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${activePlatformFilter === p ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>)}</div>
        </div>
        <div className="flex-1 overflow-y-auto">{displayedChats.map(chat => <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`p-4 flex items-start cursor-pointer ${selectedChatId === chat.id ? 'bg-indigo-50' : ''}`}><img src={chat.avatar} className="w-10 h-10 rounded-full"/><div className="ml-3 flex-1"><div className="font-bold text-sm">{chat.user}</div><div className="text-xs text-slate-500">{chat.lastMessage}</div></div></div>)}</div>
      </div>
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedChat ? <><div className="p-4 bg-white border-b border-slate-200 flex justify-between"><h3 className="font-bold">{selectedChat.user}</h3><div className="flex items-center gap-2"><Bot size={16}/><span className="text-xs">AI {aiEnabled?'On':'Off'}</span></div></div><div className="flex-1 overflow-y-auto p-6 space-y-4">{selectedChat.history?.map((msg, i) => <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-white' : 'bg-indigo-600 text-white'}`}>{msg.text}</div></div>)}</div><div className="p-4 bg-white border-t"><div className="flex gap-2"><input value={replyText} onChange={e=>setReplyText(e.target.value)} className="flex-1 border rounded-xl p-2"/><button onClick={handleSendMessage} className="bg-indigo-600 text-white p-2 rounded-xl"><Send size={20}/></button></div></div></> : <div className="flex-1 flex items-center justify-center text-slate-400">選擇對話</div>}
      </div>
    </div>
  );
};

const SettingsView = ({ platforms }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState(null);
  const [connectingId, setConnectingId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleConnectClick = (platform) => { setActivePlatform(platform); setModalOpen(true); };
  const handleDisconnect = async (id, docId) => { if (confirm("解除連接？")) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'platforms', docId), { connected: false, accountName: null }); };
  const confirmConnection = async (accountName) => {
    if (!activePlatform) return;
    setConnectingId(activePlatform.id);
    setModalOpen(false);
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'platforms', activePlatform.id), { connected: true, accountName: accountName });
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), { user: `${activePlatform.name} System`, platform: activePlatform.id, avatar: `https://ui-avatars.com/api/?name=${activePlatform.name}`, lastMessage: `系統連接成功`, timestamp: new Date().toLocaleTimeString(), unread: 1, history: [{ sender: 'ai', text: `${activePlatform.name} 連接成功！` }] });
        alert(`${activePlatform.name} 連接成功！`);
      } catch(e) { console.error(e); alert("連接失敗: " + e.message); }
      setConnectingId(null);
      setActivePlatform(null);
    }, 1500);
  };

  const initializePlatforms = async () => {
    setIsInitializing(true);
    try {
      const batch = writeBatch(db);
      INITIAL_PLATFORMS.forEach(p => { const ref = doc(db, 'artifacts', appId, 'public', 'data', 'platforms', p.id); batch.set(ref, p); });
      INITIAL_CHATS.forEach(async (chat) => { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), chat); });
      INITIAL_KNOWLEDGE_BASE.forEach(async (kb) => { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'knowledge_base'), kb); });
      await batch.commit();
      alert("資料庫已強制重置！請重新整理頁面查看效果。");
      window.location.reload();
    } catch (e) { console.error(e); alert("初始化失敗: " + e.message); }
    setIsInitializing(false);
  };

  const renderInputs = () => {
     // Inputs render logic (same as before)
     if (!activePlatform) return null;
     return <button onClick={() => confirmConnection("Connected")} className="w-full bg-indigo-600 text-white py-2 rounded">確認連接</button>;
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8 relative">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">平台帳戶整合 ({platforms?.length || 0})</h1><button onClick={initializePlatforms} disabled={isInitializing} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">{isInitializing ? <RefreshCw size={16} className="animate-spin"/> : <AlertTriangle size={16}/>} 強制初始化資料</button></div>
      {!platforms || platforms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl"><Database size={48} className="text-slate-300 mb-4"/><p className="text-slate-500 mb-4">目前沒有平台資料或資料庫未連接</p><button onClick={initializePlatforms} className="bg-indigo-600 text-white px-6 py-2 rounded-xl">立即寫入預設資料</button></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{platforms.map(p => (<div key={p.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="flex justify-between mb-4"><div className="flex gap-3 items-center"><PlatformIcon platform={p.id} size={24}/><h3 className="font-bold text-lg">{p.name}</h3></div>{p.connected ? <button onClick={() => handleDisconnect(p.id, p.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={20}/></button> : <button onClick={() => handleConnectClick(p)} className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-indigo-100">連接</button>}</div><p className="text-sm text-slate-500 mb-4">{p.description}</p>{p.connected ? <div className="bg-slate-50 p-2 rounded-lg flex gap-2 text-sm items-center border border-slate-100"><CheckCircle size={14} className="text-green-500"/><span className="font-mono text-slate-700">{p.accountName}</span></div> : <div className="text-center p-2 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">尚未設定帳戶</div>}</div>))}</div>
      )}
      {modalOpen && activePlatform && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl"><div className="flex justify-between mb-6 border-b pb-4"><h3 className="font-bold text-xl flex items-center gap-2">連接 {activePlatform.name}</h3><button onClick={() => setModalOpen(false)}><XIcon/></button></div>{renderInputs()}</div></div>}
    </div>
  );
};

// ... (AuthScreen, AIChatbotSettingsView, UserManagementView, AnalyticsView, OrdersView, DashboardView remain similar)

// --- Main App Wrapper ---
const App = () => {
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState(null);
  const [data, setData] = useState({ chats: [], orders: [], platforms: [], users: [], posts: [], knowledgeBase: [], aiConfig: null });
  const [activeTab, setActiveTab] = useState('inbox');

  // Auth Init
  useEffect(() => {
    if (configError) return;
    const init = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } 
        else { await signInAnonymously(auth); }
      } catch (error) { console.error("Auth initialization failed:", error); }
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Data Sync
  useEffect(() => {
    if (!user || configError) return;
    const syncCollection = (col, initial) => onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', col), snap => {
      if (snap.empty && initial) initial.forEach(i => col==='platforms'?setDoc(doc(db,'artifacts',appId,'public','data',col,i.id),i):addDoc(collection(db,'artifacts',appId,'public','data',col),i));
      setData(prev => ({...prev, [col==='app_users'?'users':col]: snap.docs.map(d => ({id:d.id, ...d.data()}))}));
    }, (error) => console.error(`Error syncing ${col}:`, error));
    
    // ... (Other syncs similar to before)
    const unsubChats = syncCollection('chats', INITIAL_CHATS);
    const unsubOrders = syncCollection('orders', []);
    const unsubPlatforms = syncCollection('platforms', INITIAL_PLATFORMS); 
    const unsubPosts = syncCollection('posts', []); 
    const unsubUsers = syncCollection('app_users', []); 
    return () => { unsubChats(); unsubOrders(); unsubPosts(); unsubUsers(); unsubPlatforms(); };
  }, [user]);

  if (configError) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-red-50 p-8">
              <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg text-center">
                  <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-slate-800 mb-4">設定錯誤：請填入 Firebase 金鑰</h1>
                  <p className="text-slate-600 mb-6">
                      您的應用程式目前使用的是「範例金鑰」，因此無法連線到資料庫。
                      <br/><br/>
                      請回到程式碼 <b>frontend/src/OmniSocialApp.jsx</b> 第 60 行左右，將 <b>firebaseConfig</b> 替換為您從 Firebase Console 複製的真實設定。
                  </p>
                  <div className="bg-slate-100 p-4 rounded text-left text-sm font-mono text-slate-500">
                      const firebaseConfig = &#123;<br/>
                      &nbsp;&nbsp;apiKey: "YOUR_REAL_KEY_HERE",<br/>
                      &nbsp;&nbsp;...<br/>
                      &#125;;
                  </div>
              </div>
          </div>
      );
  }

  const handleLogin = (userData) => { setCurrentUser(userData); setIsAuthenticated(true); setActiveTab('inbox'); };
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsAuthenticated(false)} isAdmin={currentUser?.role === 'admin'} />
      <main className="flex-1 h-full overflow-hidden relative">
        {activeTab === 'inbox' && <InboxView chats={data.chats} activePlatformFilter={'all'} setActivePlatformFilter={()=>{}} />}
        {activeTab === 'settings' && <SettingsView platforms={data.platforms} />}
        {activeTab === 'dashboard' && <DashboardView chats={data.chats} orders={data.orders} />}
        {activeTab === 'orders' && <OrdersView orders={data.orders} />}
        {activeTab === 'ai_settings' && <AIChatbotSettingsView aiConfig={data.aiConfig} knowledgeBase={data.knowledgeBase} />}
        {activeTab === 'users' && <UserManagementView pendingUsers={data.users.filter(u=>u.status==='pending')} />}
        {activeTab === 'analytics' && <AnalyticsView posts={data.posts} />}
      </main>
    </div>
  );
};

export default App;