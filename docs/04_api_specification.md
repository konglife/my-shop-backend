# **รายละเอียด API Endpoints (API Specification)**

เอกสารนี้กำหนดเส้นทาง (Endpoints) และโครงสร้างข้อมูลสำหรับ RESTful API ของระบบจัดการร้าน ซึ่งจะถูกสร้างและให้บริการโดย **Strapi**. Strapi จะสร้าง API เหล่านี้โดยอัตโนมัติตาม Content Types และ Relations ที่คุณกำหนดไว้.

### **คำอธิบายสัญลักษณ์**

* `{id}`: หมายถึง Parameter ใน URL (เช่น `/customers/123`)
* **Request Body:** โครงสร้างข้อมูล JSON ที่ Client ต้องส่งมาให้ Server
* **Response Body:** โครงสร้างข้อมูล JSON ที่ Server จะตอบกลับไป
* **Permissions:** สิทธิ์ของผู้ใช้ที่สามารถเรียกใช้ Endpoint นี้ได้ (จัดการผ่าน Strapi Admin Panel)

---

## **1. Customers Module (`/api/customers`)**

จัดการข้อมูลลูกค้าทั้งหมด (Content Type: `Customer`).

| Method | Path    | Description         | Permissions         |
| :----- | :------ | :------------------ | :------------------ |
| `POST` | `/`     | สร้างข้อมูลลูกค้าใหม่     | Authenticated User |
| `GET`  | `/`     | ดึงข้อมูลลูกค้่าทั้งหมด (รองรับ Pagination, Search, Filter) | Authenticated User |
| `GET`  | `/{id}` | ดึงข้อมูลลูกค้าเฉพาะราย | Authenticated User |
| `PUT`  | `/{id}` | อัปเดตข้อมูลลูกค้าทั้งหมด (Replace) | Authenticated User |
| `DELETE` | `/{id}` | ลบข้อมูลลูกค้า       | Admin               |

#### `POST /api/customers`

* **Request Body:**
    ```json
    {
      "name": "สมชาย ใจดี",
      "phone": "0812345678",
      "email": "somchai.j@example.com",
      "address": "123/45 ถนนสุขุมวิท กรุงเทพฯ"
    }
    ```
    * *หมายเหตุ:* `name` และ `phone` ควรถูกตั้งค่าเป็น **Required** ใน Strapi Content Type.

#### `GET /api/customers/{id}`

* **Response Body:**
    ```json
    {
      "id": 1, // Strapi จะใช้ ID เป็นตัวเลขหรือ UUID ขึ้นอยู่กับการตั้งค่า Database
      "name": "สมชาย ใจดี",
      "phone": "0812345678",
      "email": "somchai.j@example.com",
      "address": "123/45 ถนนสุขุมวิท กรุงเทพฯ",
      "createdAt": "2025-06-26T15:30:00.000Z",
      "updatedAt": "2025-06-26T15:30:00.000Z",
      "publishedAt": "2025-06-26T15:30:00.000Z" // Strapi specific
      // สามารถมี field อื่นๆ ที่ Strapi สร้างให้อัตโนมัติ เช่น createdBy, updatedBy
    }
    ```
    * *หมายเหตุ:* ใน Response ของ Strapi สำหรับ `GET /{id}` จะมีข้อมูล Relation (เช่น `repair_jobs`, `sales`) ถูกดึงมาด้วย หากมีการกำหนด `populate` ใน Request Query หรือการตั้งค่า Default Population ใน Strapi.

---

## **2. Inventory Module**

ประกอบด้วย `Products`, `Categories`, `Suppliers`, และ `Purchases`.

### **Products (`/api/products`)**

| Method | Path    | Description         | Permissions |
| :----- | :------ | :------------------ | :---------- |
| `POST` | `/`     | สร้างสินค้า/อะไหล่ใหม่ | Admin       |
| `GET`  | `/`     | ดึงข้อมูลสินค้าทั้งหมด (รองรับ Pagination, Search, Filter) | Authenticated User |
| `GET`  | `/{id}` | ดึงข้อมูลสินค้าเฉพาะชิ้น | Authenticated User |
| `PUT`  | `/{id}` | อัปเดตข้อมูลสินค้าทั้งหมด | Admin       |
| `DELETE` | `/{id}` | ลบข้อมูลสินค้า       | Admin       |

