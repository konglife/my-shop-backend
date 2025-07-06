

## **แผนการพัฒนา (Development Plan) ระบบจัดการร้านด้วย Strapi**

### **Phase 0: การเตรียมความพร้อมและตั้งค่า (Preparation & Setup)**

| \# | Task | รายละเอียด |
| :---- | :---- | :---- |
| 0.1 | **ติดตั้งเครื่องมือที่จำเป็น** | ตรวจสอบว่าคุณมี Node.js (เวอร์ชัน LTS), npm หรือ yarn, และ Git ติดตั้งบนเครื่องเรียบร้อยแล้ว |
| 0.2 | **ติดตั้ง Strapi CLI** | เปิด Terminal แล้วรันคำสั่ง: npx create-strapi-app@latest \--help เพื่อตรวจสอบว่า CLI พร้อมใช้งาน |

---

### **Phase 1: การสร้างโปรเจกต์ Strapi (Initial Project Setup)**

| \# | Task | รายละเอียด |
| :---- | :---- | :---- |
| 1.1 | **สร้างโปรเจกต์ Strapi ใหม่** | รันคำสั่งใน Terminal: npx create-strapi-app@latest my-shop-backend \--quickstart |
| 1.2 | **เลือก Database เป็น SQLite** | Strapi จะใช้ SQLite โดยอัตโนมัติเมื่อใช้ \--quickstart ซึ่งเหมาะมากสำหรับการพัฒนาในช่วงแรกตามที่คุณต้องการ |
| 1.3 | **สร้าง Admin Account** | เมื่อ Strapi เริ่มทำงานครั้งแรก (npm run develop) มันจะเปิดเบราว์เซอร์ให้คุณไปที่หน้า Admin Panel เพื่อสร้างบัญชีผู้ดูแลระบบคนแรก |
| 1.4 | **Initialize Git** | ในโฟลเดอร์โปรเจกต์ my-shop-backend ให้รัน git init และทำการ commit ครั้งแรก: git add . แล้ว git commit \-m "chore: initial strapi project setup" |

---

### **Phase 2: การสร้างโครงสร้างข้อมูล (Content-Types Setup)**

ในเฟสนี้ คุณจะใช้ **Strapi Admin Panel** (หน้าจอจัดการหลังบ้าน) เป็นหลักเพื่อสร้าง Content-Types และความสัมพันธ์ทั้งหมดตามเอกสาร 03\_er\_diagram.md **ยังไม่ต้องเขียนโค้ดใดๆ**

* **วิธีการ:** ไปที่ **Content-Type Builder** ในเมนูด้านซ้ายของ Admin Panel  
* **คำแนะนำ:** สร้าง Content-Type ที่ไม่มีความสัมพันธ์ (Relation) ที่ซับซ้อนก่อน เช่น Category, Supplier, units

