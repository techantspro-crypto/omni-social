import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, ShoppingBag, BarChart2, Settings, Search, Send, Bot, Filter, TrendingUp, Users, Eye, CheckCircle, Menu, X as XIcon, MessageCircle, Instagram, Facebook, Youtube, Twitter, Image as ImageIcon, Phone, Paperclip, Link2, Trash2, Shield, Smartphone, Key, QrCode, LogOut, UserPlus, Lock, Mail, User, FileText, ShieldCheck, Globe, RefreshCw, Server, ArrowRight, Database, Video, Chrome, Brain, Zap, Plus, Edit, Save, Cpu
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, getDocs, setDoc, deleteDoc, orderBy, getDoc } from 'firebase/firestore';

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

// --- Firebase Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// [FIX] Sanitize appId to remove slashes which break Firestore collection paths
// Example: "c_..._frontend/OmniSocialApp.jsx-584" -> "c_..._frontend_OmniSocialApp.jsx-584"
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const appId = rawAppId.replace(/\//g, '_');

// --- UI Components ---

const PlatformIcon = ({ platform, size = 16, className="" }) => {
  const styleClass = `inline-block align-middle ${className}`;
  // Safe check for platform incase it's undefined
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
      <div className="p-6 font-bold text-2xl flex items-center gap-2 text-indigo-400">
        <Bot size={32} /><span className="hidden md:block">OmniAI</span>
      </div>
      <nav className="flex-1 mt-6">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center p-4 hover:bg-slate-800 transition-colors ${activeTab === item.id ? 'bg-indigo-600 border-r-4 border-indigo-300' : 'text-slate-400'}`}>
            <item.icon size={24} /><span className="ml-4 hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button onClick={() => setActiveTab('settings')} className={`flex items-center w-full p-2 transition-colors ${activeTab === 'settings' ? 'text-white bg-slate-800 rounded-lg' : 'text-slate-400 hover:text-white'}`}>
          <Settings size={20} /><span className="ml-4 hidden md:block">平台串接</span>
        </button>
        <button onClick={onLogout} className="flex items-center w-full p-2 text-red-400 hover:text-red-300 transition-colors">
          <LogOut size={20} /><span className="ml-4 hidden md:block">登出</span>
        </button>
      </div>
    </div>
  );
};

const InboxView = ({ chats, activePlatformFilter, setActivePlatformFilter, currentUserId }) => {
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

// --- Settings View (Complete Logic) ---
const SettingsView = ({ platforms }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState(null);
  const [connectingId, setConnectingId] = useState(null);

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
      } catch(e) { console.error(e); }
      setConnectingId(null);
      setActivePlatform(null);
    }, 1500);
  };

  const renderInputs = () => {
    if (!activePlatform) return null;
    if (activePlatform.type === 'oauth') return <div className="space-y-4"><div><label className="block text-xs font-bold mb-1">App ID</label><input className="w-full p-2 border rounded bg-slate-50"/></div><button onClick={() => confirmConnection("@connected")} className="w-full bg-blue-600 text-white py-2 rounded font-bold">前往官方授權</button></div>;
    if (activePlatform.type === 'webhook') return <div className="space-y-4"><div><label className="block text-xs font-bold mb-1">Shop URL</label><input className="w-full p-2 border rounded bg-slate-50"/></div><button onClick={() => confirmConnection("myshop.com")} className="w-full bg-indigo-600 text-white py-2 rounded font-bold">連接商店</button></div>;
    if (activePlatform.type === 'qr') return <div className="text-center"><div className="border p-4 inline-block mb-4"><QrCode size={64}/></div><button onClick={() => confirmConnection("Scanned")} className="w-full bg-slate-800 text-white py-2 rounded font-bold">完成掃描</button>{activePlatform.id==='whatsapp' && <div className="mt-4 pt-4 border-t text-left"><div className="text-xs font-bold mb-2">或使用 API</div><input placeholder="Phone ID" className="w-full p-2 border rounded mb-2 text-sm"/><button onClick={() => confirmConnection("API")} className="w-full bg-green-600 text-white py-1 rounded text-sm">API 連接</button></div>}</div>;
    return <div><input placeholder="Token" className="w-full p-2 border rounded mb-4"/><button onClick={() => confirmConnection("Bot")} className="w-full bg-sky-500 text-white py-2 rounded font-bold">驗證</button></div>;
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8 relative">
      <h1 className="text-2xl font-bold mb-6">平台帳戶整合</h1>
      <div className="grid grid-cols-2 gap-6">{platforms.map(p => <div key={p.id} className="bg-white p-6 rounded-xl border shadow-sm"><div className="flex justify-between mb-4"><div className="flex gap-3 items-center"><PlatformIcon platform={p.id} size={24}/><h3 className="font-bold">{p.name}</h3></div>{p.connected ? <button onClick={() => handleDisconnect(p.id, p.id)} className="text-red-500"><Trash2/></button> : <button onClick={() => handleConnectClick(p)} className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded font-bold text-sm">連接</button>}</div><p className="text-sm text-slate-500 mb-4">{p.description}</p>{p.connected ? <div className="bg-slate-50 p-2 rounded flex gap-2 text-sm items-center"><CheckCircle size={14} className="text-green-500"/>{p.accountName}</div> : <div className="text-center p-2 border border-dashed rounded text-xs text-slate-400">未設定</div>}{connectingId===p.id && <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-bold text-indigo-600">連接中...</div>}</div>)}</div>
      {modalOpen && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-xl w-96"><div className="flex justify-between mb-4"><h3 className="font-bold">連接 {activePlatform?.name}</h3><button onClick={() => setModalOpen(false)}><XIcon/></button></div>{renderInputs()}</div></div>}
    </div>
  );
};

// --- Auth Screen (With Google Icon) ---
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', name: '', email: '', reason: '' });
  
  const handleSocial = async (provider) => {
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), where("email", "==", `demo.${provider}@example.com`));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const user = snap.docs[0].data();
        if (user.status === 'approved') onLogin(user); else alert("審核中");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), { name: `${provider} User`, email: `demo.${provider}@example.com`, role: 'user', status: 'pending', date: new Date().toLocaleDateString() });
        alert("申請已提交，請等待審核");
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl flex overflow-hidden max-w-4xl w-full shadow-2xl">
        <div className="w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-center"><Bot size={48} className="mb-4"/><h1 className="text-4xl font-bold mb-4">OmniAI</h1><p>全通路社群整合自動化行銷平台</p></div>
        <div className="w-1/2 p-12">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">{isLogin ? '歡迎回來' : '申請註冊'}</h2>
          <div className="space-y-4 mb-6">
            <input placeholder="帳號" className="w-full p-3 border rounded-xl" value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})}/>
            <input type="password" placeholder="密碼" className="w-full p-3 border rounded-xl" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})}/>
            {!isLogin && <><input placeholder="Email" className="w-full p-3 border rounded-xl" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/><textarea placeholder="申請理由" className="w-full p-3 border rounded-xl" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})}/></>}
            <button onClick={() => isLogin ? onLogin({role:'admin', username:'admin'}) : alert("申請已提交")} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">{isLogin?'登入':'提交'}</button>
          </div>
          {isLogin && <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => handleSocial('google')} className="border p-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 font-bold text-slate-600">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.642h6.455c-.278 1.504-1.124 2.779-2.396 3.632v3.02h3.88c2.27-2.09 3.58-5.166 3.58-8.839z" fill="#4285F4"/><path d="M12 24c3.24 0 5.957-1.074 7.942-2.909l-3.88-3.02c-1.075.72-2.451 1.146-4.062 1.146-3.127 0-5.776-2.112-6.722-4.952H1.295v3.116C3.263 21.294 7.347 24 12 24z" fill="#34A853"/><path d="M5.278 14.265c-.248-.743-.389-1.536-.389-2.365 0-.829.141-1.622.389-2.365V6.419H1.295C.47 8.066 0 9.93 0 12c0 2.07.47 3.934 1.295 5.581l3.983-3.116z" fill="#FBBC05"/><path d="M12 4.773c1.762 0 3.345.606 4.589 1.796l3.443-3.443C17.952 1.187 15.235 0 12 0 7.347 0 3.263 2.706 1.295 6.419l3.983 3.116c.946-2.84 3.595-4.952 6.722-4.952z" fill="#EA4335"/></svg> Google
            </button>
            <button onClick={() => handleSocial('facebook')} className="border p-2 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 font-bold text-slate-600"><Facebook size={18} className="text-blue-600"/> Facebook</button>
          </div>}
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-slate-500 text-sm">{isLogin ? '註冊新帳號' : '返回登入'}</button>
        </div>
      </div>
    </div>
  );
};

const AIChatbotSettingsView = ({ aiConfig, knowledgeBase }) => {
  const [configForm, setConfigForm] = useState(aiConfig || INITIAL_AI_CONFIG);
  const [newKbItem, setNewKbItem] = useState({ keyword: '', content: '' });

  const handleSaveConfig = async () => {
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'ai_settings', 'config'), configForm); alert("儲存成功"); } catch (e) { console.error(e); }
  };
  const handleAddKbItem = async () => {
    if (!newKbItem.keyword) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'knowledge_base'), newKbItem);
    setNewKbItem({ keyword: '', content: '' });
  };
  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-6">AI 智能客服設定</h1>
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="mb-4"><label className="block font-bold mb-1">系統提示詞 (System Prompt)</label><textarea className="w-full border rounded p-2" rows={3} value={configForm.systemPrompt} onChange={e => setConfigForm({...configForm, systemPrompt: e.target.value})} /></div>
        <button onClick={handleSaveConfig} className="bg-indigo-600 text-white px-4 py-2 rounded">儲存設定</button>
      </div>
      <div className="mt-8 bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="font-bold mb-4">知識庫 (RAG)</h2>
        <div className="flex gap-2 mb-4"><input placeholder="關鍵字" className="border p-2 rounded" value={newKbItem.keyword} onChange={e=>setNewKbItem({...newKbItem, keyword: e.target.value})} /><input placeholder="回應內容" className="flex-1 border p-2 rounded" value={newKbItem.content} onChange={e=>setNewKbItem({...newKbItem, content: e.target.value})} /><button onClick={handleAddKbItem} className="bg-green-600 text-white px-4 rounded"><Plus/></button></div>
        {knowledgeBase.map(k => <div key={k.id} className="border-b py-2 flex justify-between"><span>{k.keyword}: {k.content}</span></div>)}
      </div>
    </div>
  );
};

const UserManagementView = ({ pendingUsers }) => {
  return <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-8"><h1 className="text-2xl font-bold text-slate-800 mb-2">用戶管理</h1><div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b"><tr><th className="p-4">姓名</th><th className="p-4">Email</th><th className="p-4">狀態</th></tr></thead><tbody>{pendingUsers.map(u => <tr key={u.id}><td className="p-4">{u.name}</td><td className="p-4">{u.email}</td><td className="p-4">{u.status}</td></tr>)}</tbody></table></div></div>;
};

const AnalyticsView = ({ posts }) => {
  const [filterType, setFilterType] = useState('all');
  const [viewThreshold, setViewThreshold] = useState(10000); 
  const filteredPosts = useMemo(() => posts.filter(post => (filterType === 'all' || post.platform === filterType) && post.views >= viewThreshold), [posts, filterType, viewThreshold]);
  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-8">
      <div className="mb-8"><h1 className="text-2xl font-bold text-slate-800 mb-2">爆文與趨勢分析</h1><p className="text-slate-500">針對高流量內容進行 AI 語意與情緒分析。</p></div>
      <div className="flex flex-wrap gap-4 mb-6 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2"><Filter size={18} className="text-slate-500" /><span className="text-sm font-medium text-slate-700">平台:</span><select className="bg-slate-100 border-none rounded-lg text-sm py-1.5" value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="all">全部</option><option value="instagram">Instagram</option><option value="threads">Threads</option><option value="tiktok">TikTok</option></select></div>
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200"><TrendingUp size={16} className="text-red-500 ml-1" /><span className="text-sm font-medium text-slate-700">觀看數 &ge;</span><input type="number" value={viewThreshold} onChange={(e) => setViewThreshold(Number(e.target.value))} className="w-24 px-2 py-1 bg-white border rounded text-sm" step="1000" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map(post => (
          <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="relative h-48 bg-slate-200">{post.image ? <img src={post.image} alt="Post" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">Text</div>}<div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1"><PlatformIcon platform={post.platform} /><span className="capitalize">{post.platform}</span></div></div>
            <div className="p-4 flex-1 flex flex-col"><p className="text-slate-800 font-medium mb-3 line-clamp-2">{post.content}</p><div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-auto"><div className="flex items-center gap-2 mb-1"><Bot size={14} className="text-indigo-600" /><span className="text-xs font-bold text-indigo-700">AI 分析</span></div><p className="text-xs text-indigo-900 leading-relaxed">{post.aiAnalysis}</p></div></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OrdersView = ({ orders }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSync = async () => { setIsSyncing(true); setTimeout(() => { setIsSyncing(false); alert("同步完成"); }, 1000); };
  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-8">
      <div className="flex justify-between items-end mb-8"><div><h1 className="text-2xl font-bold text-slate-800 mb-2">訂單自動抓取</h1><p className="text-slate-500">監控關鍵字並自動建立訂單。</p></div><div className="flex gap-3"><button onClick={handleSync} disabled={isSyncing} className="bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg flex items-center gap-2">{isSyncing ? '同步中...' : '同步至官網'}</button></div></div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4 text-sm">訂單編號</th><th className="p-4 text-sm">客戶</th><th className="p-4 text-sm">來源</th><th className="p-4 text-sm">商品</th><th className="p-4 text-sm">金額</th><th className="p-4 text-sm">狀態</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.map(order => (<tr key={order.id}><td className="p-4 font-mono text-sm">{order.displayId}</td><td className="p-4 font-medium">{order.customer}</td><td className="p-4 text-sm flex items-center gap-1"><PlatformIcon platform={order.source.toLowerCase().includes("thread") ? "threads" : "facebook"} size={12}/>{order.source}</td><td className="p-4 text-sm">{order.item}</td><td className="p-4 font-medium">NT$ {order.amount}</td><td className="p-4"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{order.status}</span></td></tr>))}</tbody></table>
      </div>
    </div>
  );
};

const DashboardView = ({ chats, orders }) => {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">今日概況</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><div className="flex items-center justify-between mb-4"><div className="bg-blue-100 p-2 rounded-lg text-blue-600"><MessageSquare size={20} /></div><span className="text-xs font-bold text-green-500">Live</span></div><h3 className="text-slate-500 text-sm mb-1">待回覆訊息</h3><p className="text-2xl font-bold text-slate-800">{chats.reduce((acc, c) => acc + (c.unread || 0), 0)}</p></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><div className="flex items-center justify-between mb-4"><div className="bg-orange-100 p-2 rounded-lg text-orange-600"><ShoppingBag size={20} /></div><span className="text-xs font-bold text-green-500">+18%</span></div><h3 className="text-slate-500 text-sm mb-1">銷售額</h3><p className="text-2xl font-bold text-slate-800">NT$ {(orders.reduce((acc, o) => acc + o.amount, 0)/1000).toFixed(1)}k</p></div>
      </div>
    </div>
  );
};

// --- Main App Wrapper ---
const App = () => {
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState(null);
  const [data, setData] = useState({ chats: [], orders: [], platforms: [], users: [], posts: [], knowledgeBase: [], aiConfig: null });
  const [activeTab, setActiveTab] = useState('inbox');

  // Auth Init
  useEffect(() => {
    const init = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Data Sync
  useEffect(() => {
    if (!user) return;

    const syncCollection = (col, initial) => onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', col), snap => {
      if (snap.empty && initial) initial.forEach(i => col==='platforms'?setDoc(doc(db,'artifacts',appId,'public','data',col,i.id),i):addDoc(collection(db,'artifacts',appId,'public','data',col),i));
      setData(prev => ({...prev, [col==='app_users'?'users':col]: snap.docs.map(d => ({id:d.id, ...d.data()}))}));
    });

    const syncAiConfig = () => {
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'ai_settings', 'config');
      return onSnapshot(configRef, async (docSnap) => {
        if (!docSnap.exists()) {
          await setDoc(configRef, INITIAL_AI_CONFIG);
          setData(prev => ({ ...prev, aiConfig: INITIAL_AI_CONFIG }));
        } else {
          setData(prev => ({ ...prev, aiConfig: docSnap.data() }));
        }
      });
    };

    const unsubChats = syncCollection('chats', INITIAL_CHATS);
    const unsubOrders = syncCollection('orders', []);
    const unsubPlatforms = syncCollection('platforms', INITIAL_PLATFORMS); 
    const unsubPosts = syncCollection('posts', []); 
    const unsubUsers = syncCollection('app_users', []); 
    const unsubKB = syncCollection('knowledge_base', []);
    const unsubConfig = syncAiConfig();

    return () => {
      unsubChats(); unsubOrders(); unsubPosts(); unsubUsers(); unsubPlatforms(); unsubKB(); unsubConfig();
    };
  }, [user]);

  const handleLogin = (userData) => { setCurrentUser(userData); setIsAuthenticated(true); setActiveTab('inbox'); };

  // Re-using logic for auth state
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