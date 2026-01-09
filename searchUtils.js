import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    startAt,
    endAt
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseDb } from "./your-auth-file.js"; // 認証ロジックが書かれたファイル名に合わせて変更してください

/**
 * 名前の一部（前方一致）から店舗とユーザーを検索しIDを返す
 * @param {string} searchText - 検索したい文字列（店舗名または個人名）
 */
export async function searchIdsByName(searchText) {
    if (!searchText) return { shops: [], users: [] };

    // 前方一致検索のための終了文字列を生成 (例: "se" -> "se\uf8ff")
    const searchEnd = searchText + "\uf8ff";

    try {
        // 1. 店舗マスタ(shops)から検索
        const shopQuery = query(
            collection(firebaseDb, "shops"),
            orderBy("shopName"),
            startAt(searchText),
            endAt(searchEnd)
        );

        // 2. 個人アカウント(users)から検索
        const userQuery = query(
            collection(firebaseDb, "users"),
            orderBy("userName"),
            startAt(searchText),
            endAt(searchEnd)
        );

        const [shopSnap, userSnap] = await Promise.all([
            getDocs(shopQuery),
            getDocs(userQuery)
        ]);

        return {
            shops: shopSnap.docs.map(doc => ({
                id: doc.id, // shopId
                name: doc.data().shopName
            })),
            users: userSnap.docs.map(doc => ({
                id: doc.data().userId, // sixCharId
                name: doc.data().userName,
                shopId: doc.data().shopId
            }))
        };
    } catch (error) {
        console.error("Search Error:", error);
        throw error;
    }
}