| \# | Task | Fields & Relations ที่ต้องสร้าง |
| :---- | :---- | :---- |
| 2.1 | สร้าง **Category** | name (Text) |
| 2.2 | สร้าง **units** | name (Text) |
| 2.3 | สร้าง **Supplier** | name, contact\_person, phone, email (ทั้งหมดเป็น Text/Email) |
| 2.4 | สร้าง **Product** | name (Text), description (Rich Text), selling\_price (Decimal). \<br\> **Relations:** Many-to-One กับ Category, Many-to-One กับ units |
| 2.5 | สร้าง **Stock** | quantity (Integer), min\_quantity (Integer), average\_cost (Decimal). \<br\> **Relation:** One-to-One กับ Product |
| 2.6 | สร้าง **Customer** | name (Text), phone (Text), email (Email), address (Text Area) |
| 2.7 | สร้าง **Purchase** | quantity (Integer), purchase\_price (Decimal), status (Enumeration: PENDING, RECEIVED, CANCELLED), order\_date (DateTime), received\_date (DateTime). \<br\> **Relations:** Many-to-One กับ Product, Many-to-One กับ Supplier |
| 2.8 | สร้าง **RepairJob** | description (Text Area), status (Enumeration: IN\_PROGRESS, COMPLETED, CANCELLED), total\_cost (Decimal), parts\_cost (Decimal), labor\_cost (Decimal). \<br\> **Relation:** Many-to-One กับ Customer |
| 2.9 | สร้าง **UsedPart** | quantity (Integer), cost\_at\_time (Decimal). \<br\> **Relations:** Many-to-One กับ RepairJob, Many-to-One กับ Product |
| 2.10 | สร้าง **Sale** | sale\_date (DateTime), total\_amount (Decimal). \<br\> **Relation:** Many-to-One กับ Customer (ตั้งค่าใน Strapi ว่าไม่จำเป็นต้องมี หรือ Optional) |
| 2.11 | สร้าง **SaleItem** | quantity (Integer), price\_at\_time (Decimal). \<br\> **Relations:** Many-to-One กับ Sale, Many-to-One กับ Product |
| 2.12 | **ตั้งค่า Roles & Permissions** | ไปที่ Settings \-\> Roles \-\> Authenticated. ตรวจสอบและให้สิทธิ์ find, findOne กับทุก Content-Type เพื่อให้ดึงข้อมูลได้ก่อน จากนั้นค่อยปรับแก้ตาม 04\_api\_specification.md ในภายหลัง |

**เมื่อทำเสร็จแล้ว:** ให้ commit การเปลี่ยนแปลงทั้งหมด git add . และ git commit \-m "feat: setup all content types and relations"

---

### แน่นอนครับ นี่คือแผนการพัฒนา **Phase 3** ฉบับปรับปรุงใหม่แบบเต็ม ซึ่งได้รวม Logic การจัดการสต็อกทั้งขาไปและขากลับเข้าไปอย่างละเอียดตามที่คุณต้องการ

-----

### **Phase 3: การเขียน Logic อัตโนมัติ (Business Logic - Coding Phase)**

นี่คือหัวใจของการทำงาน ในเฟสนี้คุณจะใช้ `geminiCLI` ใน Terminal ของ VS Code เพื่อสร้างไฟล์ `lifecycles.js` ที่มี Logic สำคัญๆ อยู่ข้างใน

#### **Task 3.1: Logic การจัดการใบสั่งซื้อ (Purchase Lifecycle)**

  * **เป้าหมาย:** เพิ่มและลดสต็อกตามสถานะของใบสั่งซื้อ และคำนวณต้นทุนเฉลี่ยเมื่อรับของเข้า **(ไม่คำนวณย้อนกลับ)**
  * **ไฟล์ที่จะสร้าง/แก้ไข:** `src/api/purchase/content-types/purchase/lifecycles.js`
  * **คำสั่งสำหรับ `geminiCLI`:**
    ```bash
    gemini -w "src/api/purchase/content-types/purchase/lifecycles.js" "
    คุณคือ Senior Full-Stack Developer ที่เชี่ยวชาญ Strapi
    อ้างอิงข้อมูลจากไฟล์: GEMINI.md, 03_er_diagram.md

    **งานที่ต้องทำ:**
    สร้างโค้ดสำหรับ `lifecycles.js` ของ Content Type `purchase`.

    **Business Logic ที่ต้องใส่:**
    1.  **beforeUpdate(event):** ดึงข้อมูลสถานะปัจจุบันของ Purchase (`event.state.status`) เก็บไว้ เพื่อใช้เปรียบเทียบใน `afterUpdate`.
    2.  **afterUpdate(event):**
        - เปรียบเทียบสถานะเก่า (จาก `event.state.status`) กับสถานะใหม่ (`event.result.status`).
        - **กรณีรับของเข้า:** ถ้าสถานะเก่าไม่ใช่ 'RECEIVED' และสถานะใหม่เป็น 'RECEIVED', ให้ **เพิ่ม** `quantity` ใน `Stock` และ **คำนวณ `average_cost` ใหม่**.
        - **กรณียกเลิกการรับของ:** ถ้าสถานะเก่าเคยเป็น 'RECEIVED' แต่สถานะใหม่ไม่ใช่ 'RECEIVED', ให้ **ลด** `quantity` ใน `Stock` คืนตามจำนวนที่เคยรับเข้ามา. **(หมายเหตุ: จะไม่มีการคำนวณต้นทุนเฉลี่ยย้อนกลับในส่วนนี้)**
    3.  ใส่ comment ภาษาไทยอธิบาย Logic ที่สำคัญ.
    "
    ```
  * **คำอธิบาย (ภาษาไทย):** Prompt นี้จะสร้าง Logic ที่สามารถตรวจสอบการเปลี่ยนแปลงสถานะของใบสั่งซื้อได้ ทำให้ระบบสามารถเพิ่มสต็อกและคำนวณต้นทุนเฉลี่ยเมื่อรับสินค้าเข้า และยังสามารถลดสต็อกคืนได้ในกรณีที่มีการยกเลิกใบสั่งซื้อที่เคยรับไปแล้ว เพื่อให้ข้อมูลสต็อกถูกต้องเสมอ

