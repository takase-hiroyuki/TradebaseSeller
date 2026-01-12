// path: ~/Desktop/TradeBase/LIFF/public/index.js
alert("チェック01");

/*

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
} from "./settings_view.js";

import {
	setupSettingsActions
} from "./settings_action.js";

// ★追加インポート
import {
    setupSupplierSettings,
    renderSupplierSettingsList
} from "./settings_supplier.js";


// グローバル変数の定義
const state = {
	db: firebaseDb,
	myShopId: "",
	userId: "", 
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
		const userContexts = await getAuthenticatedUserContext();
		if (!userContexts) return; 

		if (userContexts.length > 1) {
			showOrgSelection(userContexts);
			return;
		}
		await startApp(userContexts[0]);

	} catch (err) {
		log("致命的エラー: " + err.message);
		console.error(err);
	}
}

// ナビゲーション切り替え
function setupNavigation() {
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
					
					if (viewName === 'market') {
						setupInventoryFilters(state, () => refreshInventory(state));
						refreshInventory(state);
					}
					if (viewName === 'history') {
						setupHistoryFilters(state, () => refreshHistory(state));
						refreshHistory(state);
					}
                    // ★追加: 設定画面が開かれたらリストを更新
                    if (viewName === 'settings') {
                        renderSupplierSettingsList(state);
                    }

				} else {
					el.style.display = 'none';
				}
			}
		});
	}
}

window.onload = initTradeBase;

function showOrgSelection(contexts) {
	const view = document.getElementById('view-org-selection');
	const shell = document.getElementById('app-shell');
	const loading = document.getElementById('loading-view');
	if (shell) shell.style.display = 'block';
	if (loading) loading.style.display = 'none';

	if (view) view.style.display = 'block';

	const container = document.getElementById('org-list-container');
	if (!container) return;
	
	container.innerHTML = ""; 
	
	contexts.forEach(ctx => {
		const btn = document.createElement('button');
		btn.className = 'org-select-btn';
		btn.textContent = ctx.shopName;
		btn.onclick = () => {
			if (view) view.style.display = 'none';
			startApp(ctx);
		};
		container.appendChild(btn);
	});
}

async function startApp(context) {
	const log = (msg) => {
		const statusText = document.getElementById('loading-text');
		if(statusText) statusText.innerText = msg;
	};
	
	document.getElementById('loading-view').style.display = 'flex';
	log("アプリ起動中...");

	state.myShopId = context.shopId;
	state.userId = context.userId;

	log("カテゴリー定義の取得");
	const catSnap = await getDoc(doc(state.db, "system_master", "category_definition"));
	state.categories = catSnap.exists() ? catSnap.data().list : ["未分類"];

	log("取引先リストの構築");
	const supSnap = await getDocs(collection(state.db, "shops", state.myShopId, "suppliers"));
	
	const supTasks = supSnap.docs.map(async (d) => {
		const supplierData = d.data();
		const sInfo = await getDoc(doc(state.db, "shops", d.id));
		if (!sInfo.exists()) return null;
		const masterName = sInfo.data().shopName;
		return { 
			id: d.id, 
			sellerShopName: supplierData.sellerShopName || masterName,
			sortOrder: supplierData.sortOrder || 0 // ★追加: 並び替え用の数値を取得
		};
	});

	const unsortedSuppliers = (await Promise.all(supTasks)).filter(s => s !== null);
	state.suppliers = unsortedSuppliers.sort((a, b) => a.sortOrder - b.sortOrder);

	document.getElementById('display-shop-name').innerText = context.shopName;
	document.getElementById('display-user-name').innerText = context.userName;

    updateSettingsView(context);
    setupSupplierSettings(state);

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
		if (parseInt(qty) < 0) {
			alert("index.js: 現在、この商品は受注を停止しています（在庫補充待ち）。");
			return;
		}
		showOrderPanel(id, name, Number(price));
	}
});

// --- A-2. 注文パネルの動き ---
document.getElementById('order-panel')?.addEventListener('click', (e) => {
	const action = e.target.dataset.action;
	if (!action) return;

	if (action === 'adjust') adjustQty(Number(e.target.dataset.value));
	if (action === 'submit') submitOrder(state);
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

		if (actionArea) {
			actionArea.innerHTML = "";
			
			// 「未収」の場合 -> キャンセルボタンを表示
			if (d.statusId === "ORDERED") {
				const cancelBtn = document.createElement('button');
				cancelBtn.className = "btn-danger-outline";
				cancelBtn.innerText = "注文をキャンセルする";
				cancelBtn.dataset.action = "cancel"; 
				actionArea.appendChild(cancelBtn);
			}

			// 「提案」の場合 -> 承認ボタンを表示 (★追加部分)
			if (d.statusId === "PROPOSED") {
				const acceptBtn = document.createElement('button');
				acceptBtn.className = "btn-primary"; // 青/緑系の強調ボタン
				acceptBtn.innerText = "提案を承認する";
				acceptBtn.dataset.action = "accept";
				// キャンセルボタンと異なり、誤操作防止のためマージンを少し空けるスタイル定義があれば適用
				acceptBtn.style.marginBottom = "12px"; 
				actionArea.appendChild(acceptBtn);
			}
		}

		document.getElementById('history-detail-panel').style.display = 'flex';
	}
});

// --- B-2. 履歴詳細パネル内のボタン動作 ---
document.getElementById('history-detail-panel')?.addEventListener('click', (e) => {
	const action = e.target.dataset.action;
	if (!action) return;

	const orderId = document.getElementById('detail-id').innerText;

	if (action === 'close') {
		document.getElementById('history-detail-panel').style.display = 'none';
	}

	if (action === 'cancel') {
		cancelOrder(state, orderId);
	}

	// ★追加部分
	if (action === 'accept') {
		acceptOrder(state, orderId);
	}
});

document.getElementById('btn-re-link')?.addEventListener('click', () => {
	location.href = 'buyer_first_setup.html';
});

*/

