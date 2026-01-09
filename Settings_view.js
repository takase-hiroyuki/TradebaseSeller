// Settings_view.js

/**
 * 設定画面のユーザー情報と店舗情報を更新する
 * @param {Object} context - { shopId, shopName, userName, userId }
 */
export function updateSettingsView(context) {
    const userNameEl = document.getElementById('settings-user-name');
    const shopIdEl = document.getElementById('settings-shop-id');
    const displayShopNameEl = document.getElementById('display-shop-name');
    const displayUserNameEl = document.getElementById('display-user-name');

    if (userNameEl) userNameEl.innerText = context.userName;
    if (shopIdEl) shopIdEl.innerText = context.shopId;
    
    // ヘッダー側の表示も更新
    if (displayShopNameEl) displayShopNameEl.innerText = context.shopName;
    if (displayUserNameEl) displayUserNameEl.innerText = context.userName;
}