-----

#### **Task 3.2: Logic การจัดการรายการขาย (SaleItem Lifecycle)**

  * **เป้าหมาย:** ตัดสต็อกเมื่อขายสินค้า และเพิ่มสต็อกคืนเมื่อรายการขายถูกลบ
  * **ไฟล์ที่จะสร้าง/แก้ไข:** `src/api/sale-item/content-types/sale-item/lifecycles.js`
  * **คำสั่งสำหรับ `geminiCLI`:**
    ```bash
    gemini -w "src/api/sale-item/content-types/sale-item/lifecycles.js" "
    คุณคือ Senior Full-Stack Developer ที่เชี่ยวชาญ Strapi
    อ้างอิงข้อมูลจากไฟล์: GEMINI.md, 03_er_diagram.md

    **งานที่ต้องทำ:**
    สร้างโค้ดสำหรับ `lifecycles.js` ของ `sale-item`.

    **Business Logic ที่ต้องใส่:**
    1.  **beforeCreate(event):** ดึงราคาขาย (`selling_price`) จาก Product มาใส่ใน `price_at_time` ของ SaleItem โดยอัตโนมัติ.
    2.  **afterCreate(event):** **ลด** `quantity` ใน `Stock` ของสินค้าที่เกี่ยวข้อง.
    3.  **afterDelete(event):** **เพิ่ม** `quantity` ใน `Stock` ของสินค้าที่เกี่ยวข้องคืน.
    4.  ใส่ comment ภาษาไทยอธิบาย Logic ที่สำคัญ.
    "
    ```
  * **คำอธิบาย (ภาษาไทย):** Prompt นี้จะสร้าง Logic ที่ทำงานสองทาง คือเมื่อมีการสร้างรายการขาย (`afterCreate`) ระบบจะตัดสต็อกสินค้าออกไป และในทางกลับกัน หากมีการลบรายการขายนั้นทิ้ง (`afterDelete`) ระบบก็จะนำจำนวนสินค้ากลับคืนเข้าสต็อกให้โดยอัตโนมัติ

-----

