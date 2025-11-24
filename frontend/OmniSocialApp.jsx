import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, ShoppingBag, BarChart2, Settings, Search, Send, Bot, Filter, TrendingUp, Users, Eye, CheckCircle, Menu, X as XIcon, MessageCircle, Instagram, Facebook, Youtube, Twitter, Image as ImageIcon, Phone, Paperclip, Link2, Trash2, Shield, Smartphone, Key, QrCode, LogOut, UserPlus, Lock, Mail, User, FileText, ShieldCheck, Globe, RefreshCw, Server, ArrowRight, Database, Video, Chrome, Brain, Zap, Plus, Edit, Save, Cpu, AlertTriangle, Sparkles
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, getDocs, setDoc, deleteDoc, orderBy, getDoc, writeBatch } from 'firebase/firestore';

// --- 1. 靜態資料 (Initial Data) ---
const INITIAL_CHATS = [
  { displayId: 1, user: "Amy Chen", platform: "instagram", avatar: "https://i.pravatar.cc/150?u=1", lastMessage: "請問這個紅色包包還有現貨嗎？", timestamp: "10:23 AM", unread: 2, history: [{ sender: "user", text: "你好，我看這款很久了" }, { sender: "user", text: "請問這個紅色包包還有現貨嗎？" }] },
  { displayId: 2, user: "Jason Wu", platform: "facebook", avatar: "https://i.pravatar.cc/150?u=2", lastMessage: "你們的營業時間是幾點？", timestamp: "09:15 AM", unread: 0, history: [{ sender: "user", text: "嗨" }, { sender: "user", text: "你們的營業時間是幾點？" }, { sender: "ai", text: "您好！我們的營業時間是週一至週五，早上10點到晚上9點。" }] }
];
const INITIAL_PLATFORMS = [
  { id: 'website', name: '自家官網', type: 'webhook', description: '連接 Shopify/WooCommerce', connected: false, accountName: null },
  { id: 'instagram', name: 'Instagram', type: 'oauth', description: '連接 Instagram 商業帳號', connected: true, accountName: '@amy_style' },
  { id: 'facebook', name: 'Facebook', type: 'oauth', description: '同步粉絲專頁訊息', connected: true, accountName: 'Amy Shop' },
  { id: 'threads', name: 'Threads', type: 'oauth', description: '同步 Threads 串文', connected: false, accountName: null },
  { id: 'twitter', name: 'X (Twitter)', type: 'oauth', description: '即時監控推文', connected: true, accountName: '@amy_tw' },
  { id: 'tiktok', name: 'TikTok', type: 'oauth', description: '連接 TikTok 商業帳號', connected: false, accountName: null },
  { id: 'xiaohongshu', name: '小紅書', type: 'qr', description: '掃描 QR Code 登入', connected: false, accountName: null },
  { id: 'whatsapp', name: 'WhatsApp', type: 'qr', description: '連接 WhatsApp Business', connected: true, accountName: '+886 912...' },
  { id: 'telegram', name: 'Telegram', type: 'token', description: '輸入 Bot Token', connected: false, accountName: null },
  { id: 'youtube', name: 'YouTube', type: 'oauth', description: '管理頻道留言', connected: false, accountName: null },
];
const INITIAL_AI_CONFIG = { id: 'config', provider: 'openai', apiKey: '', model: 'gpt-4o', systemPrompt: '你是一個專業客服。', temperature: 0.7 };
const INITIAL_KNOWLEDGE_BASE = [{ keyword: '營業時間', content: '週一至週五 10:00-21:00' }];

// --- 2. Firebase 設定 (請填入真實資料) ---
const firebaseConfig = {
  apiKey: "AIzaSyC4CAw27pcOz-WwSkXDHFbksjaTRoGUYts",
  authDomain: "omnisocial-728c9.firebaseapp.com",
  projectId: "omnisocial-728c9",
  storageBucket: "omnisocial-728c9.firebasestorage.app",
  messagingSenderId: "146517687086",
  appId: "1:146517687086:web:f368ee90f466c5022958bf"
};

let app, auth, db;
let configError = false;

try {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("請在此處")) {
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
  console.error("Firebase Init Error:", error);
  configError = true;
}

