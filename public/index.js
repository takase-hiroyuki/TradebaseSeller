// path: ~/Desktop/TradeBase/LIFF/public/index.js
alert("チェック01");

import { getAuthenticatedUserContext } from "./auth_integration.js";

window.onload = async () => {
    // 画面上のメッセージ表示要素を取得
    const statusText = document.getElementById('loading-text');

    try {
        // Firestoreへの接続とデータ取得を試行
        // (ローカルではダミーのため失敗しますが、デプロイ後は成功するはずです)
        const context = await getAuthenticatedUserContext();

        if (context) {
            // 成功した場合
            statusText.innerText = `接続OK！ ようこそ ${context.userName} さん`;
            statusText.style.color = "green";      // 文字を緑色に
            statusText.style.fontWeight = "bold";  // 太字に
            
            // コンソールにも詳細を出力しておきます
            console.log("取得データ:", context);

        } else {
            // 接続はできたがデータがない場合
            statusText.innerText = "接続はできましたが、ユーザー(ki1234)が見つかりません。";
            statusText.style.color = "orange";
        }

    } catch (e) {
        // エラーが発生した場合
        console.error(e);
        statusText.innerText = `接続エラー: ${e.message}`;
        statusText.style.color = "red";
    }
};

