# **GEMINI.md: Project Configuration & Development Guide (สำหรับ Strapi)**

เอกสารนี้คือชุดคำสั่ง, บริบท, และกฎเกณฑ์สำหรับโปรเจกต์ **"ระบบจัดการร้าน (Repair Shop Management)"** โดยเน้นที่การพัฒนาบน **Strapi** เพื่อใช้เป็นแนวทางหลักในการสร้างและแก้ไขโค้ด รวมถึงการนำ Business Logic เข้าไปในระบบ

---

## **1. Project Overview & Technology Stack (ปรับปรุงใหม่)**

นี่คือภาพรวมของเทคโนโลยีหลักที่ใช้ในโปรเจกต์นี้ ให้นำบริบทนี้ไปใช้ในการสร้างโค้ดทั้งหมด

* **Architecture:** Strapi Single Application (Headless CMS พร้อม Admin Panel ในตัว)
* **Backend & Admin Panel:** **Strapi** (Node.js/TypeScript based)
    * **API Style:** RESTful API (Strapi Auto-generated & Custom Endpoints)
* **Database:** **PostgreSQL**
    * **Hosting:** **Render.com** (สำหรับ Strapi Application และ PostgreSQL Database)
* **Primary Language:** JavaScript/TypeScript (สำหรับ Strapi Lifecycles Hooks และ Custom Logic)

---

## **2. General Instructions & Persona**

* **Persona:** ให้ทำหน้าที่เป็น "Senior Full-Stack Developer" ที่มีประสบการณ์ในการใช้ Strapi V5 และ Tech Stack นี้เป็นอย่างดี
* **Code Quality:** โค้ดที่สร้างต้องสะอาด, อ่านง่าย, และปฏิบัติตามหลักการเขียนโค้ดที่ดี
* **Comments:** ให้ใส่ comment อธิบายในส่วนของโค้ดที่มีความซับซ้อน หรือ Business Logic ที่สำคัญ โดยเฉพาะใน Lifecycles Hooks และ Custom Services
* **Language:** โค้ดและชื่อไฟล์ทั้งหมดให้เป็นภาษาอังกฤษ ส่วน comment สามารถเป็นภาษาไทยได้หากจำเป็น

---

## **3. Strapi Development Rules (การสร้างและปรับแต่ง)**

เมื่อมีการร้องขอให้สร้างส่วนของ Strapi ให้ปฏิบัติตามกฎเหล่านี้อย่างเคร่งครัด

* **Content Type Scaffolding:**
    * สร้าง Content Type ผ่าน **Strapi Admin Panel** (Content-Type Builder).
    * กำหนด Fields และ Relations ให้ถูกต้องตาม `03_er_diagram.md`.
* **Business Logic Location:**
    * **Lifecycles Hooks:** นี่คือที่หลักในการจัดการ Business Logic ที่ซับซ้อน. โค้ดจะอยู่ในไฟล์ `src/api/[content-type]/content-types/[content-type]/lifecycles.js` (หรือ `.ts`).
        * ใช้ `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete` Events ตามความเหมาะสม.
    * **Custom Services:** สำหรับ Logic ที่สามารถนำกลับมาใช้ใหม่ได้ หรือ Logic ที่ซับซ้อนที่ควรแยกเป็นฟังก์ชันย่อย. โค้ดจะอยู่ในไฟล์ `src/api/[content-type]/services/[content-type].js` (หรือ `.ts`).
        * สามารถเรียกใช้จาก Lifecycles Hooks หรือ Custom Controllers ได้.
    * **Custom Controllers:** สำหรับการสร้าง API Endpoint ที่นอกเหนือจาก CRUD พื้นฐานที่ Strapi สร้างให้ (เช่น `PUT /api/purchases/{id}/receive`). โค้ดจะอยู่ในไฟล์ `src/api/[content-type]/controllers/[content-type].js` (หรือ `.ts`).
* **Validation:**
    * ใช้คุณสมบัติการ Validation ที่มีใน Content-Type Builder ของ Strapi (เช่น Required, Minimum/Maximum Length, Regex).
    * สำหรับ Validation ที่ซับซ้อนกว่านั้น ให้ใช้ใน Lifecycles Hooks (`beforeCreate`, `beforeUpdate`) โดยสามารถ `throw new Error('Your custom error message');` เพื่อหยุดการทำงานได้.
* **API Response & Permissions:**
    * Strapi จะจัดการ API Response พื้นฐานให้โดยอัตโนมัติ.
    * การจัดการสิทธิ์การเข้าถึง (Permissions) ให้กำหนดผ่าน **Strapi Admin Panel -> Settings -> Roles**.
* **Database Interaction:**
    * ใช้ Strapi Query Engine (e.g., `strapi.db.query('api::content-type.content-type').findOne(...)` หรือ `strapi.entityService.findOne(...)`) ใน Lifecycles Hooks และ Custom Services เพื่อโต้ตอบกับฐานข้อมูล.
    * ทุกเมธอดที่ติดต่อกับฐานข้อมูลควรเป็น `async` และใช้ `await`.
* **Error Handling:**
    * ใช้ `try...catch` block ในการจัดการข้อผิดพลาดเมื่อเขียน Custom Logic.
    * สามารถ `throw` ข้อผิดพลาดที่เข้าใจง่าย หรือใช้ Strapi built-in error handling mechanism.

---

## **4. Critical Business Logic Reminders (กฎเหล็กสำหรับ Strapi)**

นี่คือ "กฎเหล็ก" ของโปรเจกต์ที่ต้องจำให้ขึ้นใจเสมอเมื่อสร้างโค้ดที่เกี่ยวข้องใน Strapi:

