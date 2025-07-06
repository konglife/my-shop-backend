
"use strict";

/**
 * Lifecycle hooks for the `used-part` content type.
 */

module.exports = {
  /**
   * beforeCreate lifecycle hook.
   * - Fetches the product's average cost from stock and sets it as `cost_at_time`.
   * @param {object} event - The Strapi event object.
   */
  async beforeCreate(event) {
    const { data } = event.params;

    // --- 1. ตรวจสอบว่ามีการส่งข้อมูล product มาหรือไม่ ---
    // data.product อาจเป็น ID โดยตรง หรือ object เช่น { connect: [{ id: ... }] }
    const productId = data.product?.connect?.[0]?.id || data.product;

    if (productId) {
      try {
        // --- 2. ค้นหาสต็อกของสินค้านั้นเพื่อดึงต้นทุนเฉลี่ย (average_cost) ---
        const stock = await strapi.db.query('api::stock.stock').findOne({
          where: { product: productId },
        });

        if (stock && typeof stock.average_cost === 'number') {
          // --- 3. กำหนดต้นทุน ณ เวลาที่ใช้ (cost_at_time) ---
          // เพื่อเก็บประวัติของต้นทุนอะไหล่ชิ้นนี้ แม้ว่าต้นทุนเฉลี่ยในอนาคตจะเปลี่ยนไป
          data.cost_at_time = stock.average_cost;
        } else {
          // ถ้าไม่เจอสต็อก หรือไม่มีต้นทุนเฉลี่ย ให้หยุดการทำงาน
          // เพราะเราไม่สามารถเพิ่มอะไหล่ที่ไม่มีข้อมูลต้นทุนได้
          throw new Error(`Stock for product ID ${productId} not found or has no average cost.`);
        }
      } catch (error) {
        console.error("Error in beforeCreate for used-part:", error);
        throw error; // ส่ง error ต่อเพื่อให้ transaction ล้มเหลว
      }
    }
  },

  /**
   * afterCreate lifecycle hook.
   * - Triggers cost recalculation for the associated repair job.
   * @param {object} event - The Strapi event object.
   */
  async afterCreate(event) {
    const { result } = event;
    const repairJobId = result.repair_job?.id;

    if (repairJobId) {
      // --- เรียกใช้ Service เพื่อคำนวณต้นทุนของ RepairJob ใหม่ ---
      await strapi.service('api::used-part.used-part').recalculateRepairJobCosts(repairJobId);
    }
  },

  /**
   * afterUpdate lifecycle hook.
   * - Triggers cost recalculation for the associated repair job(s).
   * @param {object} event - The Strapi event object.
   */
  async afterUpdate(event) {
    const { result, state } = event; // result คือข้อมูลใหม่, state คือข้อมูลเก่า

    const newRepairJobId = result.repair_job?.id;
    const oldRepairJobId = state.repair_job?.id;

    // --- คำนวณต้นทุนของ RepairJob ใหม่เสมอ ---
    if (newRepairJobId) {
      await strapi.service('api::used-part.used-part').recalculateRepairJobCosts(newRepairJobId);
    }

    // --- กรณีพิเศษ: ถ้ามีการย้าย UsedPart ไปยัง RepairJob อื่น ---
    // เราต้องคำนวณต้นทุนของ RepairJob เก่าใหม่ด้วย เพื่อให้ข้อมูลถูกต้อง
    if (oldRepairJobId && oldRepairJobId !== newRepairJobId) {
      await strapi.service('api::used-part.used-part').recalculateRepairJobCosts(oldRepairJobId);
    }
  },

  /**
   * afterDelete lifecycle hook.
   * - Triggers cost recalculation for the associated repair job.
   * @param {object} event - The Strapi event object.
   */
  async afterDelete(event) {
    const { result } = event; // result คือข้อมูลของ item ที่ถูกลบไป
    const repairJobId = result.repair_job?.id;

    if (repairJobId) {
      // --- เรียกใช้ Service เพื่อคำนวณต้นทุนของ RepairJob ใหม่ ---
      await strapi.service('api::used-part.used-part').recalculateRepairJobCosts(repairJobId);
    }
  },
};
