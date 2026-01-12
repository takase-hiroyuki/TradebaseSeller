import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase_config.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(app);

// ユーザーコンテキストの取得
export async function getAuthenticatedUserContext() {
    // ★開発用ダミーID
    // 本番環境(LIFF)で動作確認する際も、まずはこのIDで動くか確認します
    const debugUserId = "ki1234"; 

    // Firestoreからユーザー情報を取得
    const userRef = doc(firebaseDb, "users", debugUserId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.error("ユーザー登録がありません: " + debugUserId);
        // エラーでも画面が止まらないようnullを返す
        return null;
    }

    const userData = userSnap.data();
    
    // 店舗情報の取得
    const shopRef = doc(firebaseDb, "shops", userData.shopId);
    const shopSnap = await getDoc(shopRef);
    
    return {
        userId: userData.userId,
        userName: userData.userName,
        shopId: userData.shopId,
        shopName: shopSnap.exists() ? shopSnap.data().shopName : "不明な店舗",
        role: userData.role
    };
}

