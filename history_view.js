// path: ~/Desktop/TradeBase/LIFF/public/history_view.js

import {
	collection, query, where, onSnapshot, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// 履歴用の取引先ボタンを描画する
export function setupHistoryFilters(state, onRefresh) {
	// view-history の中にある sup-tabs を特定して取得
	const historyView = document.getElementById('view-history');
	const el = historyView ? historyView.querySelector('#history-sup-tabs') : null;

	if (!el) return;
	el.innerHTML = "";

	state.suppliers.forEach(sup => {
		const btn = document.createElement('button');
		btn.innerText = sup.name;
		// スタイルは inventory_view.js の実装に合わせる
		btn.style.cssText = `flex:0 0 auto; padding:4px 12px; border-radius:4px; border:1px solid #eee; font-size:0.8em; white-space:nowrap; ${state.selectedSellerId === sup.id ? 'background:#f0f0f0; border:2px solid #00b900;' : 'background:white;'}`;

		btn.onclick = () => {
			state.selectedSellerId = sup.id;
			// ボタンの見た目を更新
			setupHistoryFilters(state, onRefresh);
			onRefresh();
		};
		el.appendChild(btn);
	});
}

/*
export function setupHistoryFilters(state, onRefresh) {
	renderHistorySupplierButtons(state, onRefresh)
}
*/

export function refreshHistory(state) {
	const body = document.getElementById('history-body');
	if (!body) return;

	// 1. 既存のリスナーがあれば解除（二重登録防止）
	if (state.historyUnsubscribe) {
		state.historyUnsubscribe();
		state.historyUnsubscribe = null;
	}

	const q = query(
		collection(state.db, "orders"), 
		where("buyerShopId", "==", state.myShopId),
		where("sellerShopId", "==", state.selectedSellerId)
	);

	// 4. Firestore監視開始
	state.historyUnsubscribe = onSnapshot(q, (snap) => {
		if (snap.empty) {
			body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">履歴はありません</td></tr>';
			return;
		}

		let html = "";
		// クライアント側でソート（FirestoreのIndex設定が不要なため安全）
		const docs = snap.docs.sort(
			(a, b) => (b.data().createdAt?.toMillis() || 0) - (a.data().createdAt?.toMillis() || 0)
		);

		docs.forEach(d => {
			const o = d.data();
			const dateStr = o.createdAt?.toDate().toLocaleDateString('ja-JP', {month:'numeric', day:'numeric'}) || "-";
			const timeStr = o.createdAt?.toDate().toLocaleTimeString('ja-JP', {hour:'2-digit', minute:'2-digit'}) || "";

			let statusKanji = "";
			let displayPrice = o.initialPrice || 0;
			let displayQty = o.initialQty || 0;

			switch (o.status) {
				case "ORDERED":
					statusKanji = "未収";
					displayPrice = o.initialPrice;
					displayQty = o.initialQty;
					break;
				case "DELIVERED":
					statusKanji = "受取";
					displayPrice = o.finalPrice || o.proposedPrice || o.initialPrice;
					displayQty = o.finalQty || o.deliveredQty || o.initialQty;
					break;
				case "PROPOSED":
					statusKanji = "提案";
					displayPrice = o.proposedPrice || o.initialPrice;
					displayQty = o.initialQty;
					break;
				case "ACCEPTED":
					statusKanji = "承認";
					displayPrice = o.proposedPrice || o.initialPrice;
					displayQty = o.initialQty;
					break;
				case "CANCELLED":
					statusKanji = "削除";
					displayPrice = o.initialPrice;
					displayQty = o.initialQty;
					break;
				default:
					statusKanji = o.status;
			}

			const totalAmount = (displayPrice * displayQty).toLocaleString();

			html += `
				<tr class="history-row" 
					data-id="${d.id}"
					data-name="${o.productName}"
					data-status-id="${o.status}"
					data-status-kanji="${statusKanji}"
					data-price="${displayPrice}"
					data-qty="${displayQty}"
					data-total="${totalAmount}"
					data-time="${dateStr} ${timeStr}">
					<td class="td-status">
						<span class="status-badge bg-${o.status.toLowerCase()}">${statusKanji}</span>
					</td>
					<td class="td-time">${dateStr}<br />${timeStr}</td>
					<td class="td-name">${o.productName}</td>
					<td class="td-price">¥${Number(displayPrice).toLocaleString()}</td>
					<td class="td-qty">${displayQty}</td>
					<td class="td-total">¥${totalAmount}</td>
				</tr>`;
		});
		body.innerHTML = html;
	});
}


