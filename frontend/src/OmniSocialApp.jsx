<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmniSocial AI Platform</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; }
        .chart-container { position: relative; height: 300px; width: 100%; }
        /* 自定義捲軸 */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="text-slate-800 h-screen overflow-hidden flex">

    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-white flex flex-col h-full shrink-0 transition-all duration-300" id="sidebar">
        <div class="p-6 font-bold text-2xl flex items-center gap-2 text-indigo-400">
            <i data-lucide="bot" class="w-8 h-8"></i>
            <span>OmniAI</span>
        </div>
        
        <nav class="flex-1 mt-6 px-2 space-y-1">
            <button onclick="switchTab('dashboard')" class="nav-item w-full flex items-center p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400" id="nav-dashboard">
                <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                <span class="ml-3 font-medium">總覽儀表板</span>
            </button>
            <button onclick="switchTab('inbox')" class="nav-item w-full flex items-center p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400" id="nav-inbox">
                <i data-lucide="message-square" class="w-5 h-5"></i>
                <span class="ml-3 font-medium">統一收件匣</span>
            </button>
            <button onclick="switchTab('analytics')" class="nav-item w-full flex items-center p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400" id="nav-analytics">
                <i data-lucide="trending-up" class="w-5 h-5"></i>
                <span class="ml-3 font-medium">爆文與分析</span>
            </button>
            <button onclick="switchTab('orders')" class="nav-item w-full flex items-center p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400" id="nav-orders">
                <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                <span class="ml-3 font-medium">訂單管理</span>
            </button>
            <button onclick="switchTab('settings')" class="nav-item w-full flex items-center p-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-400" id="nav-settings">
                <i data-lucide="settings" class="w-5 h-5"></i>
                <span class="ml-3 font-medium">平台串接設定</span>
            </button>
        </nav>

        <div class="p-4 border-t border-slate-800">
            <button class="flex items-center w-full p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-slate-800">
                <i data-lucide="log-out" class="w-5 h-5"></i>
                <span class="ml-3">登出</span>
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 h-full overflow-hidden relative flex flex-col">
        <!-- Header (Mobile only) -->
        <div class="md:hidden bg-white border-b p-4 flex items-center justify-between">
            <div class="font-bold text-indigo-600 flex items-center gap-2">
                <i data-lucide="bot"></i> OmniAI
            </div>
            <button onclick="document.getElementById('sidebar').classList.toggle('-translate-x-full'); document.getElementById('sidebar').classList.toggle('absolute'); document.getElementById('sidebar').classList.toggle('z-50');" class="text-slate-500">
                <i data-lucide="menu"></i>
            </button>
        </div>

        <!-- Views Container -->
        <div id="content-area" class="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
            
            <!-- 1. Dashboard View -->
            <div id="view-dashboard" class="view-section fade-in">
                <h1 class="text-2xl font-bold text-slate-800 mb-6">今日概況</h1>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div class="flex items-center justify-between mb-4">
                            <div class="bg-blue-100 p-2 rounded-lg text-blue-600"><i data-lucide="message-square"></i></div>
                            <span class="text-xs font-bold text-green-500">Live</span>
                        </div>
                        <h3 class="text-slate-500 text-sm mb-1">待回覆訊息</h3>
                        <p class="text-2xl font-bold text-slate-800" id="dash-msg-count">5</p>
                    </div>
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div class="flex items-center justify-between mb-4">
                            <div class="bg-purple-100 p-2 rounded-lg text-purple-600"><i data-lucide="bot"></i></div>
                            <span class="text-xs font-bold text-green-500">+12%</span>
                        </div>
                        <h3 class="text-slate-500 text-sm mb-1">AI 自動回覆數</h3>
                        <p class="text-2xl font-bold text-slate-800">142</p>
                    </div>
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div class="flex items-center justify-between mb-4">
                            <div class="bg-pink-100 p-2 rounded-lg text-pink-600"><i data-lucide="trending-up"></i></div>
                            <span class="text-xs font-bold text-green-500">+3</span>
                        </div>
                        <h3 class="text-slate-500 text-sm mb-1">本日爆文 (>1萬)</h3>
                        <p class="text-2xl font-bold text-slate-800">2</p>
                    </div>
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div class="flex items-center justify-between mb-4">
                            <div class="bg-orange-100 p-2 rounded-lg text-orange-600"><i data-lucide="shopping-bag"></i></div>
                            <span class="text-xs font-bold text-green-500">+18%</span>
                        </div>
                        <h3 class="text-slate-500 text-sm mb-1">自動抓取訂單</h3>
                        <p class="text-2xl font-bold text-slate-800" id="dash-sales">NT$ 12.5k</p>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 class="font-bold text-slate-800 mb-4">平台流量趨勢</h3>
                        <div class="chart-container">
                            <canvas id="trafficChart"></canvas>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 class="font-bold text-slate-800 mb-4">AI 回覆情緒分析</h3>
                        <div class="chart-container">
                            <canvas id="sentimentChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. Inbox View -->
            <div id="view-inbox" class="view-section hidden h-full flex flex-col md:flex-row overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style="height: calc(100vh - 6rem);">
                <!-- Chat List -->
                <div class="w-full md:w-1/3 border-r border-slate-100 flex flex-col">
                    <div class="p-4 border-b border-slate-100">
                        <div class="relative">
                            <i data-lucide="search" class="absolute left-3 top-2.5 text-slate-400 w-4 h-4"></i>
                            <input type="text" placeholder="搜尋訊息..." class="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <div class="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide" id="platform-filters">
                            <!-- Filters injected by JS -->
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto" id="chat-list">
                        <!-- Chats injected by JS -->
                    </div>
                </div>
                
                <!-- Chat Window -->
                <div class="flex-1 flex flex-col bg-slate-50" id="chat-window">
                    <!-- Selected Chat Header -->
                    <div class="p-4 bg-white border-b border-slate-100 flex justify-between items-center" id="chat-header">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500"><i data-lucide="user"></i></div>
                            <div>
                                <h3 class="font-bold text-slate-800">請選擇對話</h3>
                            </div>
                        </div>
                    </div>

                    <!-- Messages -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-4" id="chat-messages">
                        <div class="flex flex-col items-center justify-center h-full text-slate-400">
                            <i data-lucide="message-circle" class="w-12 h-12 mb-2 opacity-50"></i>
                            <p>點擊左側列表開始對話</p>
                        </div>
                    </div>

                    <!-- Input -->
                    <div class="p-4 bg-white border-t border-slate-100">
                        <div class="flex gap-2 mb-2">
                            <button class="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-100 transition flex items-center gap-1" onclick="generateAIReply()">
                                <i data-lucide="bot" class="w-3 h-3"></i> AI 生成回覆
                            </button>
                            <button class="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full hover:bg-slate-200 transition" onclick="quickReply('訂單已確認')">快速: 訂單確認</button>
                        </div>
                        <div class="flex gap-2">
                            <input type="text" id="message-input" placeholder="輸入訊息..." class="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <button onclick="sendMessage()" class="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition">
                                <i data-lucide="send" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. Settings View -->
            <div id="view-settings" class="view-section hidden fade-in">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">平台帳戶整合</h1>
                        <p class="text-slate-500">管理所有社群平台的連接狀態。</p>
                    </div>
                    <button onclick="resetData()" class="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i> 重置資料
                    </button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="platforms-grid">
                    <!-- Platforms injected by JS -->
                </div>
            </div>

            <!-- 4. Analytics View -->
            <div id="view-analytics" class="view-section hidden fade-in">
                <h1 class="text-2xl font-bold text-slate-800 mb-6">爆文與趨勢分析</h1>
                <div class="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                     <div class="flex items-center gap-2">
                        <i data-lucide="filter" class="w-4 h-4 text-slate-500"></i>
                        <select class="bg-slate-50 border-none rounded px-2 py-1 text-sm"><option>全部平台</option></select>
                     </div>
                     <div class="h-6 w-px bg-slate-200"></div>
                     <div class="flex items-center gap-2">
                        <i data-lucide="trending-up" class="w-4 h-4 text-red-500"></i>
                        <span class="text-sm">觀看數 > 10,000</span>
                     </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="posts-grid">
                    <!-- Posts injected by JS -->
                </div>
            </div>

             <!-- 5. Orders View -->
             <div id="view-orders" class="view-section hidden fade-in">
                <div class="flex justify-between items-end mb-6">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800 mb-1">訂單管理</h1>
                        <p class="text-slate-500 text-sm">自動抓取社群留言與私訊訂單。</p>
                    </div>
                    <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2">
                        <i data-lucide="refresh-ccw" class="w-4 h-4"></i> 同步至官網
                    </button>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50 text-slate-600 border-b">
                            <tr>
                                <th class="p-4">訂單編號</th>
                                <th class="p-4">客戶</th>
                                <th class="p-4">來源</th>
                                <th class="p-4">商品</th>
                                <th class="p-4">金額</th>
                                <th class="p-4">狀態</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100" id="orders-table">
                            <!-- Orders injected by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </main>

    <!-- Javascript Logic -->
    <script>
        // --- Data ---
        const platforms = [
            { id: 'instagram', name: 'Instagram', connected: true, account: '@amy_style' },
            { id: 'facebook', name: 'Facebook', connected: true, account: 'Amy Shop' },
            { id: 'threads', name: 'Threads', connected: true, account: '@amy_style' },
            { id: 'whatsapp', name: 'WhatsApp', connected: true, account: '+886 900...' },
            { id: 'line', name: 'LINE OA', connected: false, account: '' },
            { id: 'tiktok', name: 'TikTok', connected: false, account: '' },
            { id: 'shopee', name: 'Shopee', connected: false, account: '' },
            { id: 'website', name: '自建官網', connected: false, account: '' }
        ];

        const chats = [
            { id: 1, user: 'Amy Chen', platform: 'instagram', msg: '請問這個還有現貨嗎？', time: '10:23', history: [{sender:'user', text:'你好'}, {sender:'user', text:'請問這個還有現貨嗎？'}] },
            { id: 2, user: 'Jason Wu', platform: 'facebook', msg: '營業時間是幾點？', time: '09:15', history: [{sender:'user', text:'營業時間是幾點？'}, {sender:'ai', text:'我們是早上10點到晚上9點喔！'}] },
            { id: 3, user: 'Lisa Fan', platform: 'threads', msg: '+1', time: '昨天', history: [{sender:'user', text:'+1'}] }
        ];

        const posts = [
            { platform: 'instagram', content: '秋季新品上市！限時折扣...', views: 45200, likes: 3200, analysis: '視覺效果強烈，建議針對留言區再行銷。' },
            { platform: 'threads', content: '大家覺得哪個顏色好看？', views: 15600, likes: 1200, analysis: '互動率極高，藍色款需求大。' },
             { platform: 'facebook', content: '直播回放：顯瘦穿搭教學', views: 2800, likes: 150, analysis: '長尾效應佳，建議剪輯短片。' }
        ];

        const orders = [
            { id: 'ORD-001', customer: 'Lisa Fan', source: 'Threads', item: '羊毛圍巾', price: 1280, status: 'pending' },
            { id: 'ORD-002', customer: 'TechGuy', source: 'Twitter', item: '鍵盤組', price: 450, status: 'completed' },
            { id: 'ORD-003', customer: 'Wang', source: 'Facebook', item: '除濕機', price: 5600, status: 'processing' }
        ];

        let currentChat = null;

        // --- Init ---
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            renderPlatforms();
            renderChats();
            renderPosts();
            renderOrders();
            initCharts();
            
            // Set Dashboard as active
            switchTab('dashboard');
        });

        // --- Navigation ---
        function switchTab(tabId) {
            // Update Sidebar
            document.querySelectorAll('.nav-item').forEach(el => {
                if(el.id === `nav-${tabId}`) {
                    el.classList.add('bg-indigo-600', 'text-white');
                    el.classList.remove('text-slate-400', 'hover:bg-slate-800');
                } else {
                    el.classList.remove('bg-indigo-600', 'text-white');
                    el.classList.add('text-slate-400', 'hover:bg-slate-800');
                }
            });

            // Update View
            document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
            document.getElementById(`view-${tabId}`).classList.remove('hidden');
        }

        // --- Renders ---
        function renderPlatforms() {
            const grid = document.getElementById('platforms-grid');
            grid.innerHTML = platforms.map(p => `
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl">
                            ${p.name[0]}
                        </div>
                        <div>
                            <h3 class="font-bold text-lg text-slate-800">${p.name}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="w-2 h-2 rounded-full ${p.connected ? 'bg-green-500' : 'bg-slate-300'}"></span>
                                <span class="text-sm text-slate-500">${p.connected ? '已連接' : '未連接'}</span>
                            </div>
                        </div>
                    </div>
                    <button onclick="toggleConnect('${p.id}')" class="px-4 py-2 rounded-lg text-sm font-bold transition-colors ${p.connected ? 'text-slate-400 hover:text-red-500 bg-slate-50' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}">
                        ${p.connected ? '解除連接' : '連接'}
                    </button>
                </div>
            `).join('');
        }

        function toggleConnect(id) {
            const idx = platforms.findIndex(p => p.id === id);
            if(idx > -1) {
                platforms[idx].connected = !platforms[idx].connected;
                renderPlatforms();
            }
        }
        
        function resetData() {
            if(confirm("確定要重置所有資料嗎？")) {
                location.reload();
            }
        }

        function renderChats() {
            const list = document.getElementById('chat-list');
            list.innerHTML = chats.map(c => `
                <div onclick="selectChat(${c.id})" class="p-4 border-b border-slate-50 hover:bg-indigo-50 cursor-pointer transition-colors flex gap-3">
                    <img src="https://i.pravatar.cc/150?u=${c.id}" class="w-10 h-10 rounded-full bg-slate-200">
                    <div class="flex-1 overflow-hidden">
                        <div class="flex justify-between">
                            <span class="font-bold text-sm text-slate-800">${c.user}</span>
                            <span class="text-xs text-slate-400">${c.time}</span>
                        </div>
                        <p class="text-sm text-slate-500 truncate">${c.msg}</p>
                    </div>
                </div>
            `).join('');
        }

        function selectChat(id) {
            currentChat = chats.find(c => c.id === id);
            const header = document.getElementById('chat-header');
            const msgs = document.getElementById('chat-messages');
            
            header.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="https://i.pravatar.cc/150?u=${currentChat.id}" class="w-10 h-10 rounded-full">
                    <div>
                        <h3 class="font-bold text-slate-800">${currentChat.user}</h3>
                        <span class="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 capitalize">${currentChat.platform}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full">
                    <i data-lucide="bot" class="w-3 h-3"></i> AI 助理開啟
                </div>
            `;
            lucide.createIcons();

            msgs.innerHTML = currentChat.history.map(m => `
                <div class="flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}">
                    <div class="max-w-[75%] p-3 rounded-2xl text-sm ${m.sender === 'user' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none shadow-md'}">
                        ${m.text}
                    </div>
                </div>
            `).join('');
            msgs.scrollTop = msgs.scrollHeight;
        }

        function sendMessage() {
            const input = document.getElementById('message-input');
            const text = input.value;
            if(!text || !currentChat) return;

            currentChat.history.push({sender: 'admin', text: text});
            selectChat(currentChat.id); // Re-render
            input.value = '';
        }

        function quickReply(text) {
             if(!currentChat) return;
             currentChat.history.push({sender: 'admin', text: text});
             selectChat(currentChat.id);
        }

        function generateAIReply() {
            if(!currentChat) return;
            // Simulate AI thinking
            const btn = event.currentTarget;
            const originalText = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> 生成中...`;
            lucide.createIcons();
            
            setTimeout(() => {
                let reply = "感謝您的詢問！";
                if(currentChat.msg.includes("現貨")) reply = "您好！這款目前還有少量現貨喔，建議盡快下單！😊";
                else if(currentChat.msg.includes("+1")) reply = "收到！已為您建立訂單，稍後傳送結帳連結給您。";
                
                document.getElementById('message-input').value = reply;
                btn.innerHTML = originalText;
                lucide.createIcons();
            }, 800);
        }

        function renderPosts() {
            const grid = document.getElementById('posts-grid');
            grid.innerHTML = posts.map(p => `
                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div class="h-40 bg-slate-100 flex items-center justify-center text-slate-300 relative">
                        <i data-lucide="image" class="w-12 h-12"></i>
                        <span class="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm capitalize">${p.platform}</span>
                    </div>
                    <div class="p-4">
                        <p class="text-slate-800 font-bold text-sm mb-3 line-clamp-2">${p.content}</p>
                        <div class="flex justify-between text-xs text-slate-500 mb-3">
                            <span><i data-lucide="eye" class="w-3 h-3 inline"></i> ${(p.views/1000).toFixed(1)}k</span>
                            <span><i data-lucide="heart" class="w-3 h-3 inline"></i> ${p.likes}</span>
                        </div>
                        <div class="bg-indigo-50 p-2 rounded text-xs text-indigo-700">
                            <i data-lucide="bot" class="w-3 h-3 inline mr-1"></i> ${p.analysis}
                        </div>
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
        }

        function renderOrders() {
            const tbody = document.getElementById('orders-table');
            tbody.innerHTML = orders.map(o => `
                <tr class="border-b border-slate-50 hover:bg-slate-50">
                    <td class="p-4 font-mono text-slate-500">${o.id}</td>
                    <td class="p-4 font-bold text-slate-700">${o.customer}</td>
                    <td class="p-4"><span class="bg-slate-100 px-2 py-1 rounded text-xs text-slate-500">${o.source}</span></td>
                    <td class="p-4 text-slate-600">${o.item}</td>
                    <td class="p-4 font-bold">NT$ ${o.price}</td>
                    <td class="p-4"><span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold capitalize">${o.status}</span></td>
                </tr>
            `).join('');
        }

        function initCharts() {
            // Traffic Chart
            new Chart(document.getElementById('trafficChart'), {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Instagram',
                        data: [12, 19, 3, 5, 2, 3],
                        borderColor: '#E1306C',
                        tension: 0.4
                    }, {
                        label: 'Facebook',
                        data: [2, 3, 20, 5, 1, 4],
                        borderColor: '#1877F2',
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
            });

            // Sentiment Chart
            new Chart(document.getElementById('sentimentChart'), {
                type: 'doughnut',
                data: {
                    labels: ['正面評價', '中立', '負面'],
                    datasets: [{
                        data: [70, 20, 10],
                        backgroundColor: ['#22c55e', '#94a3b8', '#ef4444']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
            });
        }
    </script>
</body>
</html>