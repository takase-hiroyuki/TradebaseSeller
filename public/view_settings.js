export function setupSettingsView(state) {
    const nameEl = document.getElementById('settings-user-name');
    const shopEl = document.getElementById('settings-shop-id');
    
    if(nameEl) nameEl.innerText = state.userName;
    if(shopEl) shopEl.innerText = state.myShopId;
}
