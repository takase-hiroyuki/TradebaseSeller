import {
    collection,
    onSnapshot,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    firebaseDb
} from "./auth_integration.js";

let unsubscribe = null;

export function setupInventoryView(state) {
    alert("inv 35");
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
            tr.onclick = () => openEditPanel(doc.ref, data, state.userId);
            listBody.appendChild(tr);
        });
    });
}

function openEditPanel(ref, data, userId) {
    const panel = document.getElementById('edit-panel');
    document.getElementById('edit-product-name').innerText = data.productName;
    document.getElementById('edit-price').value = data.price;
    document.getElementById('edit-qty-display').innerText = data.qty;
    
    // ★修正: HTMLにあるボタンの設定を読み込んで動作させる
    panel.querySelectorAll('.qty-btn').forEach(btn => {
        btn.onclick = () => {
            const disp = document.getElementById('edit-qty-display');
            const current = parseInt(disp.innerText);
            const delta = parseInt(btn.getAttribute('data-d')); // -10 や +10 を取得
            
            let nextVal = current + delta;
            if(nextVal < 0) nextVal = 0; // マイナスにはしない
            
            disp.innerText = nextVal;
        };
    });

    // パネルを表示
    panel.style.display = 'flex';
    
    const closeBtn = document.getElementById('btn-close-edit');
    closeBtn.onclick = () => {
        panel.style.display = 'none';
    };
}

export function detachInventoryView() {
    if (unsubscribe) unsubscribe();
}

// 独立させた保存処理の関数
async function saveProduct(ref, userId, btnElement) {
    const newPrice = document.getElementById('edit-price').value;
    const newQty = document.getElementById('edit-qty-display').innerText;
    const panel = document.getElementById('edit-panel');

    try {
        btnElement.innerText = "保存中...";
        await updateDoc(ref, {
            price: parseInt(newPrice),
            qty: parseInt(newQty),
            updatedAt: serverTimestamp(),
            updatedBy: userId 
        });
        panel.style.display = 'none';
    } catch (e) {
        console.error(e);
        alert("保存失敗: " + e.message);
    } finally {
        btnElement.innerText = "保存する";
    }
}

