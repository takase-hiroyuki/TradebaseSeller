import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from "./firebase_config.js";

// Firebase初期化（ログアウト処理のため）
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function setupSettingsView(state) {
    // ----------------------------------------------------
    // 1. 既存のロジック: 画面表示の更新
    // ----------------------------------------------------
    const nameEl = document.getElementById('settings-user-name');
    const shopEl = document.getElementById('settings-shop-id');
    
    // データがあれば表示、なければハイフンなどを表示するよう少し補強しました
    if(nameEl) nameEl.innerText = state.userName || "-user-";
    if(shopEl) shopEl.innerText = state.myShopId || "-shop-";

    // ----------------------------------------------------
    // 2. 追加ロジック: 「別のIDを連携する」ボタンの処理
    // ----------------------------------------------------
    const btnLink = document.getElementById("btn-re-link");
    if(btnLink) {
        // イベントリスナーの重複登録を防ぐため、クローンして置換します
        const newBtn = btnLink.cloneNode(true);
        btnLink.parentNode.replaceChild(newBtn, btnLink);

        newBtn.addEventListener("click", async () => {
            const isConfirmed = confirm("現在のログイン状態を解除して、初期設定画面に戻りますか？");
            if(!isConfirmed) return;

            try {
                // Firebase Authからサインアウト
                await signOut(auth);
                
                // setup画面へ強制遷移
                window.location.href = "seller_setup.html";
            } catch(e) {
                console.error(e);
                alert("ログアウトに失敗しました: " + e.message);
            }
        });
    }
}