#### **Task 3.3: Logic การจัดการงานซ่อม (RepairJob Lifecycle)**

  * **เป้าหมาย:** จัดการสต็อกอะไหล่ตามสถานะงานซ่อม (ตัดออกเมื่อเสร็จ และเพิ่มคืนเมื่อยกเลิก) และคำนวณค่าแรงอัตโนมัติ
  * **ไฟล์ที่จะสร้าง/แก้ไข:** `src/api/repair-job/content-types/repair-job/lifecycles.js`
  * **คำสั่งสำหรับ `geminiCLI`:**
    ```bash
    gemini -w "src/api/repair-job/content-types/repair-job/lifecycles.js" "
    คุณคือ Senior Full-Stack Developer ที่เชี่ยวชาญ Strapi
    อ้างอิงข้อมูลจากไฟล์: GEMINI.md, 03_er_diagram.md

    **งานที่ต้องทำ:**
    สร้างโค้ดสำหรับ `lifecycles.js` ของ `repair-job`.

    **Business Logic ที่ต้องใส่:**
    1.  **beforeUpdate(event):**
        - ดึงข้อมูลสถานะปัจจุบัน (`event.state.status`) เก็บไว้.
        - คำนวณ `labor_cost` จาก `total_cost` - `parts_cost`.
    2.  **afterUpdate(event):**
        - เปรียบเทียบสถานะเก่ากับสถานะใหม่.
        - **กรณีปิดงานซ่อม:** ถ้าสถานะเก่าไม่ใช่ 'COMPLETED' และสถานะใหม่เป็น 'COMPLETED', ให้วนลูป `UsedPart` ทั้งหมดที่เกี่ยวข้องแล้ว **ลด** `quantity` ใน `Stock`.
        - **กรณียกเลิกงานซ่อม:** ถ้าสถานะเก่าเคยเป็น 'COMPLETED' แต่สถานะใหม่ไม่ใช่ 'COMPLETED', ให้วนลูป `UsedPart` ทั้งหมดแล้ว **เพิ่ม** `quantity` ใน `Stock` คืน.
    3.  ใส่ comment ภาษาไทยอธิบาย Logic ที่สำคัญ.
    "
    ```
  * **คำอธิบาย (ภาษาไทย):** Prompt นี้จะสร้าง Logic ที่ซับซ้อนสำหรับงานซ่อม โดยใช้การเปรียบเทียบสถานะก่อนและหลังการอัปเดต เพื่อให้แน่ใจว่าระบบจะตัดสต็อกอะไหล่เมื่อปิดงานซ่อมสำเร็จ และคืนสต็อกอะไหล่กลับเข้าคลังหากมีการยกเลิกงานซ่อมที่เคยเสร็จสิ้นไปแล้ว

-----

