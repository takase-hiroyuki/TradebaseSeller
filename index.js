// path: ~/Desktop/TradeBase/LIFF/public/index.js
alert("index.js: チェック62");

import {
	getFirestore,
	collection,
	query,
	where,
	getDocs,
	doc,
	getDoc,
	onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
	firebaseDb,
	getAuthenticatedUserContext
} from "./auth_integration.js";

import {
	setupInventoryFilters,
	refreshInventory
} from "./inventory_view.js";

import {
	showOrderPanel,
	adjustQty,
	submitOrder,
	hideOrderPanel
} from "./inventory_action.js";

import {
	setupHistoryFilters,
	refreshHistory
} from "./history_view.js";

import { 
	cancelOrder, 
	acceptOrder 
} from "./history_action.js";

import {
	updateSettingsView
} from "./Settings_view.js";

import {
	setupSettingsActions
} from "./Settings_action.js";

// グローバル変数の定義（インポート先でも共有される想定）
const state = {
	db: firebaseDb,
	myShopId: "",
	userId: "", // 追加：操作者の個人ID (sixCharId) を保持
	categories: [],
	suppliers: [],
	selectedCategory: "",
	selectedSellerId: "",
	inventoryUnsubscribe: null,
	historyUnsubscribe: null
};

async function initTradeBase() {
	const statusText = document.getElementById('loading-text');
	const log = (msg) => { if(statusText) statusText.innerText = msg; };

	try {
		log("initTradeBase: LIFF認証中...");
		alert("index.js: intTradeBase 02");
        const userContexts = await getAuthenticatedUserContext();
		alert("index.js: intTradeBase 03");
        if (!userContexts) return; // ログイン中、または未登録ならリダイレクト済み

        // 複数店舗に所属している場合
        if (userContexts.length > 1) {
            showOrgSelection(userContexts);
            return;
        }
        // 1つの店舗のみ所属の場合、そのまま起動
        await startApp(userContexts[0]);

	} catch (err) {
		log("致命的エラー: " + err.message);
	}
}

// ナビゲーション切り替え
function setupNavigation() {
	// 1. 管理したい「ID」のリストを定義する
	const views = ['market', 'history', 'settings'];

	for (const viewName of views) {
		const navBtn = document.getElementById(`nav-${viewName}`);
		if (!navBtn) continue;
		navBtn.addEventListener('click', () => {

			if (state.inventoryUnsubscribe) {
				state.inventoryUnsubscribe();
				state.inventoryUnsubscribe = null;
			}
			if (state.historyUnsubscribe) {
				state.historyUnsubscribe();
				state.historyUnsubscribe = null;
			}

			for (const targetName of views) {
				const el = document.getElementById(`view-${targetName}`);
				if (targetName === viewName) {
					el.style.display = 'block';
					// 2. フィルタの見た目を現在の state に同期してからデータを取得
					if (viewName === 'market') {
						// ボタンの active 状態などを再描画
						setupInventoryFilters(state, () => refreshInventory(state));
						refreshInventory(state); 
					}
					if (viewName === 'history') {
						// 履歴側のフィルタも再描画
						setupHistoryFilters(state, () => refreshHistory(state));
						refreshHistory(state);
					}
				} else {
					el.style.display = 'none';
				}
			}
		});
	}
}

window.onload = initTradeBase;

// ひとりで複数店舗に所属する場合に、選択画面を表示する関数
function showOrgSelection(contexts) {
    // 1. HTMLに実在するID 'view-org-selection' に修正
    const view = document.getElementById('view-org-selection'); 

    // 2. 親要素 'app-shell' を表示し、'loading-view' を隠す処理を追加
    // これをしないと、たとえ窓が表示されても親が display:none のままなので見えません
    const shell = document.getElementById('app-shell');
    const loading = document.getElementById('loading-view');
    if (shell) shell.style.display = 'block';
    if (loading) loading.style.display = 'none';

    if (view) view.style.display = 'block';

    const container = document.getElementById('org-list-container');
    if (!container) return;
    
    container.innerHTML = ""; // 初期化
    
    contexts.forEach(ctx => {
        const btn = document.createElement('button');
        // 3. CSSで定義されているクラス名 'org-select-btn' を正確に付与
        btn.className = 'org-select-btn'; 
        btn.textContent = ctx.shopName;
        btn.onclick = () => {
            if (view) view.style.display = 'none';
            startApp(ctx);
        };
        container.appendChild(btn);
    });
}

