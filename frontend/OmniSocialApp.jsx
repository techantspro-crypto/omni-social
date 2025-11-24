import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, ShoppingBag, BarChart2, Settings, Search, Send, Bot, Filter, TrendingUp, Users, Eye, CheckCircle, Menu, X as XIcon, MessageCircle, Instagram, Facebook, Youtube, Twitter, Image as ImageIcon, Phone, Paperclip, Link2, Trash2, Shield, Smartphone, Key, QrCode, LogOut, UserPlus, Lock, Mail, User, FileText, ShieldCheck, Globe, RefreshCw, Server, ArrowRight, Database, Video, Chrome, Brain, Zap, Plus, Edit, Save, Cpu, AlertTriangle, Sparkles
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
  id: 'config', provider: 'openai', apiKey: '', model: 'gpt-4o', systemPrompt: '你是一個專業的社群客服助手，語氣親切、專業，請用繁體中文回答。', temperature: 0.7, backendUrl: 'https://your-backend-url.onrender.com'
};

const INITIAL_KNOWLEDGE_BASE = [
  { keyword: '營業時間', content: '我們的營業時間是週一至週五，早上 10:00 到晚上 9:00。週末休息。' },
  { keyword: '退換貨', content: '商品收到後 7 天內保持包裝完整皆可申請退換貨。請私訊小幫手索取退貨代碼。' },
  { keyword: '運費', content: '全館滿 $2000 免運費，未滿則收取 $80 運費。' },
  { keyword: '現貨', content: '官網標示「現貨」之商品，下單後 24 小時內出貨。預購商品需等待 7-14 個工作天。' }
];

// --- Firebase Initialization ---
// [⚠️ IMPORTANT] 請務必在此填入您真實的 Firebase Config
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyC4CAw27pcOz-WwSkXDHFbksjaTRoGUYts", 
  authDomain: "omnisocial-728c9.firebaseapp.com",
  projectId: "omnisocial-728c9",
  storageBucket: "omnisocial-728c9.appspot.com",
  messagingSenderId: "117516494383",
  appId: "1:117516494383:web:997586b9b2626f31c94633"
};

let app, auth, db;
try {
  if (typeof window !== 'undefined' && !window._firebaseApp) {
      app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); window._firebaseApp = app;
  } else { app = window._firebaseApp; auth = getAuth(app); db = getFirestore(app); }
} catch (error) { console.error("Firebase Init Error:", error); }

