import { getAuthenticatedUserContext } from "./auth_integration.js";
// import { setupOrdersView, detachOrdersView } from "./view_orders.js";
// import { setupInventoryView, detachInventoryView } from "./view_inventory.js";
// import { setupSettingsView } from "./view_settings.js";

// アプリ全体の状態
const state = {
    myShopId: null,
    userId: null,
    userName: null
};

// 起動処理
window.onload = async () => {
    // 起動時のチェックアラート（不要なら削除してください）
    // alert("App Start");

    const loading = document.getElementById('loading-view');
    const shell = document.getElementById('app-shell');
    
    try {
        console.log("起動開始...");
        const context = await getAuthenticatedUserContext();
        
        if (!context) {
            // エラー表示
            if(loading) loading.innerHTML = '<p style="color:red; text-align:center;">ユーザー情報の取得に失敗しました。<br>Firestoreのデータを確認してください。</p>';
            return;
        }

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

        // 初期表示 (受注リスト)
        // setupOrdersView(state);
        // 設定画面にも値をセット
        // setupSettingsView(state);

        // 画面表示切り替え
        if(loading) loading.style.display = 'none';
        if(shell) shell.style.display = 'block';

    } catch (e) {
        console.error(e);
        alert("起動エラー: " + e.message);
    }
};

function setupNavigation() {
/*
    const navs = [
        { id: 'nav-orders', view: 'view-orders', setup: setupOrdersView, detach: detachOrdersView },
        { id: 'nav-inventory', view: 'view-inventory', setup: setupInventoryView, detach: detachInventoryView },
        { id: 'nav-settings', view: 'view-settings', setup: setupSettingsView, detach: () => {} }
    ];

    navs.forEach(nav => {
        const btn = document.getElementById(nav.id);
        if(!btn) return;

        btn.addEventListener('click', () => {
            // 見た目のアクティブ切り替え（簡易的）
            document.querySelectorAll('.nav-item').forEach(el => el.style.color = '#888');
            btn.style.color = '#00b900'; // LINE GREEN

            // すべてのViewを非表示 & リスナー解除
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
*/
}