const rawAppId = typeof __app_id !== 'undefined' ? String(__app_id) : 'default-app-id';
const appId = rawAppId.replace(/\//g, '_');

// --- 3. 子元件定義 (必須在 App 之前！) ---

// 3.1 圖示元件
function PlatformIcon({ platform, size = 16 }) {
  const p = platform ? platform.toLowerCase() : '';
  if(p==='instagram') return <Instagram size={size} className="text-pink-600"/>;
  if(p==='facebook') return <Facebook size={size} className="text-blue-600"/>;
  if(p==='whatsapp') return <Phone size={size} className="text-green-500"/>;
  if(p==='website') return <Globe size={size} className="text-indigo-500"/>;
  return <MessageCircle size={size}/>;
}

// 3.2 登入畫面 (解決 ReferenceError 的關鍵)
function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: 'admin', password: 'password', email: '' });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // 模擬登入成功，直接進入系統
    onLogin({role: 'admin', username: formData.username});
  };

  const handleSocial = async (provider) => {
     // 模擬社群登入
     onLogin({role: 'user', username: `${provider}_user`});
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl w-full max-w-md text-center">
        <div className="mb-6 flex justify-center"><Bot size={48} className="text-indigo-600"/></div>
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{isLogin ? '登入 OmniAI' : '註冊'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full p-3 border rounded-xl" placeholder="帳號 (admin)" value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})}/>
          <input className="w-full p-3 border rounded-xl" type="password" placeholder="密碼 (password)" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})}/>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">{isLogin?'登入':'註冊'}</button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">或使用社群帳號</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <button onClick={() => handleSocial('google')} className="border p-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 font-bold text-slate-600">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.642h6.455c-.278 1.504-1.124 2.779-2.396 3.632v3.02h3.88c2.27-2.09 3.58-5.166 3.58-8.839z" fill="#4285F4"/><path d="M12 24c3.24 0 5.957-1.074 7.942-2.909l-3.88-3.02c-1.075.72-2.451 1.146-4.062 1.146-3.127 0-5.776-2.112-6.722-4.952H1.295v3.116C3.263 21.294 7.347 24 12 24z" fill="#34A853"/><path d="M5.278 14.265c-.248-.743-.389-1.536-.389-2.365 0-.829.141-1.622.389-2.365V6.419H1.295C.47 8.066 0 9.93 0 12c0 2.07.47 3.934 1.295 5.581l3.983-3.116z" fill="#FBBC05"/><path d="M12 4.773c1.762 0 3.345.606 4.589 1.796l3.443-3.443C17.952 1.187 15.235 0 12 0 7.347 0 3.263 2.706 1.295 6.419l3.983 3.116c.946-2.84 3.595-4.952 6.722-4.952z" fill="#EA4335"/></svg> Google
           </button>
           <button onClick={() => handleSocial('facebook')} className="border p-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 font-bold text-slate-600"><Facebook size={18} className="text-blue-600"/> Facebook</button>
        </div>
        
        <button onClick={()=>setIsLogin(!isLogin)} className="w-full mt-6 text-sm text-slate-400 hover:text-indigo-600">{isLogin ? '註冊新帳號' : '返回登入'}</button>
      </div>
    </div>
  );
}

