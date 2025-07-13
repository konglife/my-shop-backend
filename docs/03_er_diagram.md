```mermaid
erDiagram
    CATEGORY {
        string name
    }
    CUSTOMER {
        string name
        string phone
        string email
        text address
    }
    PRODUCT {
        string name
        blocks description
        decimal selling_price
    }
    PURCHASE {
        enumeration status_purchase
        datetime order_date
        datetime received_date
    }
    PURCHASE_ITEM {
        integer quantity
        decimal unit_price
    }
    REPAIR_JOB {
        string name
        text description
        enumeration status_repair
        decimal total_cost
        decimal parts_cost
        decimal labor_cost
    }
    SALE {
        decimal total_amount
    }
    SALE_ITEM {
        integer quantity
        decimal price_at_time
        decimal cost_at_time
    }
    STOCK {
        integer quantity
        integer min_quantity
        decimal average_cost
    }
    SUPPLIER {
        string name
        string contact_person
        string phone
        email email
    }
    UNIT {
        string name
    }
    USED_PART {
        integer quantity
        decimal cost_at_time
    }

    CUSTOMER ||--o{ REPAIR_JOB : "repair_jobs"
    CUSTOMER ||--o{ SALE : "sales"
    SUPPLIER ||--o{ PURCHASE : "purchases"
    PURCHASE ||--o{ PURCHASE_ITEM : "purchase_items"
    SALE ||--o{ SALE_ITEM : "sale_items"
    REPAIR_JOB ||--o{ USED_PART : "used_parts"
    
    PRODUCT ||--|{ PURCHASE_ITEM : "product"
    PRODUCT ||--|{ SALE_ITEM : "product"
    PRODUCT ||--|{ USED_PART : "product"

    PRODUCT ||--|| CATEGORY : "category"
    PRODUCT ||--|| UNIT : "unit"
    PRODUCT ||--o{ STOCK : "stock"
```

## คำอธิบาย

**1. CATEGORY**

* **attributes**

  * `name` (string, ข้อมูลจำเป็น)
* **ความสัมพันธ์**

  * ไม่มีฝั่ง inverse ใน schema นี้ แต่แต่ละ `PRODUCT` จะชี้ไปยัง `CATEGORY` ผ่านความสัมพันธ์ one-to-one (`PRODUCT.category`)

---

**2. CUSTOMER**

* **attributes**

  * `name` (string, จำเป็น)
  * `phone` (string, ไม่จำเป็น)
  * `email` (email, ไม่จำเป็น)
  * `address` (text, ไม่จำเป็น)
* **ความสัมพันธ์**

  * **หนึ่งลูกค้า (1 CUSTOMER) สร้างได้หลายใบซ่อม (N REPAIR\_JOB)**

    * แท็กความสัมพันธ์: `repair_jobs` (one-to-many)
  * **หนึ่งลูกค้า (1 CUSTOMER) มีหลายการขาย (N SALE)**

    * แท็กความสัมพันธ์: `sales` (one-to-many)

---

**3. PRODUCT**

* **attributes**

  * `name` (string, จำเป็น)
  * `description` (blocks, ไม่จำเป็น)
  * `selling_price` (decimal, จำเป็น)
* **ความสัมพันธ์**

  * **แต่ละสินค้า (PRODUCT) มีหมวดหมู่หนึ่ง (CATEGORY)**

    * one-to-one (`category`)
  * **แต่ละสินค้า (PRODUCT) มีหน่วยนับหนึ่ง (UNIT)**

    * one-to-one (`unit`)
  * **แต่ละสินค้า (PRODUCT) มีสต็อกหนึ่ง (STOCK)**

    * one-to-one แบบสองทิศทาง (`stock`)

---

**4. PURCHASE**

* **attributes**
  * `status_purchase` (enumeration, จำเป็น: PENDING, RECEIVED, CANCELLED)
  * `order_date` (datetime, ไม่จำเป็น)
  * `received_date` (datetime, ไม่จำเป็น)
* **ความสัมพันธ์**
  * **หนึ่งใบสั่งซื้อ (1 PURCHASE) มีได้หลายรายการสินค้า (N PURCHASE_ITEM)**
    * one-to-many (`purchase_items`)
  * **หนึ่งใบสั่งซื้อ (1 PURCHASE) มาจากผู้จัดจำหน่ายหนึ่งราย (1 SUPPLIER)**
    * many-to-one (`supplier`)

---

**5. REPAIR\_JOB**

* **attributes**

  * `name` (string, จำเป็น)
  * `description` (text, ไม่จำเป็น)
  * `status_repair` (enumeration, จำเป็น)
  * `total_cost` (decimal, จำเป็น)
  * `parts_cost` (decimal, ไม่จำเป็น)
  * `labor_cost` (decimal, ไม่จำเป็น)
