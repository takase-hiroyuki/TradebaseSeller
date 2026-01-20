import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from "./firebase_config.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(app);
const auth = getAuth(app);
alert("auth 11");

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
                
                // 初回設定(isConfigured)が終わっていない場合は、ログイン未完了とみなすことも可能だが
                // ここではデータだけ返して呼び出し元(index.js)で判断させる設計とします。

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
