// path: ~/Desktop/TradeBase/LIFF/public/inventory_view.js

import { 
	collection, 
	query, 
	where, 
	onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// カテゴリボタンの描画（中身を書き換えるだけ）
function renderCategoryButtons(state, onRefresh) {
	const el = document.getElementById('cat-tabs');
	if (!el) return;
	el.innerHTML = "";
	state.categories.forEach(cat => {
		const btn = document.createElement('button');
		btn.innerText = cat;
		btn.className = `category-btn ${state.selectedCategory === cat ? 'active' : ''}`;
		// スタイルはCSSに逃がすのが理想ですが、現状に合わせて最低限に
		btn.style.cssText = `flex:0 0 auto; padding:6px 15px; border-radius:20px; border:1px solid #ddd; font-size:0.9em; ${state.selectedCategory === cat ? 'background:#00b900; color:white;' : ''}`;
		btn.onclick = () => {
			state.selectedCategory = cat;
			renderCategoryButtons(state, onRefresh);
			onRefresh();
		};
		el.appendChild(btn);
	});
}

// 取引先ボタンの描画
function renderSupplierButtons(state, onRefresh) {
	const el = document.getElementById('sup-tabs');
	if (!el) return;
	el.innerHTML = "";
	state.suppliers.forEach(sup => {
		const btn = document.createElement('button');
		btn.innerText = sup.name;
		btn.style.cssText = `flex:0 0 auto; padding:4px 12px; border-radius:4px; border:1px solid #eee; font-size:0.8em; white-space:nowrap; ${state.selectedSellerId === sup.id ? 'background:#f0f0f0; border:2px solid #00b900;' : 'background:white;'}`;
		btn.onclick = () => {
			state.selectedSellerId = sup.id;
			renderSupplierButtons(state, onRefresh);
			onRefresh();
		};
		el.appendChild(btn);
	});
}

// フィルタ全体を更新する
export function setupInventoryFilters(state, onRefresh) {
	renderCategoryButtons(state, onRefresh);
	renderSupplierButtons(state, onRefresh);
}

export function refreshInventory(state) {
	const body = document.getElementById('inventory-body'); // ターゲットを tbody に変更
	const container = document.getElementById('inventory-items'); // テーブル全体を囲む div
	
	if (!body || !state.selectedSellerId) return;

	if (state.inventoryUnsubscribe) {
		state.inventoryUnsubscribe();
		state.inventoryUnsubscribe = null;
	}

	const q = query(collection(state.db, "shops", state.selectedSellerId, "inventory"),
		where("category", "==", state.selectedCategory));

	state.inventoryUnsubscribe = onSnapshot(q, (snap) => {
		if (snap.empty) {
			// 在庫がない場合は tbody を空にして、メッセージを表示
			body.innerHTML = "";
			container.classList.add('is-empty');
			body.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">在庫はありません。</td></tr>`;
			return;
		}

		let html = "";
		snap.forEach(d => {
			const item = d.data();
			const stockQty = item.qty !== undefined ? item.qty : 0;

			html += `
				<tr class="inventory-row" 
					data-id="${d.id}" 
					data-name="${item.productName}" 
					data-price="${item.price}" 
					data-qty="${stockQty}">
					<td class="td-name">${item.productName}</td>
					<td class="td-price">¥${Number(item.price).toLocaleString()}</td>
					<td class="td-qty">${stockQty.toLocaleString()}</td>
				</tr>`;
		});
		body.innerHTML = html;
	});
}

