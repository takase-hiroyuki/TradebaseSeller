import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc,
    collection, // 追加
    query,      // 追加
    where,      // 追加
    getDocs     // 追加
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from "./firebase_config.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(app);
const auth = getAuth(app);
alert("auth 15");

// ユーザーコンテキストの取得（非同期）
export function getAuthenticatedUserContext() {
    return new Promise((resolve) => {
        // Auth状態の変化を監視（初回ロード時も発火する）
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            // 監視を解除（1回だけ取得できれば良いため）
            unsubscribe();

            if (!user) {
                console.log("未ログイン状態です");
                resolve(null);
                return;
            }

            // メールアドレスからドキュメントID (sixCharId) を抽出
            // ルール: ID@example.com -> ID
            const userId = user.email.split('@')[0];

            try {
                // Firestoreからユーザー情報を取得
                const userRef = doc(firebaseDb, "users", userId);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    console.error("Auth認証済みですが、Firestoreにユーザー登録がありません: " + userId);
                    resolve(null);
                    return;
                }

                const userData = userSnap.data();

// ▼▼▼ 【ここが今回の実験コード】 alertで結果を表示 ▼▼▼
let message = "【データ確認】\n";
message += "ログイン中: " + userData.userName + "\n";
message += "LINE ID: " + (userData.lineUserId ? userData.lineUserId : "なし") + "\n\n";

if (userData.lineUserId) {
    // 同じLINE IDを持つ人を全員探す
    const q = query(
        collection(firebaseDb, "users"),
        where("lineUserId", "==", userData.lineUserId)
    );
    const querySnapshot = await getDocs(q);

    message += "★同じLINE IDを持つ人数: " + querySnapshot.size + "人\n";
    message += "------------------\n";
    querySnapshot.forEach((doc) => {
        const d = doc.data();
        message += "・" + d.userName + " (" + doc.id + ")\n";
    });
} else {
    message += "★注意: このユーザーには LINE ID が保存されていません。\n紐付け確認ができませんでした。";
}

// 画面にポップアップ表示！
alert(message);
// ▲▲▲ 実験コードここまで ▲▲▲


                
                // 店舗情報の取得
                let shopName = "未所属";
                if (userData.shopId) {
                    const shopRef = doc(firebaseDb, "shops", userData.shopId);
                    const shopSnap = await getDoc(shopRef);
                    if (shopSnap.exists()) {
                        shopName = shopSnap.data().shopName;
                    }
                }
                
                resolve([{
                    userId: userData.userId,
                    userName: userData.userName,
                    shopId: userData.shopId,
                    shopName: shopName,
                    role: userData.role,
                    isConfigured: userData.isConfigured // 判定用に追記
                }]);

            } catch (error) {
                console.error("ユーザー情報の取得中にエラー:", error);
                resolve(null);
            }
        });
    });
}
