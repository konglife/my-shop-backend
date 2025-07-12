# **ภาพรวมระบบจัดการร้าน (Modern Tech Stack - ปรับปรุงใหม่)**

เอกสารนี้สรุปภาพรวมและสถาปัตยกรรมของ **"โปรเจกต์ระบบจัดการร้าน"** ที่ถูกออกแบบและพัฒนาขึ้นใหม่ด้วยเทคโนโลยีสมัยใหม่ โดยเน้นที่การใช้งาน **Strapi เป็น Core Backend และ Admin Panel** เพื่อให้ได้ระบบที่มีประสิทธิภาพ ยืดหยุ่น และง่ายต่อการบำรุงรักษา พร้อมลดภาระการพัฒนา Frontend ที่ซับซ้อนในระยะเริ่มต้น

---

### **1. ชุดเทคโนโลยี (Technology Stack)**

ระบบถูกพัฒนาขึ้นโดยใช้สถาปัตยกรรมแบบรวมศูนย์ โดย Strapi ทำหน้าที่เป็นทั้ง Backend และ Admin Panel หลัก:

* **Backend & Admin Panel:**
    * **Framework:** **Strapi** (Node.js/TypeScript based, Open-source Headless CMS)
    * **หน้าที่:** จัดการ Business Logic ทั้งหมด, สร้าง RESTful และ GraphQL API โดยอัตโนมัติ, และเป็นส่วนติดต่อผู้ใช้ (Admin Panel) หลักสำหรับผู้ดูแลระบบ (ตัวคุณเอง) ในการจัดการข้อมูล
    * **Database ORM:** Strapi จัดการให้ภายใน
* **Database:**
    * **Service:** **PostgreSQL** (Managed by Hosting Provider)
    * **หน้าที่:** เป็นศูนย์กลางในการจัดเก็บข้อมูลทั้งหมดของระบบ (Single Source of Truth)
* **Hosting:**
    * **Platform:** **Render.com** (PaaS - Platform as a Service)
    * **หน้าที่:** โฮสต์ Strapi Application และ PostgreSQL Database โดยมี Free Tier สำหรับการเริ่มต้นใช้งาน

---

### **2. สถาปัตยกรรมระบบ (System Architecture)**

ระบบประกอบด้วยส่วนหลักที่ทำงานร่วมกัน:

1.  **Strapi Application (Core Backend & Admin Panel):**
    * เป็น "สมอง" และ "หน้าตา" หลักของระบบในส่วนจัดการข้อมูลสำหรับผู้ดูแล (คุณ)
    * ทำหน้าที่จัดการตรรกะทางธุรกิจทั้งหมด และเป็น Interface สำหรับเพิ่ม, แก้ไข, ลบ, และดูข้อมูล
    * โครงสร้างถูกแบ่งตาม **Content Types** ที่สอดคล้องกับขอบเขตการทำงานแต่ละส่วน (เช่น Customers, Inventory)
    * ให้บริการข้อมูลผ่าน RESTful API Endpoints ที่ Strapi สร้างให้โดยอัตโนมัติ และมีการจัดการสิทธิ์การเข้าถึง (Permissions) ในตัว
2.  **PostgreSQL Database:**
    * เป็นฐานข้อมูลหลักที่ Strapi ใช้ในการจัดเก็บข้อมูลทั้งหมดอย่างถาวร
    * จัดการโดยผู้ให้บริการ Hosting (Render.com) เพื่อลดภาระการดูแลฐานข้อมูลของคุณ

---

### **3. โมดูลหลักของระบบ (Core Modules - ในรูปแบบของ Strapi Content Types)**

การทำงานของระบบถูกแบ่งตามหน้าที่ความรับผิดชอบออกเป็น Content Types ต่างๆ ใน Strapi ดังนี้:

#### **3.1 Customers Module (Content Type: Customer)**
* **หน้าที่:** จัดการข้อมูลทั้งหมดที่เกี่ยวกับลูกค้า
* **Data Models:** Customer (ชื่อ, เบอร์โทร, อีเมล, ที่อยู่)
* **ฟังก์ชันหลัก (ผ่าน Strapi Admin Panel):**
    * สร้าง, แก้ไข, ลบ และค้นหาข้อมูลลูกค้า
    * แสดงประวัติการซ่อมและประวัติการซื้อสินค้าของลูกค้าแต่ละราย (จะมีการเชื่อมโยงผ่าน Relation ใน Strapi)

---

