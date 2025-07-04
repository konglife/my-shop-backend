# **ER Diagram (โครงสร้างฐานข้อมูลสำหรับ Strapi)**

เอกสารนี้อธิบายโครงสร้างและความสัมพันธ์ของตารางข้อมูล (Entities หรือในบริบทของ Strapi คือ **Content Types**) ทั้งหมดในระบบจัดการร้าน ซึ่งจะเป็นพิมพ์เขียวหลักสำหรับการสร้าง Content Types และกำหนด Relations ใน Strapi Admin Panel.

---

### **1. Content Types (Data Models ใน Strapi)**

นี่คือ Content Types ที่คุณจะสร้างใน Strapi โดยแต่ละ Content Type จะมี Fields และ Relations ดังนี้:

#### **Customer (ลูกค้า)**
* **หน้าที่:** เก็บข้อมูลส่วนตัวและข้อมูลติดต่อของลูกค้า
* **Fields:**
    * `name`: ชื่อ-นามสกุล (Text)
    * `phone`: เบอร์โทรศัพท์ (Text)
    * `email`: อีเมล (Email)
    * `address`: ที่อยู่ (Text Area)
* **Relations (ใน Strapi):**
    * `repair_jobs`: มี `RepairJob` ได้หลายรายการ (One-to-Many relation with `RepairJob`)
    * `sales`: มี `Sale` ได้หลายรายการ (One-to-Many relation with `Sale`)

---

#### **Product (สินค้า)**
* **หน้าที่:** เก็บข้อมูลหลักของสินค้าหรืออะไหล่
* **Fields:**
    * `name`: ชื่อสินค้า/อะไหล่ (Text)
    * `description`: รายละเอียด (Rich Text)
    * `selling_price`: ราคาขาย (Decimal)
* **Relations (ใน Strapi):**
    * `stock`: มี `Stock` ได้ 1 รายการ (One-to-One relation with `Stock`)
    * `category`: สังกัด `Category` ได้ 1 หมวดหมู่ (oneWay  relation with `Category`)
    * `unit`: สังกัด `Uint` ได้ 1 หน่วยสินค้า (oneWay relation with `Category`)

---

#### **Category (หมวดหมู่สินค้า)**
* **หน้าที่:** จัดกลุ่มประเภทของสินค้า
* **Fields:**
    * `name`: ชื่อหมวดหมู่ (Text)


---

#### **Unit (หน่วยสินค้า)**
* **หน้าที่:** จัดการหน่วยสินค้า
* **Fields:**
    * `name`: ชื่อหน่วยสินค้า (Text)

---

#### **Supplier (ผู้จัดจำหน่าย)**
* **หน้าที่:** เก็บข้อมูลผู้จัดจำหน่ายสำหรับสั่งซื้อสินค้า
* **Fields:**
    * `name`: ชื่อผู้จัดจำหน่าย (Text)
    * `contact_person`: ผู้ติดต่อ (Text)
    * `phone`: เบอร์โทรศัพท์ (Text)
    * `email`: อีเมล (Email)

---

#### **Stock (คลังสินค้า)**
* **หน้าที่:** จัดการจำนวนสินค้าคงคลังและต้นทุน
* **Fields:**
    * `quantity`: จำนวนสินค้าคงเหลือ (Number - Integer)
    * `min_quantity`: จำนวนขั้นต่ำที่ควรมีในคลัง (Number - Integer)
    * `average_cost`: ต้นทุนเฉลี่ยของสินค้า (Decimal)
* **Relations (ใน Strapi):**
    * `product`: เชื่อมโยงกับ `Product` แบบ 1-to-1 (One-to-One relation with `Product`)
        * *หมายเหตุ:* ใน Strapi One-to-One จะสร้างฟิลด์เชื่อมโยงอัตโนมัติ คุณจะต้องจัดการ Logic ให้แน่ใจว่าแต่ละ `Product` มี `Stock` เพียง 1 รายการ

---

#### **Purchase (ใบสั่งซื้อ)**
* **หน้าที่:** บันทึกประวัติการสั่งซื้อสินค้าจาก Supplier
* **Fields:**
    * `quantity`: จำนวนที่สั่งซื้อ (Number - Integer)
    * `purchase_price`: ราคาซื้อต่อหน่วย (Decimal)
    * `status_purchase`: สถานะใบสั่งซื้อ (Enumeration: `PENDING`, `RECEIVED`, `CANCELLED`)
    * `order_date`: วันที่สั่งซื้อ (Date/Time)
    * `received_date`: วันที่รับของแล้ว (Date/Time, Nullable)
* **Relations (ใน Strapi):**
    * `product`: เชื่อมโยงกับ `Product` (oneWay relation with `Product`)
    * `supplier`: เชื่อมโยงกับ `Supplier` (oneWay relation with `Supplier`)

---