* **Request Body (`POST /api/products`):**
    ```json
    {
      "name": "น้ำมันเครื่องสังเคราะห์ 5W-30",
      "description": "สำหรับเครื่องยนต์เบนซิน ขนาด 4 ลิตร",
      "selling_price": 1200.00,
      "category": { "id": 1 } // เชื่อมโยงกับ Category ID
      "units": { "id": 1 } // เชื่อมโยงกับ Units ID
    }
    ```
    * *หมายเหตุ:* ใน Strapi การเชื่อมโยง Relation จะใช้ ID ของ Content Type ที่เกี่ยวข้อง.

* **`GET /api/products/{id}` Response Body จะมีข้อมูล `Stock` และ `Category` แนบมาด้วย (หากมีการ `populate`):**
    ```json
    {
      "id": 101,
      "name": "น้ำมันเครื่องสังเคราะห์ 5W-30",
      "description": "สำหรับเครื่องยนต์เบนซิน ขนาด 4 ลิตร",
      "selling_price": 1200.00,
      "createdAt": "2025-06-26T15:30:00.000Z",
      "updatedAt": "2025-06-26T15:30:00.000Z",
      "publishedAt": "2025-06-26T15:30:00.000Z",
      "category": { // populated category data
        "id": 1,
        "name": "อะไหล่สิ้นเปลือง"
      },
      "stock": { // populated stock data
          "id": 201,
          "quantity": 5,
          "min_quantity": 2,
          "average_cost": 850.50
      }
    }
    ```

### **Purchases (`/api/purchases`)**

| Method | Path    | Description         | Permissions |
| :----- | :------ | :------------------ | :---------- |
| `POST` | `/`     | สร้างใบสั่งซื้อใหม่ | Admin       |
| `GET`  | `/`     | ดึงข้อมูลใบสั่งซื้อทั้งหมด | Admin       |
| `GET`  | `/{id}` | ดึงข้อมูลใบสั่งซื้อเฉพาะรายการ | Admin       |
| `PUT`  | `/{id}` | อัปเดตข้อมูลใบสั่งซื้อทั้งหมด (เช่น เปลี่ยนสถานะเป็น RECEIVED) | Admin       |
| `DELETE` | `/{id}` | ลบใบสั่งซื้อ (และลดสต็อกคืนหากเคย RECEIVED) | Admin |

* **Request Body (`POST /api/purchases`):**
    ```json
    {
      "product": { "id": 101 }, // เชื่อมโยงกับ Product ID
      "supplier": { "id": 301 }, // เชื่อมโยงกับ Supplier ID
      "quantity": 10,
      "purchase_price": 870.00,
      "status_purchase": "PENDING", // หรือ "RECEIVED" หากต้องการเพิ่มสต็อกทันที
      "order_date": "2025-07-01T10:00:00.000Z"
    }
    ```
    * *หมายเหตุ:* การเพิ่มสต็อกและคำนวณต้นทุนเฉลี่ยจะเกิดขึ้นโดยอัตโนมัติเมื่อ `status_purchase` เป็น `RECEIVED` ซึ่งสามารถกำหนดได้ทั้งตอนสร้างผ่าน `POST` หรือตอนอัปเดตผ่าน `PUT /api/purchases/{id}`.

*(Endpoints สำหรับ Categories และ Suppliers จะมีรูปแบบ CRUD ที่คล้ายกันกับ Products โดยไม่มี Logic พิเศษ)*

---

## **3. Repairs Module (`/api/repair-jobs`)**

จัดการงานซ่อมและอะไหล่ที่ใช้ (Content Type: `RepairJob`, `UsedPart`).

| Method | Path              | Description         | Permissions         |
| :----- | :---------------- | :------------------ | :------------------ |
| `POST` | `/`               | สร้างงานซ่อมใหม่     | Authenticated User |
| `GET`  | `/`               | ดึงข้อมูลงานซ่อมทั้งหมด | Authenticated User |
| `GET`  | `/{id}`           | ดึงข้อมูลงานซ่อมเฉพาะรายการ | Authenticated User |
| `PUT`  | `/{id}`           | อัปเดตข้อมูลงานซ่อมทั้งหมด (รวมถึง `total_cost` ที่ผู้ใช้กรอก) | Authenticated User |
| `DELETE` | `/{id}`           | ลบงานซ่อม (และคืนสต็อกหากเคย COMPLETED) | Admin |
| `POST` | `/{id}/parts`     | **Custom Endpoint:** เพิ่มอะไหล่ที่ใช้ในงานซ่อม (`UsedPart`) | Authenticated User |
| `DELETE` | `/{jobId}/parts/{partId}` | **Custom Endpoint:** ลบอะไหล่ที่ใช้ในงานซ่อม (`UsedPart`) | Authenticated User |

