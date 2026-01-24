alert("auth 17");

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

                // データを配列に格納する
                const contextList = [];
                
                if (userData.lineUserId) {
                    // LINE IDが一致するユーザーをすべて取得
                    const q = query(collection(firebaseDb, "users"), where("lineUserId", "==", userData.lineUserId));
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach(doc => contextList.push(doc.data()));
                } else {
                    // LINE連携していない場合は、自分自身だけを追加
                    contextList.push(userData);
                }
                
                // 全員の店舗名を取得して、正式なリストを作成する
                const finalResult = await Promise.all(contextList.map(async (user) => {
                    let sName = "未所属";
                    if (user.shopId) {
                        try {
                            const sRef = doc(firebaseDb, "shops", user.shopId);
                            const sSnap = await getDoc(sRef);
                            if (sSnap.exists()) sName = sSnap.data().shopName;
                        } catch (e) {
                            sName = "取得エラー";
                        }
                    }
                    
                    return {
                        userId: user.userId,
                        userName: user.userName,
                        shopId: user.shopId,
                        shopName: sName,
                        role: user.role,
                        isConfigured: user.isConfigured
                    };
                }));

                resolve(finalResult);

            } catch (error) {
                console.error("ユーザー情報の取得中にエラー:", error);
                alert("起動エラー: " + error.message);
                resolve(null);
            }
        });
    });
}

