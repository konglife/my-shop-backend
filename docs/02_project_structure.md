# **โครงสร้างโปรเจกต์ (Modern Stack: Strapi Single Application)**

เอกสารนี้อธิบายโครงสร้างไฟล์และไดเรกทอรีสำหรับ "โปรเจกต์ระบบจัดการร้าน" ที่พัฒนาด้วย **Strapi** เป็น Backend หลักและ Admin Panel ในตัว. โครงสร้างนี้จะเน้นไปที่การจัดการไฟล์และโค้ดภายในโปรเจกต์ Strapi เพื่อให้การพัฒนาและบำรุงรักษามีประสิทธิภาพ

---

## **1. ภาพรวมโครงสร้างหลักของโปรเจกต์ Strapi**

/
├── src/                      # โค้ดและตรรกะของโปรเจกต์ Strapi
│   ├── api/                  # Content Types (Modules), Controllers, Services, Policies, Middlewares
│   ├── components/           # Reusable components สำหรับ Content Types
│   ├── extensions/           # การปรับแต่ง Strapi Plugins
│   └── index.js              # จุดเริ่มต้นการทำงานของ Strapi (Bootstrap)
├── config/                   # ไฟล์ตั้งค่าต่างๆ ของ Strapi (Database, Server, Plugins)
├── public/                   # ไฟล์สาธารณะที่สามารถเข้าถึงได้ผ่าน URL (เช่น รูปภาพ)
├── database/                 # ไฟล์ข้อมูลของ SQLite (ถ้าใช้เป็น dev database) หรือ migration scripts
├── .env                      # ไฟล์เก็บค่า Environment Variables (เช่น Database Credentials)
├── package.json              # รายละเอียดโปรเจกต์และ dependencies
├── Dockerfile                # (Optional) สำหรับการ Deploy ด้วย Docker
└── README.md

---

## **2. โครงสร้างภายใน `src/api` (Strapi Content Types)**

ส่วน `src/api` คือหัวใจหลักในการจัดระเบียบ Business Logic ของคุณใน Strapi. แต่ละไดเรกทอรีภายใน `api` จะแทน **Content Type** (ซึ่งก็คือ Modules หรือ Entities ของระบบคุณ).

**ตัวอย่างโครงสร้างภายใน `src/api`:**

src/api/
├── customer/             # Content Type: ลูกค้า
│   ├── content-types/
│   │   └── customer/
│   │       ├── schema.json   # กำหนดโครงสร้าง (Fields, Relations) ของ Content Type Customer
│   │       └── lifecycles.js # ★★★ ไฟล์สำคัญ: ที่อยู่ของ Business Logic เฉพาะ Customer (เช่น ก่อน/หลังการสร้าง/อัปเดต)
│   ├── controllers/
│   │   └── customer.js   # Custom API Logic สำหรับ Customer (ถ้าจำเป็นต้องเขียนเพิ่มนอกเหนือจาก Strapi default)
│   └── services/
│       └── customer.js   # Custom Logic ที่เรียกใช้ได้จาก Controller หรือ Lifecycles Hook
├── product/              # Content Type: สินค้า
│   ├── content-types/
│   │   └── product/
│   │       ├── schema.json
│   │       └── lifecycles.js
│   ├── controllers/
│   │   └── product.js
│   └── services/
│       └── product.js
├── category/             # Content Type: หมวดหมู่สินค้า
├── supplier/             # Content Type: ผู้จัดจำหน่าย
├── stock/                # Content Type: คลังสินค้า
├── purchase/             # Content Type: ใบสั่งซื้อ
│   ├── content-types/
│   │   └── purchase/
│   │       ├── schema.json
│   │       └── lifecycles.js # ★★★ ที่อยู่ของ Business Logic สำหรับ Purchase (เช่น การเพิ่มสต็อก, คำนวณ Average Cost)
│   ├── controllers/
│   └── services/
│       └── purchase.js
├── repair-job/           # Content Type: งานซ่อม
│   ├── content-types/
│   │   └── repair-job/
│   │       ├── schema.json
│   │       └── lifecycles.js # ★★★ ที่อยู่ของ Business Logic สำหรับ RepairJob (เช่น การลดสต็อก, คำนวณ Labor Cost)
│   ├── controllers/
│   └── services/
│       └── repair-job.js # ★★★ ที่อยู่ของ Service Function (เช่น recalculatePartsCost)
├── used-part/            # Content Type: อะไหล่ที่ใช้ในงานซ่อม
│   ├── content-types/
│   │   └── used-part/
│   │       ├── schema.json
│   │       └── lifecycles.js # ★★★ ที่อยู่ของ Business Logic สำหรับ UsedPart (เช่น Trigger การคำนวณ parts_cost ใน RepairJob)
│   ├── controllers/
│   └── services/
│       └── used-part.js
├── sale/                 # Content Type: การขาย
├── sale-item/            # Content Type: รายการสินค้าในใบเสร็จ
└── dashboard/            # (Optional) ถ้ามีการสร้าง Custom Content Type สำหรับ Dashboard หรือ Aggregated Data

---

## **3. โครงสร้างภายใน `config` (การตั้งค่าระบบ)**

`config/` เป็นไดเรกทอรีที่ใช้เก็บไฟล์ตั้งค่าต่างๆ ของ Strapi:

config/
├── database.js               # การตั้งค่าการเชื่อมต่อฐานข้อมูล (สำหรับ PostgreSQL)
├── server.js                 # การตั้งค่าเซิร์ฟเวอร์ (เช่น Port, Host)
├── plugins.js                # การตั้งค่า Plugins ที่ใช้งาน
├── middlewares.js            # การตั้งค่า Global Middlewares
├── admin.js                  # การตั้งค่าส่วน Admin Panel
├── env/                      # การตั้งค่าตาม Environment (development, production)
│   ├── production/
│   │   └── database.js
│   └── staging/
│       └── database.js
└── ...

---

**หมายเหตุสำคัญสำหรับโปรเจกต์นี้:**

* **Business Logic Location:** Business Logic ที่ซับซ้อนทั้งหมด เช่น การตัดสต็อก, การเพิ่มสต็อก, การคำนวณต้นทุนเฉลี่ย, และการคำนวณค่าแรง จะถูกเขียนไว้ในไฟล์ **`lifecycles.js`** และ **`services/*.js`** ภายใต้ Content Type ที่เกี่ยวข้องใน `src/api/[content-type]/`.
* **Database:** คุณจะใช้ **PostgreSQL** เป็นฐานข้อมูลหลักที่ Strapi เชื่อมต่อและจัดเก็บข้อมูลทั้งหมด. ไฟล์ `database.js` ใน `config/` จะเป็นที่กำหนดค่าการเชื่อมต่อนี้ โดยใช้ Environment Variables ที่อยู่ในไฟล์ `.env`
* **Admin Panel:** Strapi จะสร้าง Admin Panel ให้คุณโดยอัตโนมัติตาม Content Types ที่คุณกำหนด ทำให้คุณสามารถจัดการข้อมูลได้โดยไม่ต้องพัฒนา Frontend แยกต่างหาก.