#### **Task 3.4: Logic การคำนวณต้นทุนอะไหล่ในงานซ่อม (UsedPart Lifecycle)**

  * **เป้าหมาย:** เมื่อมีการเพิ่ม/ลบ/แก้ไข `UsedPart` (อะไหล่ที่ใช้) ให้ระบบคำนวณ `parts_cost` (ต้นทุนอะไหล่รวม) ของ `RepairJob` ใหม่โดยอัตโนมัติ
  * **ไฟล์ที่จะสร้าง:** `src/api/used-part/services/used-part.js` และ `src/api/used-part/content-types/used-part/lifecycles.js`
  * **คำสั่งสำหรับ `geminiCLI` (ขั้นตอนที่ 1: สร้าง Service):**
    ```bash
    gemini -w "src/api/used-part/services/used-part.js" "
    คุณคือ Senior Full-Stack Developer ที่เชี่ยวชาญ Strapi
    อ้างอิงข้อมูลจากไฟล์: GEMINI.md, 03_er_diagram.md

    **งานที่ต้องทำ:**
    สร้างโค้ดสำหรับไฟล์ service ของ `used-part`.

    **Business Logic:**
    สร้างฟังก์ชัน `async recalculateRepairJobCosts(repairJobId)` ที่รับ `repairJobId` เข้ามา.
    1.  ภายในฟังก์ชัน ให้ find `RepairJob` พร้อมกับ `used_parts` ทั้งหมดที่เกี่ยวข้อง.
    2.  วนลูป `used_parts` ทั้งหมดเพื่อคำนวณ `parts_cost` ใหม่ (จาก `part.quantity * part.cost_at_time`).
    3.  คำนวณ `labor_cost` จาก `repairJob.total_cost - newPartsCost`.
    4.  อัปเดต `RepairJob` ด้วย `parts_cost` และ `labor_cost` ที่คำนวณได้ใหม่.
    "
    ```
  * **คำสั่งสำหรับ `geminiCLI` (ขั้นตอนที่ 2: สร้าง Lifecycles):**
    ```bash
    gemini -w "src/api/used-part/content-types/used-part/lifecycles.js" "
    คุณคือ Senior Full-Stack Developer ที่เชี่ยวชาญ Strapi
    อ้างอิงข้อมูลจากไฟล์: GEMINI.md, 03_er_diagram.md

    **งานที่ต้องทำ:**
    สร้างโค้ดสำหรับไฟล์ `lifecycles.js` ของ `used-part`.

    **Business Logic:**
    1.  **`beforeCreate`:**
        - ดึง `product` ที่ส่งมาพร้อมกับ `stock` ของมัน.
        - กำหนดค่า `data.cost_at_time` ให้เท่ากับ `product.stock.average_cost` โดยอัตโนมัติ.
    2.  **`afterCreate`, `afterUpdate`, `afterDelete`:**
        - ในทั้ง 3 hooks นี้ ให้เรียกใช้ service `strapi.service('api::used-part.used-part').recalculateRepairJobCosts(result.repair_job.id)` เพื่อ trigger การคำนวณต้นทุนใน `RepairJob` ที่เกี่ยวข้อง.
    "
    ```
  * **คำอธิบาย (ภาษาไทย):** เราแยก Logic การคำนวณที่ซับซ้อนไว้ที่ Service เพื่อให้เรียกใช้ซ้ำได้ จากนั้นใน `lifecycles.js` ของ `UsedPart` ไม่ว่าจะมีการสร้าง, แก้ไข, หรือลบอะไหล่ ระบบจะเรียกใช้ Service นี้เพื่อคำนวณต้นทุนของ `RepairJob` ใหม่เสมอ และตอนที่สร้าง `UsedPart` ระบบจะดึงต้นทุนเฉลี่ย (`average_cost`) จาก `Stock` มาบันทึกไว้ที่ `cost_at_time` อัตโนมัติ

-----

#### **Task 3.5: Logic แปลงข้อมูลเบอร์โทรศัพท์อัตโนมัติ (Phone Number Formatting)**

  * **เป้าหมาย:** เมื่อมีการสร้างหรือแก้ไขข้อมูล `Supplier` ให้ระบบตรวจสอบ field `phone` และแปลงเบอร์โทรศัพท์รูปแบบท้องถิ่น (เช่น `0812345678`) ให้เป็นรูปแบบสากล E.164 (`+66812345678`) โดยอัตโนมัติก่อนบันทึกลงฐานข้อมูล
  * **ไฟล์ที่จะสร้าง:** `src/api/supplier/content-types/supplier/lifecycles.js`
  * **คำสั่งสำหรับ `geminiCLI`:**
    ```bash
    gemini -w "src/api/supplier/content-types/supplier/lifecycles.js" "
    คุณคือ Senior Full-Stack Developer ที่เชี่ยวชาญ Strapi
    อ้างอิงข้อมูลจากไฟล์: 02_project_structure.md, 03_er_diagram.md, GEMINI.md

    **งานที่ต้องทำ:**
    สร้างโค้ดสำหรับไฟล์ `lifecycles.js` ของ Content Type `supplier`.

    **Business Logic ที่ต้องใส่ใน `beforeCreate` และ `beforeUpdate` hooks:**
    1.  สร้างฟังก์ชัน `formatPhoneNumber(phone)` ที่จะนำไปใช้ซ้ำ
    2.  ในฟังก์ชันนี้ ให้ตรวจสอบว่า `phone` ที่รับเข้ามา:
        - เป็น string
        - ขึ้นต้นด้วย '0'
        - มีความยาว 10 ตัวอักษร
    3.  ถ้าตรงตามเงื่อนไขทั้งหมด ให้แปลงรูปแบบโดยการตัด '0' ตัวหน้าออก แล้วเติม '+66' เข้าไปแทน (เช่น '0812345678' -> '+66812345678')
    4.  ถ้าไม่ตรงตามเงื่อนไข ให้คืนค่า `phone` เดิมกลับไป
    5.  ใน hook `beforeCreate(event)` และ `beforeUpdate(event)` ให้เรียกใช้ฟังก์ชันนี้เพื่อแปลงค่า `event.params.data.phone`
    6.  ใส่ comment ภาษาไทยอธิบาย Logic ที่สำคัญ
    "
    ```
  * **คำอธิบาย (ภาษาไทย):** คำสั่งนี้จะสร้าง Logic ที่ทำงานก่อนการบันทึกข้อมูล `Supplier` เสมอ เพื่อตรวจสอบและแปลงข้อมูลเบอร์โทรศัพท์ให้อยู่ในรูปแบบสากล E.164 โดยอัตโนมัติ ช่วยให้ข้อมูลในฐานข้อมูลมีมาตรฐานเดียวกันและพร้อมสำหรับนำไปใช้งานต่อในอนาคต