#### **RepairJob (งานซ่อม)**
* **หน้าที่:** บันทึกข้อมูลและสถานะของงานซ่อม
* **Fields:**
    * `name`: ชื่องานซ่อม (Text)
    * `description`: รายละเอียดงานซ่อม (Text Area)
    * `status`: สถานะงานซ่อม (Enumeration: `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
    * `total_cost`: ราคาที่ตกลงกับลูกค้า (Decimal)
    * `parts_cost`: ต้นทุนรวมของอะไหล่ที่ใช้ (Decimal) - *คำนวณอัตโนมัติ*
    * `labor_cost`: ค่าแรง (Decimal) - *คำนวณอัตโนมัติ*
* **Relations (ใน Strapi):**
    * `customer`: เชื่อมโยงกับ `Customer` (Many-to-One relation with `Customer`)
    * `used_parts`: มี `UsedPart` ได้หลายรายการ (One-to-Many relation with `UsedPart`)

---

#### **UsedPart (อะไหล่ที่ใช้ในงานซ่อม)**
* **หน้าที่:** ตารางเชื่อม (Junction Content Type) ระหว่าง `RepairJob` และ `Product` เพื่อบันทึกอะไหล่ที่ถูกใช้ในงานซ่อม
* **Fields:**
    * `quantity`: จำนวนอะไหล่ที่ใช้ (Number - Integer)
    * `cost_at_time`: ต้นทุน ณ เวลาที่ใช้ (Decimal) - *ควรดึงมาจาก `Product.average_cost` ใน `Stock` ตอนที่เพิ่ม*
* **Relations (ใน Strapi):**
    * `repair_job`: เชื่อมโยงกับ `RepairJob` (Many-to-One relation with `RepairJob`)
    * `product`: เชื่อมโยงกับ `Product` (Many-to-One relation with `Product`)

---

#### **Sale (การขาย)**
* **หน้าที่:** บันทึกข้อมูลใบเสร็จการขายสินค้า
* **Fields:**
    * `total_amount`: ยอดรวมการขาย (Decimal) - *คำนวณอัตโนมัติ*
* **Relations (ใน Strapi):**
    * `customer`: เชื่อมโยงกับ `Customer` (Many-to-One relation with `Customer`, สามารถเป็น Optional ได้หากเป็นการขายสด)
    * `sale_items`: มี `SaleItem` ได้หลายรายการ (One-to-Many relation with `SaleItem`)

---

#### **SaleItem (รายการสินค้าในใบเสร็จ)**
* **หน้าที่:** ตารางเชื่อม (Junction Content Type) ระหว่าง `Sale` และ `Product`
* **Fields:**
    * `quantity`: จำนวนสินค้าที่ขาย (Number - Integer)
    * `price_at_time`: ราคาขาย ณ เวลานั้น (Decimal) - *ควรดึงมาจาก `Product.selling_price` ตอนที่เพิ่ม*
* **Relations (ใน Strapi):**
    * `sale`: เชื่อมโยงกับ `Sale` (Many-to-One relation with `Sale`)
    * `product`: เชื่อมโยงกับ `Product` (Many-to-One relation with `Product`)

---

### **2. ความสัมพันธ์ (Relationships) โดยสรุปในมุมมองของ Strapi**

Strapi จะสร้างความสัมพันธ์เหล่านี้เมื่อคุณกำหนดใน Admin Panel:

* **Customer ↔ RepairJob (One-to-Many):** ลูกค้า 1 คน มีงานซ่อมได้หลายงาน
* **Customer ↔ Sale (One-to-Many):** ลูกค้า 1 คน มีใบเสร็จได้หลายใบ
* **Product ↔ Stock (One-to-One):** สินค้า 1 ชนิด มีข้อมูลสต็อกได้ 1 รายการ
* **Category ↔ Product (One-to-Many):** หมวดหมู่ 1 หมวด มีสินค้าได้หลายชนิด
* **Supplier ↔ Purchase (One-to-Many):** ผู้จัดจำหน่าย 1 ราย มีใบสั่งซื้อได้หลายใบ
* **RepairJob ↔ UsedPart (One-to-Many):** งานซ่อม 1 งาน ใช้ชิ้นส่วนได้หลายรายการ
* **Sale ↔ SaleItem (One-to-Many):** ใบเสร็จ 1 ใบ มีรายการสินค้าได้หลายรายการ

---

### **3. ข้อควรพิจารณาเมื่อสร้างใน Strapi**

* **การสร้าง Content Types:** คุณจะใช้ Strapi Admin Panel ในการสร้าง Content Types และกำหนด Fields/Relations เหล่านี้ทั้งหมด. Strapi จะสร้างไฟล์ `schema.json` และ Database Tables ให้โดยอัตโนมัติ.
* **Custom Logic ใน Lifecycles:** สำหรับฟิลด์ที่ *คำนวณอัตโนมัติ* เช่น `parts_cost`, `labor_cost` ใน `RepairJob` หรือ `average_cost` ใน `Stock` คุณจะต้องเขียน **Lifecycles Hooks** หรือ **Custom Services** ในไฟล์ที่เกี่ยวข้อง (ตามที่ระบุใน `02_project_structure.md`) เพื่อจัดการ Logic การคำนวณนี้.
* **Data Types:** เลือก Data Type ที่เหมาะสมใน Strapi Admin Panel (เช่น Number-Integer/Decimal, Text/Rich Text, Email, Date/Time, Enumeration)
* **Required Fields:** กำหนดว่าฟิลด์ใดเป็น Required (ต้องกรอก) ตามความเหมาะสมของ Business Logic.