// 3.3 設定介面
function SettingsView({ platforms }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleConnectClick = (platform) => { setActivePlatform(platform); setModalOpen(true); };
  const handleDisconnect = async (id, docId) => { if (confirm("解除連接？")) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'platforms', docId), { connected: false, accountName: null }); };
  
  const confirmConnection = async (accountName) => {
    if (!activePlatform) return;
    setModalOpen(false);
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'platforms', activePlatform.id), { connected: true, accountName: accountName });
        alert(`${activePlatform.name} 連接成功！`);
      } catch(e) { console.error(e); alert("連接失敗"); }
      setActivePlatform(null);
    }, 1000);
  };

  const initializePlatforms = async () => {
    setIsInitializing(true);
    try {
      const batch = writeBatch(db);
      INITIAL_PLATFORMS.forEach(p => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'platforms', p.id), p));
      INITIAL_CHATS.forEach(async c => await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), c));
      await batch.commit();
      alert("初始化成功！請重新整理頁面。");
      window.location.reload();
    } catch (e) { console.error(e); alert("初始化失敗: " + e.message); }
    setIsInitializing(false);
  };

  const renderInputs = () => (<div><input className="w-full border p-2 rounded mb-4" placeholder="輸入憑證"/><button onClick={()=>confirmConnection("Connected")} className="w-full bg-indigo-600 text-white py-2 rounded">確認</button></div>);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">平台帳戶整合</h1>
        <button onClick={initializePlatforms} disabled={isInitializing} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 flex items-center gap-2">
          {isInitializing ? <RefreshCw className="animate-spin" size={16}/> : <AlertTriangle size={16}/>}
          強制初始化資料
        </button>
      </div>
      {!platforms || platforms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">無資料</h3>
              <p className="mt-1 text-sm text-gray-500">資料庫目前是空的，請點擊右上角按鈕進行初始化。</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platforms.map(p => (
              <div key={p.id} className="bg-white p-6 rounded shadow border">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2"><PlatformIcon platform={p.id} size={24}/><span className="font-bold">{p.name}</span></div>
                  <span className={`text-xs px-2 py-1 rounded ${p.connected?'bg-green-100 text-green-700':'bg-slate-100'}`}>{p.connected?'已連接':'未連接'}</span>
                </div>
                <p className="text-sm text-slate-500">{p.description}</p>
                {!p.connected && <button onClick={()=>handleConnectClick(p)} className="mt-4 w-full bg-indigo-50 text-indigo-600 py-2 rounded text-sm font-bold">連接</button>}
                {p.connected && <button onClick={()=>handleDisconnect(p.id, p.id)} className="mt-4 w-full text-red-500 border border-red-200 py-2 rounded text-sm">解除連接</button>}
              </div>
            ))}
          </div>
      )}
      {modalOpen && activePlatform && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-96"><h3 className="font-bold mb-4">連接 {activePlatform.name}</h3><div className="mb-4">{renderInputs()}</div><button onClick={()=>setModalOpen(false)} className="w-full mt-2 text-slate-500">取消</button></div></div>}
    </div>
  );
}

// 3.4 其他視圖元件
const DashboardView = ({ chats }) => <div className="p-8"><h1 className="text-2xl font-bold mb-4">儀表板</h1><div className="bg-white p-6 rounded shadow">總訊息數: {(chats||[]).length}</div></div>;