* **Stock Update Logic (กฎการอัปเดตสต็อกสินค้า) - (ปรับปรุงล่าสุด)**
* **ลดสต็อก (-):**
    * เมื่อ `Sale` (บิลขาย) ถูกอัปเดตสถานะเป็น `COMPLETED`.
    * เมื่อ `RepairJob` (ใบงานซ่อม) ถูกอัปเดตสถานะเป็น `COMPLETED`.
    * **[ใหม่]** เมื่อ `Purchase` (ใบสั่งซื้อ) ถูกเปลี่ยนสถานะจาก `RECEIVED` เป็นสถานะอื่น (เช่น `CANCELLED`) จะต้อง **ลดสต็อกคืน** ตามจำนวนใน `PurchaseItem` ที่เคยรับเข้ามา.

* **เพิ่มสต็อก (+):**
    * เมื่อ `Purchase` (ใบสั่งซื้อ) ถูกอัปเดตสถานะเป็น `RECEIVED` (Logic จะวนลูปผ่าน `PurchaseItem` ทุกรายการ).
    * เมื่อ `Sale` (บิลขาย) ที่เคยมีสถานะ `COMPLETED` ถูกเปลี่ยนเป็นสถานะอื่น.
    * เมื่อ `RepairJob` (ใบงานซ่อม) ที่เคยมีสถานะ `COMPLETED` ถูกเปลี่ยนเป็นสถานะอื่น.
    * **[ใหม่]** เมื่อ `Sale` (บิลขาย) ที่มีสถานะ `COMPLETED` ถูกลบ.
    * **[ใหม่]** เมื่อ `RepairJob` (ใบงานซ่อม) ที่มีสถานะ `COMPLETED` ถูกลบ.

* **Cost Calculation Logic (กฎการคำนวณต้นทุน)**
* **Average Cost (ต้นทุนเฉลี่ย):** เมื่อ `Purchase` มีสถานะเป็น `RECEIVED` (ใน `purchase` Lifecycles `afterUpdate`), จะต้องวนลูปผ่าน `PurchaseItem` แต่ละรายการเพื่อคำนวณ `average_cost` ของสินค้าในตาราง `Stock` ใหม่โดยใช้สูตร Moving Average.
    * **[ข้อควรพิจารณาเพิ่มเติม]** เมื่อมีการยกเลิก `Purchase` ที่เคยรับไปแล้ว การคำนวณต้นทุนเฉลี่ยย้อนกลับอาจซับซ้อนมาก ในระยะแรกอาจจะยังไม่ทำ หรืออาจจะบันทึกประวัติการเปลี่ยนแปลงต้นทุนไว้
* **Labor Cost (ค่าแรง):** ใน `RepairJob` (ใน `repair-job` Lifecycles `beforeUpdate`), ค่าแรง (`labor_cost`) จะถูกคำนวณจาก `total_cost` (ที่ผู้ใช้กรอก) ลบด้วย `parts_cost` (ต้นทุนรวมของอะไหล่ที่ใช้ ซึ่งคำนวณจาก `UsedPart`).
* **Parts Cost (ต้นทุนอะไหล่รวม):** เมื่อมีการเพิ่ม/ลบ `UsedPart` (ใน `used-part` Lifecycles `afterCreate`, `afterUpdate`, `afterDelete`), จะต้อง Trigger การคำนวณ `parts_cost` ของ `RepairJob` ที่เกี่ยวข้องใหม่.

* **Status-Driven Logic (กฎที่ขับเคลื่อนด้วยสถานะ) - (ปรับปรุงล่าสุด)**
* การจัดการสต็อกทั้งหมด (ทั้ง `Sale` และ `RepairJob`) จะถูกขับเคลื่อนด้วยการเปลี่ยน `status` เป็น `COMPLETED` เท่านั้น.
* **ตัวอย่างขาไป:** การตัดสต็อกจะเกิดขึ้นก็ต่อเมื่อ `Sale.status_sale` หรือ `RepairJob.status_repair` เปลี่ยนเป็น `COMPLETED`.
* **ตัวอย่างขากลับ:** การเพิ่มสต็อกคืนจะเกิดขึ้นก็ต่อเมื่อ `status` **เคยเป็น `COMPLETED`** แล้วถูกเปลี่ยนเป็นสถานะอื่น หรือเมื่อ Entity ที่มีสถานะ `COMPLETED` ถูกลบ.
* **Cascading Deletes:** เมื่อ `Sale`, `RepairJob`, หรือ `Purchase` ถูกลบ, `SaleItem`, `UsedPart`, หรือ `PurchaseItem` ที่เกี่ยวข้องจะถูกลบตามไปด้วยโดยอัตโนมัติ.

---

## **5. Git Commit Message Convention**

เมื่อมีการแนะนำให้ commit โค้ด ให้ใช้รูปแบบ **Conventional Commits** เสมอ

* **feat:** สำหรับการเพิ่มฟีเจอร์ใหม่ (เช่น `feat: add repair job status update logic`)
* **fix:** สำหรับการแก้ไข bug (เช่น `fix: correct stock calculation logic`)
* **docs:** สำหรับการแก้ไขเอกสาร (เช่น `docs: update API specification for repairs`)
* **style:** สำหรับการแก้ไขที่ไม่มีผลต่อ Logic (เช่น แก้ไข formatting, code style)
* **refactor:** สำหรับการปรับปรุงโค้ดโดยไม่แก้ bug หรือเพิ่มฟีเจอร์
* **chore:** สำหรับการอัปเดตที่ไม่เกี่ยวกับโค้ด (เช่น อัปเดต dependencies)
