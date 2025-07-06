
import { type Event } from '@strapi/database/dist/lifecycles';

/**
 * ฟังก์ชันสำหรับแปลงรูปแบบเบอร์โทรศัพท์ของไทยให้เป็นรูปแบบ E.164
 * @param {any} phone - เบอร์โทรศัพท์ที่ต้องการแปลง (รับเป็น any เพื่อความยืดหยุ่น)
 * @returns {string} เบอร์โทรศัพท์ที่แปลงรูปแบบแล้ว หรือค่าเดิมถ้าไม่ตรงเงื่อนไข
 */
function formatPhoneNumber(phone: any): string {
  // --- 1. ตรวจสอบเงื่อนไขของเบอร์โทรศัพท์ ---
  // - ต้องเป็น string
  // - ต้องขึ้นต้นด้วย '0'
  // - ต้องมีความยาว 10 ตัวอักษร
  if (typeof phone === 'string' && phone.startsWith('0') && phone.length === 10) {
    // --- 2. แปลงรูปแบบ ---
    // ตัด '0' ตัวแรกออก แล้วเติม '+66' เข้าไปข้างหน้า
    return `+66${phone.substring(1)}`;
  }

  // --- 3. คืนค่าเดิมถ้าไม่ตรงเงื่อนไข ---
  return phone;
}

export default {
  /**
   * beforeCreate lifecycle hook.
   * - Formats the phone number before creating a new customer.
   * @param {Event} event - The Strapi event object.
   */
  beforeCreate(event: Event) {
    const { data } = event.params;

    // --- ตรวจสอบว่ามีการส่งข้อมูล phone มาหรือไม่ ---
    if (data.phone) {
      // --- เรียกใช้ฟังก์ชันเพื่อแปลงรูปแบบเบอร์โทรศัพท์ ---
      data.phone = formatPhoneNumber(data.phone);
    }
  },

  /**
   * beforeUpdate lifecycle hook.
   * - Formats the phone number before updating a customer.
   * @param {Event} event - The Strapi event object.
   */
  beforeUpdate(event: Event) {
    const { data } = event.params;

    // --- ตรวจสอบว่ามีการส่งข้อมูล phone มาหรือไม่ ---
    // ใช้ `hasOwnProperty` เพื่อให้แน่ใจว่า property `phone` มีอยู่จริงใน data object
    if (Object.prototype.hasOwnProperty.call(data, 'phone')) {
      // --- เรียกใช้ฟังก์ชันเพื่อแปลงรูปแบบเบอร์โทรศัพท์ ---
      data.phone = formatPhoneNumber(data.phone);
    }
  },
};
