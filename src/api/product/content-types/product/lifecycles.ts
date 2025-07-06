
import { type Event } from '@strapi/database/dist/lifecycles';

/**
 * Lifecycle hooks for the `product` content type.
 */

export default {
  /**
   * afterCreate lifecycle hook.
   * - Automatically creates a corresponding stock entry for the new product.
   * @param {Event} event - The Strapi event object.
   */
  async afterCreate(event: Event) {
    const { result } = event;

    // --- 1. ตรวจสอบว่ามีผลลัพธ์จากการสร้าง Product หรือไม่ ---
    if (!result || !result.id) {
      console.warn('Product creation result is missing. Skipping stock creation.');
      return;
    }

    try {
      // --- 2. สร้าง Stock ที่ผูกกับ Product ที่เพิ่งสร้างขึ้น ---
      // ใช้ strapi.entityService.create เพื่อสร้างข้อมูลใหม่ใน Content Type `stock`
      await strapi.entityService.create('api::stock.stock', {
        data: {
          // --- 3. กำหนดค่าเริ่มต้นสำหรับ Stock ---
          quantity: 0,       // จำนวนสินค้าเริ่มต้น
          min_quantity: 2,   // จำนวนสินค้าขั้นต่ำที่ควรมี (สามารถปรับเปลี่ยนได้)
          average_cost: 0,   // ต้นทุนเฉลี่ยเริ่มต้น
          product: result.id, // เชื่อมความสัมพันธ์กับ Product ที่เพิ่งสร้าง
          publishedAt: new Date().toISOString(), // ทำให้ข้อมูลนี้ "published" และมองเห็นได้ทันที
        },
      });

      console.log(`Stock entry created for new product ID: ${result.id}`);

    } catch (error) {
      console.error(`Failed to create stock for product ID ${result.id}:`, error);
      // ใน Production อาจจะต้องมีการจัดการ Error ที่ซับซ้อนกว่านี้
      // เช่น การแจ้งเตือน หรือการพยายามสร้าง Stock ใหม่อีกครั้ง
    }
  },
};
