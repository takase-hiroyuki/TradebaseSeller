// path: ~/Desktop/TradeBase/LIFF/public/inventory_action.js

import { 
	collection, 
	addDoc, 
	doc, 
	updateDoc, 
	increment, 
	serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentQty = 1;
let currentPrice = 0;
let currentProductId = "";
let currentProductName = "";

// 注文パネルを表示する
export function showOrderPanel(id, name, price) {
    const panel = document.getElementById('order-panel');
    const nameEl = document.getElementById('selected-product-name');
    const qtyEl = document.getElementById('current-qty');

    if (!panel) return;

    currentProductId = id;
    currentProductName = name;
    currentPrice = price;
    currentQty = 1;

    if (nameEl) nameEl.innerText = name;
    if (qtyEl) qtyEl.innerText = currentQty;
    
    updateTotal();
    panel.style.display = 'flex';
}

export function hideOrderPanel() {
    const panel = document.getElementById('order-panel');
    if (panel) panel.style.display = 'none';
}

export function adjustQty(delta) {
    const nextQty = currentQty + delta;
    if (nextQty >= 1) {
        currentQty = nextQty;
        const qtyEl = document.getElementById('current-qty');
        if (qtyEl) qtyEl.innerText = currentQty;
        updateTotal();
    }
}

function updateTotal() {
    const totalEl = document.getElementById('total-price');
    if (totalEl) {
        const total = currentPrice * currentQty;
        totalEl.innerText = `合計: ¥${total.toLocaleString()}`;
    }
}

export async function submitOrder(state) {
	// 安全装置: 必要なIDが揃っているか確認
	if (!state.db || !state.myShopId || !state.selectedSellerId) {
		alert("submitOrder: 注文情報が不完全です。");
		return;
	}

	try {
		// A. orders コレクションに新規注文を追加
		const orderData = {
			buyerShopId: state.myShopId,
			sellerShopId: state.selectedSellerId,
			productId: currentProductId,
			productName: currentProductName,
			initialQty: currentQty,
			status: "ORDERED",
			createdAt: serverTimestamp(),

			orderedQty: currentQty,
			orderedPrice: currentPrice,
			orderedBy: state.userId, // state.userId (sixCharId) を使用
			orderedAt: serverTimestamp() 
		};
		await addDoc(collection(state.db, "orders"), orderData);

		// B. 売り手の在庫 (inventory) を減算
		// 在庫はマイナスになることを許容するため、そのまま increment(-数量) を実行
		const inventoryRef = doc(state.db, "shops", state.selectedSellerId, "inventory", currentProductId);
		await updateDoc(inventoryRef, {
			qty: increment(-currentQty)
		});

		alert(`発注確定: ${currentProductName} × ${currentQty}`);
		hideOrderPanel();
		
	} catch (error) {
		console.error("Order Submit Error:", error);
		alert("submitOrder: 注文処理中にエラーが発生しました。");
	}
}



