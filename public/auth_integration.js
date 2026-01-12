import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase_config.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(app);

// ユーザーコンテキストの取得
export async function getAuthenticatedUserContext() {
    // ★ここを書き換えました
    // 画像にあるドキュメントIDを指定します
    const debugUserId = "ak7fjc"; 

    // Firestoreからユーザー情報を取得
    const userRef = doc(firebaseDb, "users", debugUserId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.error("ユーザー登録がありません: " + debugUserId);
        return null;
    }

    const userData = userSnap.data();
    
    // 店舗情報の取得
    // 注意: 画像には users の情報しかありませんでしたが、
    // shops コレクションに "adtkc9" というIDのデータがない場合、店舗名は「不明な店舗」になります。
    let shopName = "不明な店舗";
    if (userData.shopId) {
        const shopRef = doc(firebaseDb, "shops", userData.shopId);
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
            shopName = shopSnap.data().shopName;
        }
    }
    
    return {
        userId: userData.userId,
        userName: userData.userName,
        shopId: userData.shopId,
        shopName: shopName,
        role: userData.role
    };
}

