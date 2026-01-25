import { getAuthenticatedUserContext } from "./auth_integration.js?v=25";
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
    alert("index 25");

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

        // Sellerが複数いる場合は、ここで処理を止めて選択画面へ飛ばす
        if (contextList.length > 1) {
            showSelectionScreen(contextList);
            // return;
        }
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

// 複数アカウント選択時の処理
function showSelectionScreen(list) {
    // ひとまずアラートで分岐の成功を確認します
    alert("Sellerが " + list.length + "人 見つかりました。\nこれから選択ボタンを表示します。");
    
    // 【1】画面の表示切り替え
    const loading = document.getElementById('loading-view');
    const shell = document.getElementById('app-shell');
    const selectionView = document.getElementById('view-org-selection');
    
    // ローディングを消して、アプリ枠と選択画面を出す
    if(loading) loading.style.display = 'none';
    if(shell) shell.style.display = 'block';
    if(selectionView) selectionView.style.display = 'block';

    // 念のため、他のコンテンツや下のメニューバーは隠しておく
    document.querySelectorAll('.content-view').forEach(el => el.style.display = 'none');
    document.querySelector('.bottom-nav').style.display = 'none';

    const container = document.getElementById('org-list-container');
    if(!container) return;
    container.innerHTML = ""; // 前回の表示が残っていれば消す

    // リストの人数分だけボタンを作る
    list.forEach(user => {
        const btn = document.createElement('div');
        
        // スマホで押しやすいカード型のデザイン設定
        btn.style.cssText = "padding:16px; margin-bottom:12px; background:#fff;"
            +" border:1px solid #ddd; border-radius:8px; cursor:pointer;"
            +" box-shadow:0 2px 4px rgba(0,0,0,0.05);";
        
        // ボタンの中に文字を入れる（店舗名とユーザー名）
        btn.innerHTML = `
            <div style="font-weight:bold; font-size:1.1em; color:#00b900;">${user.shopName}</div>
            <div style="font-size:0.9em; color:#555; margin-top:4px;">${user.userName}</div>
        `;
    });

	alert("ここまで");
}