const rawAppId = typeof __app_id !== 'undefined' ? String(__app_id) : 'default-app-id';
const appId = rawAppId.replace(/\//g, '_');

// --- Components ---
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

const InboxView = ({ chats, activePlatformFilter, setActivePlatformFilter, aiConfig }) => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => { if (!selectedChatId && chats.length > 0) setSelectedChatId(chats[0].id); }, [chats, selectedChatId]);
  const displayedChats = chats.filter(chat => activePlatformFilter === 'all' || chat.platform === activePlatformFilter);
  const selectedChat = chats.find(c => c.id === selectedChatId);

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedChat) return;
    const chatRef = doc(db, 'artifacts', appId, 'public', 'data', 'chats', selectedChat.id);
    await updateDoc(chatRef, { history: [...selectedChat.history, { sender: 'admin', text: replyText }], lastMessage: "您: " + replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), unread: 0 });
    setReplyText("");
  };

  const generateGeminiReply = async () => {
    if (!selectedChat || !aiConfig?.backendUrl) {
        alert("請先至「AI 智能客服設定」填寫後端網址 (Backend URL)");
        return;
    }
    setIsGenerating(true);
    try {
        const response = await fetch(`${aiConfig.backendUrl}/api/chat`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: selectedChat.lastMessage, context: `User: ${selectedChat.user}, Platform: ${selectedChat.platform}` })
        });
        const data = await response.json();
        if (data.reply) setReplyText(data.reply); else setReplyText("AI 無法產生回應。");
    } catch (error) { console.error("AI Fetch Error:", error); setReplyText("連線錯誤：無法連接至後端 AI 服務。"); }
    setIsGenerating(false);
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
        {selectedChat ? <><div className="p-4 bg-white border-b border-slate-200 flex justify-between"><h3 className="font-bold">{selectedChat.user}</h3><div className="flex items-center gap-2"><Bot size={16}/><span className="text-xs">AI {aiEnabled?'On':'Off'}</span></div></div><div className="flex-1 overflow-y-auto p-6 space-y-4">{selectedChat.history?.map((msg, i) => <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-white' : 'bg-indigo-600 text-white'}`}>{msg.text}</div></div>)}</div>
        <div className="p-4 bg-white border-t">
            <div className="mb-2 flex gap-2"><button onClick={generateGeminiReply} disabled={isGenerating} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 border border-indigo-200 transition-colors"><Sparkles size={12} /> {isGenerating ? 'Gemini 思考中...' : '使用 Gemini 生成回覆'}</button></div>
            <div className="flex gap-2"><input value={replyText} onChange={e=>setReplyText(e.target.value)} className="flex-1 border rounded-xl p-2"/><button onClick={handleSendMessage} className="bg-indigo-600 text-white p-2 rounded-xl"><Send size={20}/></button></div>
        </div></> : <div className="flex-1 flex items-center justify-center text-slate-400">選擇對話</div>}
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
    setConnectingId(activePlatform.id); setModalOpen(false);
    setTimeout(async () => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'platforms', activePlatform.id), { connected: true, accountName: accountName }); alert("連接成功！"); } catch(e) { console.error(e); } setConnectingId(null); setActivePlatform(null); }, 1500);
  };
  const initializePlatforms = async () => {
    setIsInitializing(true);
    try {
      const batch = writeBatch(db);
      INITIAL_PLATFORMS.forEach(p => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'platforms', p.id), p));
      INITIAL_CHATS.forEach(async c => await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), c));
      await batch.commit();
      alert("資料庫重置成功！"); window.location.reload();
    } catch (e) { console.error(e); } setIsInitializing(false);
  };
  const renderInputs = () => (<div><input className="w-full border p-2 rounded mb-4" placeholder="Enter Credentials"/><button onClick={()=>confirmConnection("Connected")} className="w-full bg-indigo-600 text-white py-2 rounded">確認</button></div>);
  
  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8 relative">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">平台整合</h1><button onClick={initializePlatforms} disabled={isInitializing} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold">{isInitializing ? '...' : '強制初始化資料'}</button></div>
      {!platforms || platforms.length===0 ? <div className="text-center py-20"><p className="mb-4 text-slate-500">目前沒有資料</p><button onClick={initializePlatforms} className="bg-indigo-600 text-white px-6 py-2 rounded-xl">立即寫入預設資料</button></div> : 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{platforms.map(p => <div key={p.id} className="bg-white p-6 rounded-xl border shadow-sm"><div className="flex justify-between mb-4"><div className="flex gap-3 items-center"><PlatformIcon platform={p.id} size={24}/><h3 className="font-bold">{p.name}</h3></div>{p.connected ? <button onClick={()=>handleDisconnect(p.id,p.id)} className="text-red-500"><Trash2/></button> : <button onClick={()=>handleConnectClick(p)} className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded text-sm font-bold">連接</button>}</div><p className="text-sm text-slate-500 mb-4">{p.description}</p>{p.connected && <div className="bg-slate-50 p-2 rounded text-sm flex gap-2 items-center"><CheckCircle size={14} className="text-green-500"/>{p.accountName}</div>}</div>)}</div>}
      {modalOpen && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-96"><div className="flex justify-between mb-4"><h3 className="font-bold">連接 {activePlatform?.name}</h3><button onClick={()=>setModalOpen(false)}><XIcon/></button></div>{renderInputs()}</div></div>}
    </div>
  );
};

const AIChatbotSettingsView = ({ aiConfig, knowledgeBase }) => {
  const [configForm, setConfigForm] = useState(aiConfig || INITIAL_AI_CONFIG);
  const [newKbItem, setNewKbItem] = useState({ keyword: '', content: '' });

  const handleSaveConfig = async () => {
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ai_settings', 'config'), configForm); alert("設定已儲存"); } catch (e) { console.error(e); }
  };
  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-6">AI 智能客服設定</h1>
      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <h2 className="font-bold mb-4 text-indigo-700">後端連接設定</h2>
        <div className="mb-4">
            <label className="block text-sm font-bold mb-1">後端伺服器網址 (Backend URL)</label>
            <input 
                className="w-full border rounded p-2 text-sm font-mono bg-slate-50" 
                placeholder="https://your-render-app.onrender.com"
                value={configForm.backendUrl || ''} 
                onChange={e => setConfigForm({...configForm, backendUrl: e.target.value})} 
            />
            <p className="text-xs text-slate-500 mt-1">請填入您在 Render 上部署的後端網址 (不含結尾斜線)</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="mb-4"><label className="block font-bold mb-1">系統提示詞 (System Prompt)</label><textarea className="w-full border rounded p-2" rows={3} value={configForm.systemPrompt} onChange={e => setConfigForm({...configForm, systemPrompt: e.target.value})} /></div>
        <button onClick={handleSaveConfig} className="bg-indigo-600 text-white px-4 py-2 rounded">儲存設定</button>
      </div>
    </div>
  );
};

const UserManagementView = ({ pendingUsers }) => <div className="p-8"><h1 className="text-2xl font-bold mb-4">用戶管理</h1><table className="w-full bg-white rounded shadow text-left"><thead className="bg-slate-50"><tr><th className="p-4">Email</th><th className="p-4">狀態</th></tr></thead><tbody>{pendingUsers.map(u=><tr key={u.id}><td className="p-4">{u.email}</td><td className="p-4">{u.status}</td></tr>)}</tbody></table></div>;
const AnalyticsView = ({ posts }) => <div className="p-8"><h1 className="text-2xl font-bold mb-4">分析</h1><div className="grid grid-cols-3 gap-4">{posts.map(p=><div key={p.id} className="bg-white p-4 rounded shadow"><p className="font-bold">{p.platform}</p><p>{p.content}</p></div>)}</div></div>;
const OrdersView = ({ orders }) => <div className="p-8"><h1 className="text-2xl font-bold mb-4">訂單</h1><table className="w-full bg-white rounded shadow text-left"><thead className="bg-slate-50"><tr><th className="p-4">ID</th><th className="p-4">金額</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td className="p-4">{o.displayId}</td><td className="p-4">{o.amount}</td></tr>)}</tbody></table></div>;
const DashboardView = ({ chats, orders }) => <div className="p-8"><h1 className="text-2xl font-bold mb-4">儀表板</h1><div className="grid grid-cols-2 gap-4"><div className="bg-white p-6 rounded shadow">訊息: {chats.length}</div><div className="bg-white p-6 rounded shadow">訂單: {orders.length}</div></div></div>;