* **ความสัมพันธ์**

  * **การซ่อมหนึ่งรายการ (1 REPAIR\_JOB) ดำเนินการให้ลูกค้าหนึ่ง (1 CUSTOMER)**

    * many-to-one (`customer`)
  * **การซ่อมหนึ่งรายการ (1 REPAIR\_JOB) มีอะไหล่ที่ใช้หลายรายการ (N USED\_PART)**

    * one-to-many (`used_parts`)

---

**6. SALE**

* **attributes**

  * `total_amount` (decimal, จำเป็น)
* **ความสัมพันธ์**

  * **การขายหนึ่งรายการ (1 SALE) เกิดจากลูกค้าหนึ่ง (1 CUSTOMER)**

    * many-to-one (`customer`)
  * **การขายหนึ่งรายการ (1 SALE) แยกออกเป็นหลายรายการย่อย (N SALE\_ITEM)**

    * one-to-many (`sale_items`)

---

**7. SALE_ITEM**

* **attributes**
  * `quantity` (integer, จำเป็น)
  * `price_at_time` (decimal, ไม่จำเป็น, บันทึกราคาขาย ณ เวลานั้น)
  * `cost_at_time` (decimal, ไม่จำเป็น, บันทึกต้นทุน ณ เวลานั้น)
* **ความสัมพันธ์**
  * **แต่ละ sale_item เป็นส่วนหนึ่งของการขายหนึ่งรายการ (1 SALE)**
    * many-to-one (`sale`)
  * **แต่ละ sale_item คือสินค้าหนึ่งชนิด (1 PRODUCT)**
    * many-to-one (`product`)

---

**8. STOCK**

* **attributes**

  * `quantity` (integer, ไม่จำเป็น)
  * `min_quantity` (integer, ไม่จำเป็น)
  * `average_cost` (decimal, ไม่จำเป็น)
* **ความสัมพันธ์**

  * **สต็อกหนึ่ง (1 STOCK) เก็บข้อมูลสำหรับสินค้าเดียว (1 PRODUCT)**

    * one-to-one (`product`)

---

**9. SUPPLIER**

* **attributes**

  * `name` (string, จำเป็น)
  * `contact_person` (string, ไม่จำเป็น)
  * `phone` (string, ไม่จำเป็น)
  * `email` (email, ไม่จำเป็น)
* **ความสัมพันธ์**

  * **เชื่อมกับการสั่งซื้อ (PURCHASE) แบบ one-to-one**

---

**10. UNIT**

* **attributes**

  * `name` (string, จำเป็น)
* **ความสัมพันธ์**

  * **เชื่อมกับสินค้า (PRODUCT) แบบ one-to-one**

---

**11. USED_PART**

* **attributes**
  * `quantity` (integer, จำเป็น)
  * `cost_at_time` (decimal, ไม่จำเป็น, บันทึกต้นทุนอะไหล่ ณ เวลานั้น)
* **ความสัมพันธ์**
  * **อะไหล่ที่ใช้แต่ละรายการ (1 USED_PART) เป็นส่วนหนึ่งของการซ่อมหนึ่งรายการ (1 REPAIR_JOB)**
    * many-to-one (`repair_job`)
  * **อะไหล่ที่ใช้หนึ่งรายการ (1 USED_PART) คือสินค้าหนึ่งชนิด (1 PRODUCT)**
    * many-to-one (`product`)

---

**12. PURCHASE_ITEM (ใหม่)**

* **attributes**
  * `quantity` (integer, จำเป็น)
  * `unit_price` (decimal, จำเป็น, ราคาซื้อต่อหน่วย)
* **ความสัมพันธ์**
  * **รายการสั่งซื้อแต่ละรายการ (1 PURCHASE_ITEM) เป็นส่วนหนึ่งของใบสั่งซื้อหนึ่งใบ (1 PURCHASE)**
    * many-to-one (`purchase`)
  * **รายการสั่งซื้อแต่ละรายการ (1 PURCHASE_ITEM) คือสินค้าหนึ่งชนิด (1 PRODUCT)**
    * many-to-one (`product`)

---

> 🌟 อธิบายภาพรวม:
>
> * เรามี **11 Entity** หลัก ครอบคลุมตั้งแต่ข้อมูลลูกค้า, สินค้า, การขาย, การสั่งซื้อ, งานซ่อม, จนถึงอะไหล่ที่ใช้
> * ใช้ **mermaid ER Diagram** เพื่อแสดงความสัมพันธ์ (cardinality) ระหว่าง Entity แต่ละตัว
> * คำอธิบายแต่ละ Entity เขียนอย่างละเอียด ตั้งแต่ชนิดข้อมูล (type) ว่าจำเป็นหรือไม่ ถึงขอบเขตความสัมพันธ์