---

### **Phase 4: การทดสอบและปรับปรุง (Testing & Refinement)**

| \# | Task | รายละเอียด |
| :---- | :---- | :---- |
| 4.1 | **ทดสอบ Workflow การรับของ** | ลองสร้าง Product \-\> สร้าง Supplier \-\> สร้าง Purchase \-\> อัปเดตสถานะ Purchase เป็น RECEIVED \-\> ตรวจสอบใน Stock ว่าจำนวนและ average\_cost ถูกต้องหรือไม่ |
| 4.2 | **ทดสอบ Workflow งานซ่อม** | สร้าง Customer \-\> สร้าง RepairJob \-\> เพิ่ม UsedPart เข้าไปในงานซ่อม \-\> ตรวจสอบว่า parts\_cost คำนวณถูกหรือไม่ \-\> กรอก total\_cost \-\> ตรวจสอบว่า labor\_cost คำนวณถูกหรือไม่ \-\> อัปเดตสถานะเป็น COMPLETED \-\> ตรวจสอบว่า Stock ถูกตัดหรือไม่ |
| 4.3 | **ทดสอบ Workflow การขาย** | สร้าง Sale และ SaleItem \-\> ตรวจสอบว่า Stock ถูกตัดหรือไม่ และ total\_amount ใน Sale ถูกต้องหรือไม่ (ส่วนนี้อาจจะต้องทำ Custom Endpoint หรือทำ Manual) |

---

### **Phase 5: การ Deploy (Deployment)**

| \# | Task | รายละเอียด |
| :---- | :---- | :---- |
| 5.1 | **เตรียมโปรเจกต์สำหรับ Production** | แก้ไขไฟล์ config/database.js ให้รองรับการเชื่อมต่อกับ PostgreSQL โดยใช้ Environment Variables. |
| 5.2 | **สร้างโปรเจกต์บน Render.com** | สร้าง "New Web Service" สำหรับ Strapi และ "New PostgreSQL" สำหรับ Database บน Render.com |
| 5.3 | **ตั้งค่า Environment Variables** | นำข้อมูลการเชื่อมต่อจาก PostgreSQL ของ Render ไปใส่ใน Environment Variables ของ Strapi Web Service (เช่น DATABASE\_HOST, DATABASE\_PORT, DATABASE\_NAME, DATABASE\_USERNAME, DATABASE\_PASSWORD) |
| 5.4 | **Deploy โปรเจกต์** | เชื่อมต่อ GitHub repository ของคุณกับ Render Web Service เพื่อให้มีการ Deploy อัตโนมัติเมื่อมีการ push โค้ด |

ขอให้สนุกกับการพัฒนานะครับ\! แผนนี้จะช่วยให้คุณทำงานอย่างเป็นระบบและเห็นความคืบหน้าได้ชัดเจนในทุกๆ ขั้นตอนครับ หากติดขัดส่วนไหน สามารถใช้ geminiCLI ถามเฉพาะส่วนนั้นๆ ได้เลย