const AuthScreen = ({ onLogin }) => {
  return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="bg-white p-8 rounded-xl text-center"><h1 className="text-2xl font-bold mb-4">OmniAI</h1><button onClick={()=>onLogin({role:'admin', username:'admin'})} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">登入系統</button></div></div>;
};

// --- Main App ---
const App = () => {
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState(null);
  const [data, setData] = useState({ chats: [], orders: [], platforms: [], users: [], posts: [], knowledgeBase: [], aiConfig: null });
  const [activeTab, setActiveTab] = useState('inbox');

  useEffect(() => {
    const init = async () => { try { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token); else await signInAnonymously(auth); } catch (e) { console.error(e); } };
    init(); return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const sync = (col, initial) => onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', col), snap => {
      if(snap.empty && initial) initial.forEach(i => col==='platforms'?setDoc(doc(db,'artifacts',appId,'public','data',col,i.id),i):addDoc(collection(db,'artifacts',appId,'public','data',col),i));
      setData(prev => ({...prev, [col==='app_users'?'users':col]: snap.docs.map(d=>({id:d.id, ...d.data()}))}));
    });
    const syncConfig = () => onSnapshot(doc(db,'artifacts',appId,'public','data','ai_settings','config'), s => {
        if(s.exists()) setData(p=>({...p, aiConfig: s.data()})); else setDoc(doc(db,'artifacts',appId,'public','data','ai_settings','config'), INITIAL_AI_CONFIG);
    });

    const u1=sync('chats', INITIAL_CHATS); const u2=sync('orders',[]); const u3=sync('platforms',INITIAL_PLATFORMS); 
    const u4=sync('posts',[]); const u5=sync('app_users',[]); const u6=sync('knowledge_base',INITIAL_KNOWLEDGE_BASE); const u7=syncConfig();
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); };
  }, [user]);

  if (!authData) return <AuthScreen onLogin={setAuthData} />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setAuthData(null)} isAdmin={authData.role === 'admin'} />
      <main className="flex-1 h-full overflow-hidden relative">
        {activeTab === 'inbox' && <InboxView chats={data.chats} activePlatformFilter={'all'} setActivePlatformFilter={()=>{}} aiConfig={data.aiConfig} />}
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