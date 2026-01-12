import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseDb } from "./auth_integration.js";

let unsubscribe = null;

export function setupInventoryView(state) {
    const listBody = document.getElementById('inventory-body');
    if(!listBody) return;

    listBody.innerHTML = '<tr><td colspan="3">読み込み中...</td></tr>';

    const colRef = collection(firebaseDb, "shops", state.myShopId, "inventory");

    unsubscribe = onSnapshot(colRef, (snapshot) => {
        listBody.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-name">${data.productName}</td>
                <td class="td-price">¥${data.price}</td>
                <td class="td-qty" style="font-weight:bold;">${data.qty}</td>
            `;
            tr.onclick = () => openEditPanel(doc.id, data);
            listBody.appendChild(tr);
        });
    });
}

function openEditPanel(id, data) {
    const panel = document.getElementById('edit-panel');
    document.getElementById('edit-product-name').innerText = data.productName;
    document.getElementById('edit-price').value = data.price;
    document.getElementById('edit-qty-display').innerText = data.qty;
    
    panel.style.display = 'flex';
    
    const closeBtn = document.getElementById('btn-close-edit');
    closeBtn.onclick = () => {
        panel.style.display = 'none';
    };
}

export function detachInventoryView() {
    if (unsubscribe) unsubscribe();
}

