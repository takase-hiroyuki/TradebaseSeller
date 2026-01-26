# TradeBase データ構造指示書 (Ver 8.1)

## 1. 序文：階層構造の明文化
本バージョンでは、システム内の各コレクションおよびサブコレクションの「物理的な格納パス（階層構造）」を定義します。TradeBaseは店舗（shops）をデータの基点とし、権限管理とスケーラビリティを最適化した階層設計を採用します。

---

## 2. 根本的な改善方針：商品IDと階層の分離

### 商品IDの命名規則
- **形式**: `商店ID_p_連番` （例: `se1001_p_001`）
- **格納パス**: `shops/{shopId}/inventory/{productId}`
- **論理**: 商店IDをドキュメントIDに含めることで、Ordersコレクションに記録された際も、単体で「どの店の何の商品か」を逆引き可能にします。

---

## 3. データ構造定義 (階層構造明記)

### A. 共通基盤（組織・人間）

#### 1. 個人アカウント
- **パス**: `users/{userId}`
- **ID**: `sixCharId`（例: `ki1234`）
- **構造**:
	* **userId**: string (本ドキュメントのIDと同一。`sixCharId`を格納)
	* **userName**: string (個人名)
	* **shopId**: string (所属店舗ID: by1001, se1001等)
	* **role**: 'BUYER' | 'SELLER' | 'SV'
	* **status**: 'USED' | 'SUSPENDED' | 'DELETED'
	* **isConfigured**: boolean (初回設定完了フラグ)
	* **lineUserId**: string (LINEから取得した一意識別子)

#### 2. 店舗マスタ
- **パス**: `shops/{shopId}`
- **ID**: 商店ID（例: `se1001`）
- **構造**:
	* **shopId**: string (本ドキュメントのIDと同一。手動設定された商店ID)
	* **shopName**: string
	* **type**: 'BUYER' | 'SELLER'
	* **createdAt**: timestamp

---

### B. ショップドメイン（店舗配下のサブコレクション）

#### 3. 在庫リスト（売り手専用）
- **パス**: `shops/{shopId}/inventory/{productId}`
- **ID**: `商店ID_p_連番`（例: `se1001_p_001`）
- **構造**:
	* **id**: string (本ドキュメントのIDと同一。ルールに基づき生成された商品ID)
	* **productName**: string
	* **category**: string (system_master/category_definitionに準拠)
	* **price**: number
	* **qty**: number (※quantityから移行完了)
	* **updatedAt**: timestamp
	* **updatedBy**: string (最終更新者のuserId)

#### 4. 取引先設定（買い手専用）
- **パス**: `shops/{shopId}/suppliers/{sellerShopId}`
- **ID**: 売り手側の店舗ID
- **構造**:
	* **sellerShopId**: string (本ドキュメントのIDと同一。対象となる売り手の店舗ID)
	* **sellerShopName**: string (売り手の店舗名、一覧表示用冗長記録)
	* **sortOrder**: number
	* **createdAt**: timestamp

#### 5. 在庫履歴（受払帳） ★New
- **パス**: `shops/{shopId}/inventory_logs/{logId}`
- **ID**: Firestore自動生成ID（20文字程度のランダム英数字）
- **構造**:
	* **logId**: string (本ドキュメントのIDと同一。Firestoreが自動生成したキー文字列)
	* **productId**: string (対象の商品ID。例: `se1001_p_001`)
	* **productName**: string (商品名、一覧表示用冗長記録)
	* **delta**: number (増減値。例: +10, -5)
	* **resultQty**: number (変更後の確定在庫数)
	* **reason**: 'MANUAL_ADJUSTMENT' | 'ORDER_ALLOCATION' | 'ORDER_CANCEL'
	* **executedBy**: string (実行者のuserId)
	* **createdAt**: timestamp

---

### C. 取引・管理ドメイン（ルートコレクション）

