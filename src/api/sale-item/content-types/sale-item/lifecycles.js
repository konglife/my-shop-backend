
"use strict";

/**
 * Lifecycle hooks for the `sale-item` content type.
 */

module.exports = {
  /**
   * beforeCreate lifecycle hook.
   * - Automatically fetches the product's selling price and sets it as `price_at_time`.
   * @param {object} event - The Strapi event object.
   */
  async beforeCreate(event) {
    const { data } = event.params;

    // --- 1. ตรวจสอบว่ามีการส่งข้อมูลสินค้ามาหรือไม่ ---
    if (data.product && data.product.connect && data.product.connect.length > 0) {
      const productId = data.product.connect[0].id;

      try {
        // --- 2. ดึงข้อมูลสินค้าเพื่อเอาราคาขายล่าสุด ---
        const product = await strapi.entityService.findOne('api::product.product', productId);

        if (product && typeof product.selling_price === 'number') {
          // --- 3. กำหนดราคา ณ เวลาที่ขาย (price_at_time) ---
          // เพื่อเก็บประวัติราคาที่ขายไปจริง ๆ แม้ว่าราคาสินค้าในอนาคตจะเปลี่ยนไป
          data.price_at_time = product.selling_price;
        } else {
          // ถ้าไม่เจอสินค้าหรือไม่มีราคาขาย ให้โยน Error เพื่อหยุดการทำงาน
          throw new Error(`Product with ID ${productId} not found or has no selling price.`);
        }
      } catch (error) {
        console.error("Error in beforeCreate for sale-item:", error);
        throw error; // ส่ง error ต่อเพื่อให้ transaction ล้มเหลว
      }
    }
  },

  /**
   * afterCreate lifecycle hook.
   * - Decreases the stock quantity for the sold product.
   * @param {object} event - The Strapi event object.
   */
  async afterCreate(event) {
    const { result } = event;

    try {
      // --- 1. ดึงข้อมูล SaleItem ที่เพิ่งสร้าง พร้อมข้อมูลสินค้า ---
      const saleItem = await strapi.entityService.findOne('api::sale-item.sale-item', result.id, {
        populate: ['product'],
      });

      if (!saleItem || !saleItem.product || !saleItem.quantity) {
        console.warn(`SaleItem ${result.id} or its product/quantity is missing. Skipping stock update.`);
        return;
      }

      const { product, quantity } = saleItem;

      // --- 2. ค้นหาสต็อกของสินค้านั้น ---
      const stock = await strapi.db.query('api::stock.stock').findOne({
        where: { product: product.id },
      });

      if (stock) {
        // --- 3. ลดจำนวนสินค้าในสต็อก ---
        const newQuantity = stock.quantity - quantity;
        await strapi.db.query('api::stock.stock').update({
          where: { id: stock.id },
          data: { quantity: newQuantity },
        });
        console.log(`Stock for product ${product.id} reduced by ${quantity}. New quantity: ${newQuantity}`);
      } else {
        // กรณีนี้ไม่ควรเกิดขึ้นในระบบที่สมบูรณ์ แต่ใส่ไว้เพื่อป้องกัน
        console.error(`Stock record not found for product ID: ${product.id}. Cannot decrease stock.`);
      }
    } catch (error) {
      console.error(`Error in afterCreate for sale-item ${result.id}:`, error);
      // หมายเหตุ: การจัดการ error ใน afterCreate มีความซับซ้อน
      // เพราะข้อมูลถูกสร้างไปแล้ว อาจจะต้องมีกระบวนการ Rollback หรือแจ้งเตือนผู้ดูแล
    }
  },

  /**
   * afterDelete lifecycle hook.
   * - Increases the stock quantity for the product from the deleted sale item.
   * @param {object} event - The Strapi event object.
   */
  async afterDelete(event) {
    const { result } = event;

    try {
      // event.result ใน afterDelete คือข้อมูลของรายการที่ถูกลบไป
      const deletedItem = result;

      // --- 1. ตรวจสอบว่ามีข้อมูลสินค้าและจำนวนหรือไม่ ---
      // ใน afterDelete, ข้อมูล relation อาจไม่ได้ populate มา, เราต้องเช็คจาก ID
      if (!deletedItem || !deletedItem.product || !deletedItem.quantity) {
        console.warn(`Deleted SaleItem data is incomplete. Skipping stock revert.`);
        return;
      }

      // product ที่ได้จาก result อาจเป็นแค่ object ที่มี id
      const productId = deletedItem.product.id;
      const { quantity } = deletedItem;

      // --- 2. ค้นหาสต็อกของสินค้านั้น ---
      const stock = await strapi.db.query('api::stock.stock').findOne({
        where: { product: productId },
      });

      if (stock) {
        // --- 3. เพิ่มจำนวนสินค้าในสต็อกคืน ---
        const newQuantity = stock.quantity + quantity;
        await strapi.db.query('api::stock.stock').update({
          where: { id: stock.id },
          data: { quantity: newQuantity },
        });
        console.log(`Stock for product ${productId} reverted by ${quantity}. New quantity: ${newQuantity}`);
      } else {
        console.error(`Stock record not found for product ID: ${productId}. Cannot revert stock.`);
      }
    } catch (error) {
      console.error(`Error in afterDelete for sale-item ${result.id}:`, error);
    }
  },
};
