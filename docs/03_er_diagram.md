# **ER Diagram (โครงสร้างฐานข้อมูลสำหรับ Strapi)**

เอกสารนี้อธิบายโครงสร้างและความสัมพันธ์ของตารางข้อมูล (Entities หรือในบริบทของ Strapi คือ **Content Types**) ทั้งหมดในระบบจัดการร้าน ซึ่งจะเป็นพิมพ์เขียวหลักสำหรับการสร้าง Content Types และกำหนด Relations ใน Strapi Admin Panel.

---

### **1. Content Types (Data Models ใน Strapi)**

#### **Customer (ลูกค้า)**
* **Fields:**
    * `name`: string, required
    * `phone`: string
    * `email`: email
    * `address`: text
* **Relations:**
    * `repair_jobs`: oneToMany → RepairJob (mappedBy: customer)
    * `sales`: oneToMany → Sale (mappedBy: customer)

---

#### **Product (สินค้า)**
* **Fields:**
    * `name`: string, required
    * `description`: blocks
    * `selling_price`: decimal, required
* **Relations:**
    * `category`: oneToOne → Category
    * `unit`: oneToOne → Unit
    * `stock`: oneToOne → Stock (mappedBy: product)

---

#### **Category (หมวดหมู่สินค้า)**
* **Fields:**
    * `name`: string, required

---

#### **Unit (หน่วยสินค้า)**
* **Fields:**
    * `name`: string, required

---

#### **Supplier (ผู้จัดจำหน่าย)**
* **Fields:**
    * `name`: string, required
    * `contact_person`: string
    * `phone`: string
    * `email`: email

---

#### **Stock (คลังสินค้า)**
* **Fields:**
    * `quantity`: integer
    * `min_quantity`: integer, default: 2
    * `average_cost`: decimal
* **Relations:**
    * `product`: oneToOne → Product (inversedBy: stock)

---

#### **Purchase (ใบสั่งซื้อ)**
* **Fields:**
    * `quantity`: integer, required
    * `purchase_price`: decimal, required
    * `status_purchase`: enumeration (`PENDING`, `RECEIVED`, `CANCELLED`), required, default: `PENDING`
    * `order_date`: datetime
    * `received_date`: datetime
* **Relations:**
    * `products`: oneToMany → Product
    * `supplier`: oneToOne → Supplier

---

#### **RepairJob (งานซ่อม)**
* **Fields:**
    * `name`: string, required
    * `description`: text
    * `status_repair`: enumeration (`IN_PROGRESS`, `COMPLETED`, `CANCELLED`), required
    * `total_cost`: decimal, required
    * `parts_cost`: decimal
    * `labor_cost`: decimal
* **Relations:**
    * `customer`: manyToOne → Customer (inversedBy: repair_jobs)
    * `used_parts`: oneToMany → UsedPart (mappedBy: repair_job)

---

#### **UsedPart (อะไหล่ที่ใช้ในงานซ่อม)**
* **Fields:**
    * `quantity`: integer, required
    * `cost_at_time`: decimal
* **Relations:**
    * `repair_job`: manyToOne → RepairJob (inversedBy: used_parts)
    * `products`: oneToMany → Product

---

#### **Sale (การขาย)**
* **Fields:**
    * `total_amount`: decimal, required
* **Relations:**
    * `customer`: manyToOne → Customer (inversedBy: sales)
    * `sale_items`: oneToMany → SaleItem (mappedBy: sale)

---

#### **SaleItem (รายการสินค้าในใบเสร็จ)**
* **Fields:**
    * `quantity`: integer, required
    * `price_at_time`: decimal
* **Relations:**
    * `sale`: manyToOne → Sale (inversedBy: sale_items)
    * `products`: oneToMany → Product

---

### **2. ความสัมพันธ์ (Relationships) โดยสรุปในมุมมองของ Strapi**

* **Customer ↔ RepairJob:** oneToMany (customer: one, repair_jobs: many)
* **Customer ↔ Sale:** oneToMany (customer: one, sales: many)
* **Product ↔ Stock:** oneToOne (product: one, stock: one)
* **Category ↔ Product:** oneToOne (category: one, product: one)
* **Supplier ↔ Purchase:** oneToOne (supplier: one, purchase: one)
* **RepairJob ↔ UsedPart:** oneToMany (repair_job: one, used_parts: many)
* **Sale ↔ SaleItem:** oneToMany (sale: one, sale_items: many)

---

### **3. หมายเหตุ**

* ฟิลด์ที่เป็น relation แบบ oneToMany, manyToOne, oneToOne, etc. อ้างอิงตาม schema จริงในแต่ละไฟล์
* ฟิลด์ที่เป็น required, default, หรือชนิดข้อมูล อ้างอิงจาก schema.json
* ฟิลด์/relations ที่ schema จริงไม่มี จะไม่แสดงในเอกสารนี้
* ฟิลด์ที่เป็น blocks (rich text) ใช้ type blocks ตาม Strapi
* ฟิลด์ที่เป็น email ใช้ type email ตาม Strapi
* ฟิลด์ที่เป็น enumeration ระบุค่าที่เป็นไปได้
* **RepairJob ↔ UsedPart (One-to-Many):** งานซ่อม 1 งาน ใช้ชิ้นส่วนได้หลายรายการ (repair_job: one, used_parts: many)
* **Sale ↔ SaleItem (One-to-Many):** ใบเสร็จ 1 ใบ มีรายการสินค้าได้หลายรายการ (sale: one, sale_items: many)

---