// 選択（または単一所属）したデータでアプリを起動する関数
async function startApp(context) {
    const log = (msg) => { 
        const statusText = document.getElementById('loading-text');
        if(statusText) statusText.innerText = msg; 
    };
    
    document.getElementById('loading-view').style.display = 'flex';
    log("アプリ起動中...");

    state.myShopId = context.shopId;
    state.userId = context.userId;

    // --- 以降、既存の初期化処理 ---
    log("カテゴリー定義の取得");
    const catSnap = await getDoc(doc(state.db, "system_master", "category_definition"));
    state.categories = catSnap.exists() ? catSnap.data().list : ["未分類"];

    log("取引先リストの構築");
    const supSnap = await getDocs(collection(state.db, "shops", state.myShopId, "suppliers"));
    const supTasks = supSnap.docs.map(async (d) => {
        const sInfo = await getDoc(doc(state.db, "shops", d.id));
        return sInfo.exists() ? { id: d.id, name: sInfo.data().shopName } : null;
    });
    state.suppliers = (await Promise.all(supTasks)).filter(s => s !== null);

    document.getElementById('display-shop-name').innerText = context.shopName;
    document.getElementById('display-user-name').innerText = context.userName;

    if (state.categories.length > 0) state.selectedCategory = state.categories[0];
    if (state.suppliers.length > 0) state.selectedSellerId = state.suppliers[0].id;

    setupNavigation();
    setupInventoryFilters(state, () => refreshInventory(state));
    await refreshInventory(state);
    setupHistoryFilters(state, () => refreshHistory(state));

    document.getElementById('loading-view').style.display = 'none';
    document.getElementById('app-shell').style.display = 'block';
}


// --- A-1. 在庫画面の動き ---
document.getElementById('inventory-body')?.addEventListener('click', (e) => {
	const row = e.target.closest('.inventory-row');
	if (row) {
		const { id, name, price, qty } = row.dataset;
		// 在庫(qty)が0未満の場合はパネルを開かずに中断します
		if (parseInt(qty) < 0) {
			alert("index.js: 現在、この商品は受注を停止しています（在庫補充待ち）。");
			return;
		}
		
		showOrderPanel(id, name, Number(price));
	}
});

// --- A-2. 注文パネルの動き ---
// 数量変更、発注、閉じるボタンを一括管理
document.getElementById('order-panel')?.addEventListener('click', (e) => {
	// ボタンの data-action 属性をチェック
	const action = e.target.dataset.action;
	if (!action) return;

	if (action === 'adjust') adjustQty(Number(e.target.dataset.value));
	if (action === 'submit') submitOrder(state); // stateを渡すことでショップID等を利用可能にする
	if (action === 'close') hideOrderPanel();
});

// --- B-1. 履歴行のクリック（詳細表示） ---
document.getElementById('history-body')?.addEventListener('click', (e) => {
	const row = e.target.closest('.history-row');
	if (row) {
		const d = row.dataset;
		document.getElementById('detail-product-name').innerText = d.name;
		document.getElementById('detail-status').innerText = d.statusKanji;
		document.getElementById('detail-time').innerText = d.time;
		document.getElementById('detail-price').innerText = `¥${Number(d.price).toLocaleString()}`;
		document.getElementById('detail-qty').innerText = d.qty;
		document.getElementById('detail-total').innerText = `¥${d.total}`;
		document.getElementById('detail-id').innerText = d.id;

		const actionArea = document.getElementById('detail-actions');
		if (actionArea) actionArea.innerHTML = "";

		document.getElementById('history-detail-panel').style.display = 'flex';
	}
});

// --- B-2. 履歴詳細パネル内のボタン動作（一括管理） ---
document.getElementById('history-detail-panel')?.addEventListener('click', (e) => {
	// ボタンの data-action 属性を確認
	const action = e.target.dataset.action;
	if (!action) return;

	const orderId = document.getElementById('detail-id').innerText;

	if (action === 'close') {
		document.getElementById('history-detail-panel').style.display = 'none';
	}
	// 今後、ここに action === 'cancel' などを追加していきます
});

// --- E. 設定（ナビゲーション等）の動き ---
document.getElementById('view-settings')?.addEventListener('click', (hoge) => {
	const action = hoge.target.dataset.action;
	if (action === 'logout') {
		console.log("ログアウトがリクエストされました");
	}
});

// index.js の一番最後（--- E. 設定（ナビゲーション等）の動き --- の下）に追加
document.getElementById('btn-re-link')?.addEventListener('click', () => {
	location.href = 'buyer_first_setup.html';
});

// ここがファイルの最後です。
