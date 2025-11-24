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

// --- Firebase Initialization ---
// [重要] 請在此填入您真實的 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC4CAw27pcOz-WwSkXDHFbksjaTRoGUYts", 
  authDomain: "omnisocial-728c9.firebaseapp.com",
  projectId: "omnisocial-728c9",
  storageBucket: "omnisocial-728c9.firebasestorage.app",
  messagingSenderId: "146517687086",
  appId: "1:117516494383:web:997586b9b2626f31c94633"
};

let app, auth, db;
let configError = false;

try {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("請填入")) {
    console.warn("尚未設定 Firebase Config");
    configError = true;
  } else {
    // 防止重複初始化
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

// --- Sub-Components (Defined BEFORE App) ---

const PlatformIcon = ({ platform, size = 16 }) => {
  const p = platform ? platform.toLowerCase() : '';
  if(p==='instagram') return <Instagram size={size} className="text-pink-600"/>;
  if(p==='facebook') return <Facebook size={size} className="text-blue-600"/>;
  if(p==='whatsapp') return <Phone size={size} className="text-green-500"/>;
  if(p==='website') return <Globe size={size} className="text-indigo-500"/>;
  return <MessageCircle size={size}/>;
};

// AuthScreen 定義在最上方
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: 'admin', password: 'password', email: '' });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // 模擬登入成功
    onLogin({role: 'admin', username: formData.username});
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? '登入 OmniAI' : '註冊'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full p-3 border rounded" placeholder="帳號" value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})}/>
          <input className="w-full p-3 border rounded" type="password" placeholder="密碼" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})}/>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded font-bold">{isLogin?'登入':'註冊'}</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-500">
           (測試帳號: admin / password)
        </div>
        <button onClick={()=>setIsLogin(!isLogin)} className="w-full mt-4 text-sm text-indigo-600 text-center block hover:underline">{isLogin?'註冊帳號':'返回登入'}</button>
      </div>
    </div>
  );
};

const SettingsView = ({ platforms }) => {
  const [isInitializing, setIsInitializing] = useState(false);

  const initializePlatforms = async () => {
    if(configError) return alert("Firebase 設定有誤，無法寫入");
    setIsInitializing(true);
    try {
      const batch = writeBatch(db);
      INITIAL_PLATFORMS.forEach(p => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'platforms', p.id), p));
      INITIAL_CHATS.forEach(async c => await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats'), c));
      await batch.commit();
      alert("初始化成功！正在重新整理...");
      window.location.reload();
    } catch (e) { console.error(e); alert("初始化失敗: " + e.message); }
    setIsInitializing(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">平台帳戶整合</h1>
        <button onClick={initializePlatforms} disabled={isInitializing} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 flex items-center gap-2">
          {isInitializing ? <RefreshCw className="animate-spin" size={16}/> : <AlertTriangle size={16}/>}
          {isInitializing ? '初始化中...' : '強制初始化資料'}
        </button>
      </div>
      {!platforms || platforms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">無資料</h3>
              <p className="mt-1 text-sm text-gray-500">資料庫目前是空的，請點擊上方按鈕初始化。</p>
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
              </div>
            ))}
          </div>
      )}
    </div>
  );
};

const DashboardView = ({ chats }) => <div className="p-8"><h1 className="text-2xl font-bold mb-4">儀表板</h1><div className="bg-white p-6 rounded shadow">總訊息數: {(chats||[]).length}</div></div>;
const InboxView = ({ chats }) => <div className="p-8"><h1 className="text-2xl font-bold mb-4">收件匣</h1><div className="bg-white p-6 rounded shadow">{(chats||[]).map(c=><div key={c.displayId} className="border-b p-2 mb-2">{c.user}: {c.lastMessage}</div>)}</div></div>;
const AnalyticsView = () => <div className="p-8"><h1 className="text-2xl font-bold">分析</h1><p>功能開發中...</p></div>;
const OrdersView = () => <div className="p-8"><h1 className="text-2xl font-bold">訂單</h1><p>功能開發中...</p></div>;
const AIChatbotSettingsView = () => <div className="p-8"><h1 className="text-2xl font-bold">AI 設定</h1><p>功能開發中...</p></div>;
const UserManagementView = () => <div className="p-8"><h1 className="text-2xl font-bold">用戶管理</h1><p>功能開發中...</p></div>;

// --- Main App Component ---
const App = () => {
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [data, setData] = useState({ chats: [], platforms: [] });

  // Auth
  useEffect(() => {
    if (configError || !auth) return;
    signInAnonymously(auth).catch(e => console.error("Auth Error:", e));
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Data Sync
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

  // Error Screen
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
      case 'inbox': return <InboxView chats={data.chats} />;
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
};

export default App;