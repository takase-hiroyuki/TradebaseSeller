import { collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseDb } from "./auth_integration.js";

let unsubscribe = null;

export function setupOrdersView(state) {
    alert("ord 37");
    const listBody = document.getElementById('orders-body');
    if(!listBody) return;
    
    listBody.innerHTML = '<tr><td colspan="4">読み込み中...</td></tr>';

    const q = query(
        collection(firebaseDb, "orders"),
        where("sellerShopId", "==", state.myShopId),
        orderBy("orderedAt", "desc")
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
        listBody.innerHTML = "";
        if (snapshot.empty) {
            listBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">注文はありません</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement('tr');
            
            // ステータスに応じたバッジ
            let statusBadge = `<span class="status-badge bg-ordered">受注</span>`;
            if(data.status === 'DELIVERED') statusBadge = `<span class="status-badge bg-delivered">出荷済</span>`;
            if(data.status === 'CANCELLED') statusBadge = `<span class="status-badge bg-cancelled">取消</span>`;
            if(data.status === 'PROPOSED') statusBadge = `<span class="status-badge bg-proposed">提案</span>`;

            tr.innerHTML = `
                <td class="td-status">${statusBadge}</td>
                <td class="td-name">${data.productName}</td>
                <td class="td-qty">${data.orderedQty}</td>
                <td class="td-price">¥${data.orderedPrice}</td>
            `;
            tr.onclick = () => alert(`注文詳細: ${data.orderId} (実装予定)`);
            listBody.appendChild(tr);
        });
    });
}

export function detachOrdersView() {
    if (unsubscribe) unsubscribe();
}

