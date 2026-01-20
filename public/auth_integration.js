alert("auth 16");

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { 
    getFirestore, 
    doc, 
    getDoc,
    collection, 
    query,      
    where,      
    getDocs,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    firebaseConfig
} from "./firebase_config.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(app);
const auth = getAuth(app);

// ユーザーコンテキストの取得（非同期）
export function getAuthenticatedUserContext() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();

            if (!user) {
                alert("未ログイン状態です");
                resolve(null);
                return;
            }

            const userId = user.email.split('@')[0];

            try {
                // Firestoreからユーザー情報を取得
                const userRef = doc(firebaseDb, "users", userId);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    alert("Auth認証済みですが、Firestoreにユーザー登録がありません: " + userId);
                    resolve(null);
                    return;
                }

                const userData = userSnap.data();

                // 条件: データベースのLINE IDが空、かつ LIFF環境(LINEアプリ内)であること
                if (!userData.lineUserId && typeof liff !== 'undefined' && liff.isInClient()) {
                    try {
                        // Seller用のLIFF IDで初期化
                        await liff.init({ liffId: "2008866806-5xanwnmT" });
                        
                        if (liff.isLoggedIn()) {
                            const profile = await liff.getProfile();
                            const currentLineId = profile.userId;

                            if (currentLineId) {
                                // Firestoreに書き込む
                                await updateDoc(userRef, {
                                    lineUserId: currentLineId
                                });

                                // この後の表示用に、メモリ上のデータも更新しておく
                                userData.lineUserId = currentLineId;
                                
                                alert("【自動修復成功】\nあなたのLINE IDをデータベースに登録しました。");
                            }
                        }
                    } catch (err) {
                        // エラーが出てもアプリの起動は止めない
                        alert("LINE ID自動保存に失敗:"+err);
                    }
                }

                // データの状態と、同じIDを持つユーザーの検索 
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
                    message += "★注意: LINE IDがありません。\n(Webブラウザ等のため自動取得できませんでした)";
                }

                // 結果をポップアップ表示
                alert(message);
                
                // 店舗情報の取得
                let shopName = "未所属";
                if (userData.shopId) {
                    const shopRef = doc(firebaseDb, "shops", userData.shopId);
                    const shopSnap = await getDoc(shopRef);
                    if (shopSnap.exists()) {
                        shopName = shopSnap.data().shopName;
                    }
                }
                
                // 配列で返す（将来の複数選択UIのため）
                resolve([{
                    userId: userData.userId,
                    userName: userData.userName,
                    shopId: userData.shopId,
                    shopName: shopName,
                    role: userData.role,
                    isConfigured: userData.isConfigured
                }]);

            } catch (error) {
                console.error("ユーザー情報の取得中にエラー:", error);
                alert("起動エラー: " + error.message);
                resolve(null);
            }
        });
    });
}