const InboxView = ({ chats, activePlatformFilter, setActivePlatformFilter }) => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => { if (!selectedChatId && chats.length > 0) setSelectedChatId(chats[0].id); }, [chats, selectedChatId]);
  const displayedChats = chats.filter(chat => activePlatformFilter === 'all' || chat.platform === activePlatformFilter);
  const selectedChat = chats.find(c => c.id === selectedChatId);

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedChat) return;
    const chatRef = doc(db, 'artifacts', appId, 'public', 'data', 'chats', selectedChat.id);
    await updateDoc(chatRef, { history: [...selectedChat.history, { sender: 'admin', text: replyText }], lastMessage: "您: " + replyText, timestamp: new Date().toLocaleTimeString(), unread: 0 });
    setReplyText("");
  };

  // 簡單自動回覆 (移除 Gemini, 回歸基礎)
  const handleAutoReply = () => {
      if(!selectedChat) return;
      let reply = "您好，專人稍後會為您服務。";
      if(selectedChat.lastMessage.includes("營業時間")) reply = "我們的營業時間是週一至週五 10:00-21:00。";
      else if(selectedChat.lastMessage.includes("現貨")) reply = "目前這款商品還有現貨喔！";
      setReplyText(reply);
  };

  return (
    <div className="flex h-full bg-slate-50">
      <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200"><h2 className="text-lg font-bold text-slate-800 mb-3">訊息中心</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide -mx-1 px-1">{['all', 'instagram', 'facebook', 'whatsapp'].map(p => <button key={p} onClick={() => setActivePlatformFilter(p)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${activePlatformFilter === p ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>{p}</button>)}</div>
        </div>
        <div className="flex-1 overflow-y-auto">{displayedChats.map(chat => <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`p-4 flex items-start cursor-pointer ${selectedChatId === chat.id ? 'bg-indigo-50' : ''}`}><img src={chat.avatar} className="w-10 h-10 rounded-full"/><div className="ml-3 flex-1"><div className="font-bold text-sm">{chat.user}</div><div className="text-xs text-slate-500">{chat.lastMessage}</div></div></div>)}</div>
      </div>
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedChat ? <><div className="p-4 bg-white border-b border-slate-200 flex justify-between"><h3 className="font-bold">{selectedChat.user}</h3></div><div className="flex-1 overflow-y-auto p-6 space-y-4">{selectedChat.history?.map((msg, idx) => <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-white border border-slate-200' : 'bg-indigo-600 text-white'}`}>{msg.text}</div></div>)}</div><div className="p-4 bg-white border-t"><div className="mb-2"><button onClick={handleAutoReply} className="text-xs bg-slate-100 px-3 py-1 rounded hover:bg-slate-200">快速回覆：常見問題</button></div><div className="flex gap-2"><input value={replyText} onChange={e=>setReplyText(e.target.value)} className="flex-1 border rounded-xl p-2"/><button onClick={handleSendMessage} className="bg-indigo-600 text-white p-2 rounded-xl"><Send size={20}/></button></div></div></> : <div className="flex-1 flex items-center justify-center text-slate-400">選擇對話</div>}
      </div>
    </div>
  );
};

const AnalyticsView = () => <div className="p-8"><h1 className="text-2xl font-bold">分析 (開發中)</h1></div>;
const OrdersView = () => <div className="p-8"><h1 className="text-2xl font-bold">訂單 (開發中)</h1></div>;
const AIChatbotSettingsView = () => <div className="p-8"><h1 className="text-2xl font-bold">AI 設定 (開發中)</h1></div>;
const UserManagementView = () => <div className="p-8"><h1 className="text-2xl font-bold">用戶管理 (開發中)</h1></div>;

// --- 4. 主應用程式 (Main App) ---
function App() {
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [data, setData] = useState({ chats: [], platforms: [] });

  useEffect(() => {
    if (configError) return;
    const init = async () => { try { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token); else await signInAnonymously(auth); } catch (e) { console.error(e); } };
    init(); return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || configError || !db) return;
    const unsubPlatforms = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'platforms'), snap => {
      setData(prev => ({...prev, platforms: snap.docs.map(d => ({id:d.id, ...d.data()}))}));
    });
    const unsubChats = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), snap => {
      setData(prev => ({...prev, chats: snap.docs.map(d => ({id:d.id, ...d.data()}))}));
    });
    return () => { unsubPlatforms(); unsubChats(); };
  }, [user]);

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-8">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-4">設定錯誤</h1>
          <p className="text-slate-600 mb-4">請檢查程式碼中的 <code>firebaseConfig</code> 設定。</p>
        </div>
      </div>
    );
  }

  if (!authData) return <AuthScreen onLogin={setAuthData} />;

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <DashboardView chats={data.chats} />;
      case 'inbox': return <InboxView chats={data.chats} activePlatformFilter={'all'} setActivePlatformFilter={()=>{}} />;
      case 'settings': return <SettingsView platforms={data.platforms} />;
      case 'analytics': return <AnalyticsView />;
      case 'orders': return <OrdersView />;
      case 'ai_settings': return <AIChatbotSettingsView />;
      case 'users': return <UserManagementView />;
      default: return <InboxView chats={data.chats} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col h-full shrink-0">
        <div className="p-6 font-bold text-2xl flex items-center gap-2 text-indigo-400"><Bot size={32} /><span>OmniAI</span></div>
        <nav className="flex-1 mt-6 px-2 space-y-1">
            {[
              {id:'dashboard', label:'儀表板', icon: BarChart2},
              {id:'inbox', label:'收件匣', icon: MessageSquare},
              {id:'settings', label:'平台串接', icon: Settings},
              {id:'analytics', label:'分析', icon: TrendingUp},
              {id:'orders', label:'訂單', icon: ShoppingBag},
              {id:'ai_settings', label:'AI 設定', icon: Brain},
              {id:'users', label:'用戶管理', icon: Users},
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center p-3 rounded text-left ${activeTab===item.id ? 'bg-indigo-600' : 'hover:bg-slate-800 text-slate-400'}`}>
                <item.icon size={20} className="mr-3"/> {item.label}
              </button>
            ))}
        </nav>
        <div className="p-4"><button onClick={()=>setAuthData(null)} className="w-full flex items-center p-2 text-red-400"><LogOut size={20} className="mr-3"/> 登出</button></div>
      </aside>
      <main className="flex-1 h-full overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;