#### `POST /api/repair-jobs`

* **Request Body:**
    ```json
    {
      "customer": { "id": 1 }, // เชื่อมโยงกับ Customer ID
      "description": "ลูกค้าแจ้งว่าแอร์ไม่เย็น",
      "status": "IN_PROGRESS" // Initial status
    }
    ```

#### `PUT /api/repair-jobs/{id}`

* **Request Body:**
    ```json
    {
      "total_cost": 2500.00, // ★★★ ผู้ใช้กรอกค่านี้เอง
      "description": "แก้ไขน้ำยาแอร์รั่ว",
      "status": "COMPLETED" // หรือสถานะอื่นๆ ที่ต้องการอัปเดต
      // fields อื่นๆ ที่สามารถอัปเดตได้
    }
    ```
    * *หมายเหตุ:* เมื่อมีการส่ง `status` เป็น `COMPLETED` ผ่าน Endpoint นี้ Lifecycles Hook ของ `RepairJob` จะทำการตัดสต็อกโดยอัตโนมัติ และเมื่อมีการส่ง `total_cost` จะมีการคำนวณ `labor_cost` ใหม่ด้วย

#### `POST /api/repair-jobs/{id}/parts` (สำหรับเพิ่ม `UsedPart`)

* **Request Body:**
    ```json
    {
      "product": { "id": 101 }, // เชื่อมโยงกับ Product ID
      "quantity": 1
    }
    ```
    * *หมายเหตุ:* Endpoint นี้จะถูกสร้างเป็น **Custom Endpoint/Controller**. เมื่อสร้าง `UsedPart` สำเร็จ Lifecycles Hook ของ `UsedPart` จะ Trigger ให้ `RepairJob` คำนวณ `parts_cost` ใหม่. `cost_at_time` ใน `UsedPart` ควรถูกกำหนดอัตโนมัติจาก `Product.average_cost` ณ เวลานั้น.

#### `DELETE /api/repair-jobs/{jobId}/parts/{partId}` (สำหรับลบ `UsedPart`)

* *หมายเหตุ:* Endpoint นี้จะถูกสร้างเป็น **Custom Endpoint/Controller**. เมื่อลบ `UsedPart` สำเร็จ Lifecycles Hook ของ `UsedPart` จะ Trigger ให้ `RepairJob` คำนวณ `parts_cost` ใหม่.

---

## **4. Sales Module (`/api/sales`)**

จัดการการขายหน้าร้าน (Content Type: `Sale`, `SaleItem`).

| Method | Path    | Description         | Permissions         |
| :----- | :------ | :------------------ | :------------------ |
| `POST` | `/`     | สร้างการขายใหม่ (ออกใบเสร็จ) | Authenticated User |
| `GET`  | `/`     | ดึงข้อมูลการขายทั้งหมด | Authenticated User |
| `GET`  | `/{id}` | ดึงข้อมูลการขายเฉพาะใบเสร็จ | Authenticated User |
| `PUT`  | `/{id}` | อัปเดตข้อมูลการขาย (เช่น เปลี่ยนสถานะเป็น COMPLETED เพื่อตัดสต็อก) | Authenticated User |
| `DELETE` | `/{id}` | ลบการขาย (และคืนสต็อกหากเคย COMPLETED) | Admin |

#### `POST /api/sales`

* **Request Body:**
    ```json
    {
      "customer": { "id": 1 }, // (Optional) เชื่อมโยงกับ Customer ID, หากเป็นขายสดไม่ต้องระบุ
      "status": "DRAFT", // หรือ "COMPLETED" หากต้องการให้ตัดสต็อกทันที
      "sale_items": [
        {
          "product": { "id": 101 }, // เชื่อมโยงกับ Product ID
          "quantity": 1
        },
        {
          "product": { "id": 102 },
          "quantity": 2
        }
      ]
    }
    ```
    * *หมายเหตุ:* การตัดสต็อกจะเกิดขึ้นเมื่อ `status` ของ `Sale` เป็น `COMPLETED` เท่านั้น ซึ่งสามารถกำหนดได้ทั้งตอนสร้างผ่าน `POST` หรือตอนอัปเดตผ่าน `PUT /api/sales/{id}`.
