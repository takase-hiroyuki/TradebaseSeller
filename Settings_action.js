// Settings_action.js

/**
 * 店舗切り替えのイベントを設定する
 * @param {Object} state - アプリのグローバル状態
 * @param {Function} reinitCallback - initTradeBase を呼び出すためのコールバック
 */
export function setupSettingsActions(state, reinitCallback) {
    const switchBtn = document.getElementById('switch-shop-btn');
    if (!switchBtn) return;

    switchBtn.onclick = () => {
        // 1. 現在のFirestore監視を解除（二重動作防止）
        if (state.inventoryUnsubscribe) {
            state.inventoryUnsubscribe();
            state.inventoryUnsubscribe = null;
        }
        if (state.historyUnsubscribe) {
            state.historyUnsubscribe();
            state.historyUnsubscribe = null;
        }

        // 2. メイン画面を隠す
        const appShell = document.getElementById('app-shell');
        if (appShell) appShell.style.display = 'none';

        // 3. 初期化処理（店舗選択画面）へ戻る
        reinitCallback();
    };
}