#### 6. 取引履歴（注文）
- **パス**: `orders/{orderId}`
- **ID**: Firestore自動生成ID（20文字程度のランダム英数字）
- **構造**:
	* **orderId**: string (本ドキュメントのIDと同一。Firestoreが自動生成したキー文字列)
	* **buyerShopId**: string (発注元の店舗ID)
	* **sellerShopId**: string (受注先の店舗ID)
    * **productId**: string, (商品のID)
    * **productName**: string, (商品名、冗長記録)
	* **status**: 'ORDERED' | 'DELIVERED' | 'PROPOSED' | 'ACCEPTED' | 'CANCELLED'

	* **orderedQty**: number (順序1: 発注時の注文数)
	* **orderedBy**: string (順序1: 発注実行者のuserId)
	* **orderedPrice**: number (順序1: 発注時の価格)

	* **deliveredBy**: string (順序2: 配達実行者のuserId)
	* **deliveredQty**: number (順序2: 配達時の数量) // orderQty と異なる可能性がある
	* **deliveredAt**: timestamp (順序2: 配達実行日時)

	* **proposedBy**: string (順序3: 提案実行者のuserId)
	* **proposedAt**: timestamp (順序3: 提案実行日時)
	* **proposedPrice**: number (順序3: 提案された価格) // 値引きされる可能性がある

	* **acceptedBy**: string (順序4: 承諾実行者のuserId)
	* **acceptedAt**: timestamp (順序4: 承諾実行日時)

	* **cancelledBy**: string (順序5: 削除実行者のuserId)
	* **cancelledAt**: timestamp (順序5: 削除実行日時)

#### 7. システムマスタ（SV管理）
- **パス**: `system_master/{definitionName}`
- **ID**: `category_definition` 等
- **構造**:
	* **list**: Array<string> (カテゴリー名の配列)
	* **updatedBy**: string (SVのuserId)
	* **updatedAt**: timestamp

#### 8. ID発行プール
- **パス**: `id_pool/{sixCharId}`
- **ID**: 生成ロジックに基づき作成された6文字ID
- **構造**:
	* **sixCharId**: string (本ドキュメントのIDと同一。生成された6文字ID)
	* **status**: 'AVAILABLE' | 'USED'
	* **usedAt**: timestamp | null
	* **assignedTo**: string | null (使用後のuserIdを格納)

---

## 4. 運用ルール
1. **パスの不変性**: サブコレクションの構造（`shops/{id}/inventory`）は、セキュリティルールの記述根拠となるため変更を禁止します。
2. **IDの整合性**: 在庫アイテムのドキュメントIDと、フィールド内の `id` は常に一致させてください。
3. **マスタの統治**: カテゴリー名は必ずSVが定義したマスタから取得し、勝手な名称追加を禁止します。
4. **名称の柔軟性**: 商品名（productName）は、IDを変えることなくいつでも修正可能とします。
5. **履歴の義務**: 在庫数（qty）を変更する際は、必ず同時に在庫履歴（inventory_logs）への追記を行ってください（可能な限りトランザクション処理またはバッチ書き込みを利用）。 ★New

---

## 5. ID生成ロジック（Appendix）

### 憲法第3条準拠 6文字ID生成仕様
システム内で使用される `sixCharId` は、以下のアルゴリズムに従って生成する。

const CHARS_NUM = "1234567890";
const CHARS_ALPHA = "acdefghjkmnprtuvwxy";
const ALL_CHARS = CHARS_NUM + CHARS_ALPHA;

// sixCharId (User用6文字ID)
function generateConstitutionId() {
	let id = "";
	let alphaArr = CHARS_ALPHA.split("");
	// 1. アルファベットから重複なく2文字をランダム抽出
	for(let i=0; i<2; i++) {
		const idx = Math.floor(Math.random() * alphaArr.length);
		id += alphaArr.splice(idx, 1)[0];
	}
	// 2. 残りの文字プールから重複なく4文字を抽出
	let remainPool = ALL_CHARS.split("").filter(c => !id.includes(c));
	let resultArr = id.split("");
	for(let i=0; i<4; i++) {
		const idx = Math.floor(Math.random() * remainPool.length);
		resultArr.push(remainPool.splice(idx, 1)[0]);
	}

	// 3. 数字が1つも含まれない場合は不採用（nullを返す）
	if (!resultArr.some(c => CHARS_NUM.includes(c))) {
		return null;
	}
	return resultArr.join("");
}

// 使用例: 有効なIDが生成されるまでループ
// let newId;
// while (!(newId = generateConstitutionId()));
