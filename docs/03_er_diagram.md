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
    * `repair_jobs`: มี `RepairJob` ได้หลายรายการ (One-to-Many relation with `RepairJob`, mappedBy: `customer`)
    * `sales`: มี `Sale` ได้หลายรายการ (One-to-Many relation with `Sale`, mappedBy: `customer`)

---

#### **Product (สินค้า)**
* **หน้าที่:** เก็บข้อมูลหลักของสินค้าหรืออะไหล่
* **Fields:**
    * `name`: ชื่อสินค้า/อะไหล่ (Text)
    * `description`: รายละเอียด (Rich Text)
    * `selling_price`: ราคาขาย (Decimal)
* **Relations (ใน Strapi):**
    * `category`: สังกัด `Category` ได้ 1 หมวดหมู่ (oneToOne relation with `Category`)
    * `unit`: สังกัด `Unit` ได้ 1 หน่วยสินค้า (oneToOne relation with `Unit`)
    * `stock`: มี `Stock` ได้ 1 รายการ (One-to-One relation with `Stock`, mappedBy: `product`)

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
    * `quantity`: จำนวนสินค้าคงเหลือ (Integer)
    * `min_quantity`: จำนวนขั้นต่ำที่ควรมีในคลัง (Integer, default: 2)
    * `average_cost`: ต้นทุนเฉลี่ยของสินค้า (Decimal)
* **Relations (ใน Strapi):**
    * `product`: เชื่อมโยงกับ `Product` แบบ 1-to-1 (One-to-One relation with `Product`, inversedBy: `stock`)

---

#### **Purchase (ใบสั่งซื้อ)**
* **หน้าที่:** บันทึกประวัติการสั่งซื้อสินค้าจาก Supplier
* **Fields:**
    * `quantity`: จำนวนที่สั่งซื้อ (Integer)
    * `purchase_price`: ราคาซื้อต่อหน่วย (Decimal)
    * `status_purchase`: สถานะใบสั่งซื้อ (Enumeration: `PENDING`, `RECEIVED`, `CANCELLED`)
    * `order_date`: วันที่สั่งซื้อ (Date/Time)
    * `received_date`: วันที่รับของแล้ว (Date/Time)
* **Relations (ใน Strapi):**
    * `products`: เชื่อมโยงกับ `Product` (oneToMany relation with `Product`)
    * `supplier`: เชื่อมโยงกับ `Supplier` (oneToOne relation with `Supplier`)

---

