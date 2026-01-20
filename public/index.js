import { getAuthenticatedUserContext } from "./auth_integration.js?v=14";
// import { setupOrdersView, detachOrdersView } from "./view_orders.js";
// import { setupInventoryView, detachInventoryView } from "./view_inventory.js";
import { setupSettingsView } from "./view_settings.js";

// アプリ全体の状態
const state = {
    myShopId: null,
    userId: null,
    userName: null
};

// 起動処理
window.onload = async () => {
    alert("index 14");

    const loading = document.getElementById('loading-view');
    const shell = document.getElementById('app-shell');
    const loadingText = document.getElementById('loading-text');
    
    try {
        if(loadingText) loadingText.innerText = "ユーザー認証中...";
        const contextList = await getAuthenticatedUserContext();

        // もし context が空っぽ（未ログイン）なら、すぐにセットアップ画面へ飛ばす
		if (!contextList || contextList.length === 0) {
            console.log("認証情報なし。セットアップ画面へ遷移します。");
            window.location.href = "seller_setup.html";
            return; // ここで処理を終わらせる
        }

		// とりあえず先頭の1つを使う（現状は1つしか返ってこないため）
        const context = contextList[0];
		
        // 初回設定(パスワード変更等)が完了していない場合もセットアップ画面へ
        if (!context.isConfigured) {
             console.log("初期設定未完了。セットアップ画面へ遷移します。");
             window.location.href = "seller_setup.html";
             return;
        }

		// 認証成功後、アプリを開始する（ロジックの委譲）
        await startApp(context);

        // 初期表示 (受注リスト)
        // setupOrdersView(state);

    } catch (e) {
        console.error(e);
        alert("起動エラー: " + e.message);
    }
};

async function startApp(context) {
    // 状態の保存
    state.myShopId = context.shopId;
    state.userId = context.userId;
    state.userName = context.userName;

	// ヘッダー表示更新
	const shopNameEl = document.getElementById('display-shop-name');
    const userNameEl = document.getElementById('display-user-name');
    if(shopNameEl) shopNameEl.innerText = context.shopName;
    if(userNameEl) userNameEl.innerText = context.userName;

    // ナビゲーション設定
    setupNavigation();

	// 設定画面にも値をセット
    setupSettingsView(state);

	// 画面表示切り替え
	const loading = document.getElementById('loading-view');
    const shell = document.getElementById('app-shell');
    if(loading) loading.style.display = 'none';
    if(shell) shell.style.display = 'block';
}

function setupNavigation() {
    // ★ナビゲーション設定を有効化
    const navs = [
        // OrdersとInventoryはまだファイルがないので一旦無効化しておく
        { id: 'nav-orders', view: 'view-orders', setup: null, detach: null },
        { id: 'nav-inventory', view: 'view-inventory', setup: null, detach: null },
        { id: 'nav-settings', view: 'view-settings', setup: setupSettingsView, detach: () => {} }
    ];

    navs.forEach(nav => {
        const btn = document.getElementById(nav.id);
        if(!btn) return;

        btn.addEventListener('click', () => {
            // 見た目のアクティブ切り替え
            document.querySelectorAll('.nav-item').forEach(el => el.style.color = '#888');
            btn.style.color = '#00b900'; // LINE GREEN

            // すべてのViewを非表示
            navs.forEach(n => {
                const el = document.getElementById(n.view);
                if(el) el.style.display = 'none';
                if(n.detach) n.detach();
            });

            // 選択されたViewを表示 & セットアップ
            const target = document.getElementById(nav.view);
            if(target) target.style.display = 'block';
            if(nav.setup) nav.setup(state);
        });
    });
}

