
import { type Event } from '@strapi/database/dist/lifecycles';

/**
 * ฟังก์ชันสำหรับแปลงรูปแบบเบอร์โทรศัพท์ของไทยให้เป็นรูปแบบ E.164
 * @param {any} phone - เบอร์โทรศัพท์ที่ต้องการแปลง (รับเป็น any เพื่อความยืดหยุ่น)
 * @returns {string} เบอร์โทรศัพท์ที่แปลงรูปแบบแล้ว หรือค่าเดิมถ้าไม่ตรงเงื่อนไข
 */
function formatPhoneNumber(phone: any): string {
  // --- 1. ตรวจสอบเงื่อนไขของเบอร์โทรศัพท์ ---
  if (typeof phone === 'string' && phone.startsWith('0') && phone.length === 10) {
    // --- 2. แปลงรูปแบบ ---
    return `+66${phone.substring(1)}`;
  }
  // --- 3. คืนค่าเดิมถ้าไม่ตรงเงื่อนไข ---
  return phone;
}

export default {
  /**
   * beforeCreate lifecycle hook.
   * - Formats the phone number before creating a new supplier.
   * @param {Event} event - The Strapi event object.
   */
  beforeCreate(event: Event) {
    const { data } = event.params;

    if (data.phone) {
      data.phone = formatPhoneNumber(data.phone);
    }
  },

  /**
   * beforeUpdate lifecycle hook.
   * - Formats the phone number before updating a supplier.
   * @param {Event} event - The Strapi event object.
   */
  beforeUpdate(event: Event) {
    const { data } = event.params;

    if (Object.prototype.hasOwnProperty.call(data, 'phone')) {
      data.phone = formatPhoneNumber(data.phone);
    }
  },
};