#### **RepairJob (งานซ่อม)**
* **หน้าที่:** บันทึกข้อมูลและสถานะของงานซ่อม
* **Fields:**
    * `name`: ชื่องานซ่อม (Text)
    * `description`: รายละเอียดงานซ่อม (Text Area)
    * `status_repair`: สถานะงานซ่อม (Enumeration: `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
    * `total_cost`: ราคาที่ตกลงกับลูกค้า (Decimal)
    * `parts_cost`: ต้นทุนรวมของอะไหล่ที่ใช้ (Decimal)
    * `labor_cost`: ค่าแรง (Decimal)
* **Relations (ใน Strapi):**
    * `customer`: เชื่อมโยงกับ `Customer` (Many-to-One relation with `Customer`, inversedBy: `repair_jobs`)
    * `used_parts`: มี `UsedPart` ได้หลายรายการ (One-to-Many relation with `UsedPart`, mappedBy: `repair_job`)

---

#### **UsedPart (อะไหล่ที่ใช้ในงานซ่อม)**
* **หน้าที่:** ตารางเชื่อม (Junction Content Type) ระหว่าง `RepairJob` และ `Product` เพื่อบันทึกอะไหล่ที่ถูกใช้ในงานซ่อม
* **Fields:**
    * `quantity`: จำนวนอะไหล่ที่ใช้ (Integer)
    * `cost_at_time`: ต้นทุน ณ เวลาที่ใช้ (Decimal)
* **Relations (ใน Strapi):**
    * `repair_job`: เชื่อมโยงกับ `RepairJob` (Many-to-One relation with `RepairJob`, inversedBy: `used_parts`)
    * `product`: เชื่อมโยงกับ `Product` (oneToOne relation with `Product`)

---

#### **Sale (การขาย)**
* **หน้าที่:** บันทึกข้อมูลใบเสร็จการขายสินค้า
* **Fields:**
    * `total_amount`: ยอดรวมการขาย (Decimal)
* **Relations (ใน Strapi):**
    * `customer`: เชื่อมโยงกับ `Customer` (Many-to-One relation with `Customer`, inversedBy: `sales`)
    * `sale_items`: มี `SaleItem` ได้หลายรายการ (One-to-Many relation with `SaleItem`, mappedBy: `sale`)

---

#### **SaleItem (รายการสินค้าในใบเสร็จ)**
* **หน้าที่:** ตารางเชื่อม (Junction Content Type) ระหว่าง `Sale` และ `Product`
* **Fields:**
    * `quantity`: จำนวนสินค้าที่ขาย (Integer)
    * `price_at_time`: ราคาขาย ณ เวลานั้น (Decimal)
* **Relations (ใน Strapi):**
    * `sale`: เชื่อมโยงกับ `Sale` (Many-to-One relation with `Sale`, inversedBy: `sale_items`)
    * `product`: เชื่อมโยงกับ `Product` (oneToOne relation with `Product`)

---

### **2. ความสัมพันธ์ (Relationships) โดยสรุปในมุมมองของ Strapi**

* **Customer ↔ RepairJob (One-to-Many):** ลูกค้า 1 คน มีงานซ่อมได้หลายงาน (customer: one, repair_jobs: many)
* **Customer ↔ Sale (One-to-Many):** ลูกค้า 1 คน มีใบเสร็จได้หลายใบ (customer: one, sales: many)
* **Product ↔ Stock (One-to-One):** สินค้า 1 ชนิด มีข้อมูลสต็อกได้ 1 รายการ (product: one, stock: one)
* **Category ↔ Product (One-to-One, ฝั่ง Product):** สินค้า 1 ชิ้น มีหมวดหมู่เดียว (category: one, product: one)
* **Supplier ↔ Purchase (One-to-One, ฝั่ง Purchase):** ใบสั่งซื้อ 1 ใบ มี supplier เดียว (supplier: one, purchase: one)
* **RepairJob ↔ UsedPart (One-to-Many):** งานซ่อม 1 งาน ใช้ชิ้นส่วนได้หลายรายการ (repair_job: one, used_parts: many)
* **Sale ↔ SaleItem (One-to-Many):** ใบเสร็จ 1 ใบ มีรายการสินค้าได้หลายรายการ (sale: one, sale_items: many)

---

### **3. ข้อควรพิจารณาเมื่อสร้างใน Strapi**

* **การสร้าง Content Types:** คุณจะใช้ Strapi Admin Panel ในการสร้าง Content Types และกำหนด Fields/Relations เหล่านี้ทั้งหมด. Strapi จะสร้างไฟล์ `schema.json` และ Database Tables ให้โดยอัตโนมัติ.
* **Custom Logic ใน Lifecycles:** สำหรับฟิลด์ที่ *คำนวณอัตโนมัติ* เช่น `parts_cost`, `labor_cost` ใน `RepairJob` หรือ `average_cost` ใน `Stock` คุณจะต้องเขียน **Lifecycles Hooks** หรือ **Custom Services** ในไฟล์ที่เกี่ยวข้อง (ตามที่ระบุใน `02_project_structure.md`) เพื่อจัดการ Logic การคำนวณนี้.
* **Data Types:** เลือก Data Type ที่เหมาะสมใน Strapi Admin Panel (เช่น Number-Integer/Decimal, Text/Rich Text, Email, Date/Time, Enumeration)
* **Required Fields:** กำหนดว่าฟิลด์ใดเป็น Required (ต้องกรอก) ตามความเหมาะสมของ Business Logic.
* **การสร้าง Content Types:** คุณจะใช้ Strapi Admin Panel ในการสร้าง Content Types และกำหนด Fields/Relations เหล่านี้ทั้งหมด. Strapi จะสร้างไฟล์ `schema.json` และ Database Tables ให้โดยอัตโนมัติ.
* **Custom Logic ใน Lifecycles:** สำหรับฟิลด์ที่ *คำนวณอัตโนมัติ* เช่น `parts_cost`, `labor_cost` ใน `RepairJob` หรือ `average_cost` ใน `Stock` คุณจะต้องเขียน **Lifecycles Hooks** หรือ **Custom Services** ในไฟล์ที่เกี่ยวข้อง (ตามที่ระบุใน `02_project_structure.md`) เพื่อจัดการ Logic การคำนวณนี้.
* **Data Types:** เลือก Data Type ที่เหมาะสมใน Strapi Admin Panel (เช่น Number-Integer/Decimal, Text/Rich Text, Email, Date/Time, Enumeration)
* **Required Fields:** กำหนดว่าฟิลด์ใดเป็น Required (ต้องกรอก) ตามความเหมาะสมของ Business Logic.
