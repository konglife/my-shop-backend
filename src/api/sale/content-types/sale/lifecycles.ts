import type { Event } from '@strapi/database/dist/lifecycles';

// --- TYPE DEFINITIONS ---
interface Sale {
  id: number;
  status_sale: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  sale_items: SaleItem[];
}

interface SaleItem {
  id: number;
  quantity: number;
  product: { id: number };
}

// --- HELPER FUNCTION ---

/**
 * Updates stock for all items in a given sale.
 * @param {number} saleId - The ID of the sale.
 * @param {'INCREASE' | 'DECREASE'} operation - The stock operation.
 */
async function updateStockForSale(saleId: number, operation: 'INCREASE' | 'DECREASE') {
  console.log(`--- Starting stock update (${operation}) for Sale ID: ${saleId} ---`);
  try {
    const sale = await strapi.entityService.findOne('api::sale.sale', saleId, {
      populate: { sale_items: { populate: 'product' } },
    }) as unknown as Sale;

    if (!sale || !sale.sale_items || sale.sale_items.length === 0) {
      console.log(`Sale ${saleId} has no items to process for stock update.`);
      return;
    }

    for (const item of sale.sale_items) {
      if (!item.product?.id || !item.quantity) continue;

      const stock = await strapi.db.query('api::stock.stock').findOne({ where: { product: item.product.id } });
      if (stock) {
        const newQuantity = operation === 'DECREASE'
          ? stock.quantity - item.quantity
          : stock.quantity + item.quantity;
        
        await strapi.db.query('api::stock.stock').update({
          where: { id: stock.id },
          data: { quantity: newQuantity },
        });
        console.log(`Stock for product ${item.product.id} (${operation}D by ${item.quantity}) is now ${newQuantity}.`);
      }
    }
  } catch (error) {
    console.error(`Error during stock update for Sale ${saleId}:`, error);
  }
}


// --- LIFECYCLE HOOKS ---

export default {
  /**
   * Sets the default status to 'DRAFT' if not provided.
   */
  beforeCreate(event: Event) {
    const { data } = event.params;
    if (!data.status_sale) {
      data.status_sale = 'DRAFT';
    }
  },

  /**
   * After creating a sale, deduct stock if its status is COMPLETED.
   */
  async afterCreate(event: Event) {
    const { result } = event as { result: Sale };
    
    // Requirement 1: If a new sale is created as COMPLETED, deduct stock.
    if (result.status_sale === 'COMPLETED') {
      await updateStockForSale(result.id, 'DECREASE');
    }

    // Trigger cost update on the sale itself (e.g., to sum up totals)
    if (result.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(result.id);
    }
  },

  /**
   * Handles stock management based on Sale status changes.
   */
  async beforeUpdate(event: Event) {
    const { data, where } = event.params;
    const saleId = where.id;

    if (!saleId || !data.status_sale) return;

    const saleBeforeUpdate = await strapi.entityService.findOne('api::sale.sale', saleId, { populate: ['sale_items'] }) as unknown as Sale;
    if (!saleBeforeUpdate) return;

    const oldStatus = saleBeforeUpdate.status_sale;
    const newStatus = data.status_sale;

    if (oldStatus === newStatus) return;

    console.log(`Sale status change detected: FROM '${oldStatus}' TO '${newStatus}'`);
    
    // Requirement 2: Revert stock if changing FROM COMPLETED
    if (oldStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
      await updateStockForSale(saleId, 'INCREASE');
    }
    // Requirement 2 (inverse): Deduct stock if changing TO COMPLETED
    else if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      await updateStockForSale(saleId, 'DECREASE');
    }
  },

  /**
   * Before deleting a Sale, return stock if it was COMPLETED, and always delete associated SaleItems.
   */
  async beforeDelete(event: Event) {
    const { where } = event.params;
    const saleId = where.id;
    if (!saleId) return;

    const saleToDelete = await strapi.entityService.findOne('api::sale.sale', saleId, { populate: ['sale_items'] }) as unknown as Sale;
    if (!saleToDelete) return;

    // Requirement 3 & 4: If the sale was COMPLETED, return the stock.
    if (saleToDelete.status_sale === 'COMPLETED') {
      console.log(`Sale ${saleId} is COMPLETED. Returning stock before deletion.`);
      await updateStockForSale(saleId, 'INCREASE');
    }

    // Requirement 5: Always delete associated sale_items.
    const saleItemsToDelete = await strapi.db.query('api::sale-item.sale-item').findMany({
      where: { sale: saleId },
      select: ['id'],
    });

    if (saleItemsToDelete.length > 0) {
      const saleItemIds = saleItemsToDelete.map(item => item.id);
      await strapi.db.query('api::sale-item.sale-item').deleteMany({
        where: { id: { $in: saleItemIds } },
      });
      console.log(`Deleted ${saleItemIds.length} associated SaleItems for Sale ${saleId}.`);
    }
  },

  async afterUpdate(event: Event) {
    const { result } = event as { result: Sale };
    if (result.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(result.id);
    }
  },
};
