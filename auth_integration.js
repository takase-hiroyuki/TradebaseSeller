// 修正前: const liff = window.liff;
alert("index.js: auth 02");

const liff = window.liff || (window.parent && window.parent.liff);

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
	getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCeStPC-Y04SKp6uOj7yLQNHH8_gBxOwlY",
    authDomain: "tradebaseliff.firebaseapp.com",
    projectId: "tradebaseliff",
    storageBucket: "tradebaseliff.firebasestorage.app",
    messagingSenderId: "428094541578",
    appId: "1:428094541578:web:fa109dc64e327afa3734f3"
};

const app = initializeApp(firebaseConfig);
export const firebaseDb = getFirestore(app);

alert("index.js: auth 32");

export async function getAuthenticatedUserContext() {
    await liff.init({ liffId: "2008802651-ZJlLamw2" });
    if (!liff.isLoggedIn()) {
        liff.login();
        return null;
    }
    const profile = await liff.getProfile();
    const userSnap = await getDocs(
		query(
			collection(firebaseDb, "users"),
			where("lineUserId", "==", profile.userId)
		)
	);
    
    if (userSnap.empty) {
        window.location.href = 'buyer_first_setup.html';
        return null;
    }

    const shopPromises = userSnap.docs.map(async (uDoc) => {
        const uData = uDoc.data();
        const sSnap = await getDoc(doc(firebaseDb, "shops", uData.shopId));
        return {
            shopId: uData.shopId,
            shopName: sSnap.exists() ? sSnap.data().shopName : uData.shopId,
            userName: uData.userName,
			userId: uData.userId
        };
    });
    
    return await Promise.all(shopPromises);
}