#### **3.2 Inventory Module (Content Types: Product, Category, Supplier, Stock, Purchase)**
* **หน้าที่:** หัวใจหลักในการจัดการสินค้า, สต็อก, ผู้จัดจำหน่าย, และการสั่งซื้อ
* **Data Models:** Product, Category, Supplier, Stock, Purchase
* **ฟังก์ชันหลัก (ผ่าน Strapi Admin Panel และ Custom Logic):**
    * จัดการข้อมูลสินค้า (ชื่อ, รายละเอียด, ราคาขาย) และผู้จัดจำหน่าย
    * สร้างและติดตามสถานะใบสั่งซื้อสินค้า (Purchase)
    * แสดงจำนวนสินค้าคงคลัง (Stock) แบบเรียลไทม์
    * **Logic สำคัญ (ผ่าน Strapi Lifecycles Hooks/Custom Services):**
        * คำนวณราคาทุนเฉลี่ย (`average_cost`) ในตาราง `Stock` แบบ Moving Average ทุกครั้งที่มีการรับสินค้าเข้า (สถานะ `Purchase` เป็น `RECEIVED`)

---

#### **3.3 Repairs Module (Content Types: RepairJob, UsedPart)**
* **หน้าที่:** บริหารจัดการงานซ่อมและบันทึกการใช้อะไหล่
* **Data Models:** RepairJob, UsedPart
* **ฟังก์ชันหลัก (ผ่าน Strapi Admin Panel และ Custom Logic):**
    * สร้างและติดตามสถานะงานซ่อม (เช่น `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
    * บันทึกอะไหล่ (`Product`) ที่ถูกใช้ในแต่ละงานซ่อมผ่าน `UsedPart`
    * **Logic สำคัญ (ผ่าน Strapi Lifecycles Hooks/Custom Services):**
        * คำนวณค่าแรง (`labor_cost`) จาก `total_cost` (ที่ผู้ใช้กรอก) ลบด้วย `parts_cost` (ต้นทุนรวมของอะไหล่ที่ใช้)
        * `parts_cost` จะถูกคำนวณใหม่ทุกครั้งที่มีการเพิ่ม/ลบ `UsedPart` ใน `RepairJob`

---

#### **3.4 Sales Module (Content Types: Sale, SaleItem)**
* **หน้าที่:** บันทึกการขายสินค้าหน้าร้าน
* **Data Models:** Sale, SaleItem
* **ฟังก์ชันหลัก (ผ่าน Strapi Admin Panel และ Custom Logic):**
    * สร้างใบเสร็จการขาย (`Sale`)
    * บันทึกรายการสินค้าที่ขาย (`SaleItem`) ในแต่ละใบเสร็จ
    * คำนวณยอดรวมของแต่ละการขาย

---

#### **3.5 Dashboard & Reporting (ผ่าน Strapi Admin Panel และ Custom Scripts)**
* **หน้าที่:** รวบรวมและแสดงผลข้อมูลเชิงวิเคราะห์เพื่อช่วยในการตัดสินใจ
* **ฟังก์ชันหลัก:**
    * **ผ่าน Strapi Admin Panel:** ใช้ฟังก์ชันการค้นหา, กรอง, และจัดเรียงข้อมูลที่มีให้ใน Admin Panel เพื่อดูข้อมูลสรุปเบื้องต้น หรือส่งออกข้อมูลไปประมวลผลต่อได้
    * **ผ่าน Custom Scripts:** หากต้องการรายงานเชิงลึก หรือ Dashboard ที่เป็นกราฟ คุณสามารถเขียน Python/Node.js Scripts แยกต่างหากเพื่อเชื่อมต่อกับ Strapi API หรือ Database โดยตรง เพื่อดึงข้อมูลมาประมวลผลและสร้างรายงานตามที่ต้องการ

---

### **4. เวิร์กโฟลว์อัตโนมัติ (Automated Workflows - ผ่าน Strapi Lifecycles Hooks)**

ระบบจะมีการนำ Business Logic สำคัญๆ เข้าไปใน Strapi โดยใช้ **Lifecycles Hooks** (โค้ดที่จะทำงานอัตโนมัติเมื่อเกิดเหตุการณ์บางอย่าง เช่น การสร้าง/อัปเดตข้อมูล) เพื่อลดความผิดพลาดและเพิ่มประสิทธิภาพ:

* **การตัดสต็อกสินค้า (Stock Deduction):**
    * เมื่อสถานะ `Sale` (บิลขาย) ถูกเปลี่ยนเป็น `COMPLETED`.
    * เมื่อสถานะ `RepairJob` (ใบงานซ่อม) ถูกเปลี่ยนเป็น `COMPLETED`.
* **การเพิ่มสต็อกสินค้า (Stock Addition):**
    * เมื่อสถานะ `Purchase` (ใบสั่งซื้อ) ถูกเปลี่ยนเป็น `RECEIVED`.
    * เมื่อ `Sale` หรือ `RepairJob` ที่เคย `COMPLETED` ถูกเปลี่ยนเป็นสถานะอื่น หรือถูกลบ.
* **การคำนวณต้นทุน (Cost Calculation):**
    * ต้นทุนรวม (`total_cost`) ใน `RepairJob` จะถูกคำนวณใหม่ทุกครั้งที่มีการเพิ่ม/ลบ `UsedPart`
    * ต้นทุนเฉลี่ย (`average_cost`) ของ `Product` ใน `Stock` จะถูกคำนวณใหม่ทุกครั้งที่รับสินค้าเข้า
