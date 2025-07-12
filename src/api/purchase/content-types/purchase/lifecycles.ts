import { type Event } from '@strapi/database/dist/lifecycles';

// --- TYPE DEFINITIONS ---
interface Product {
  id: number;
}

interface Stock {
  id: number;
  quantity: number;
  average_cost: number;
}

interface Purchase {
  id: number;
  status_purchase: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  quantity: number;
  purchase_price: number;
  products: Product[];
}

// --- HELPER FUNCTION ---

/**
 * Updates stock for all products in a given purchase.
 * Handles both increasing stock (on reception) and decreasing stock (on reversal).
 * Also recalculates average cost when receiving goods.
 * @param {number} purchaseId - The ID of the purchase.
 * @param {'INCREASE' | 'DECREASE'} operation - The stock operation.
 */
async function updateStockForPurchase(purchaseId: number, operation: 'INCREASE' | 'DECREASE') {
  console.log(`--- Starting stock update (${operation}) for Purchase ID: ${purchaseId} ---`);
  try {
    const purchase = await strapi.entityService.findOne('api::purchase.purchase', purchaseId, {
      populate: ['products'],
    }) as unknown as Purchase;

    if (!purchase || !purchase.products || purchase.products.length === 0) {
      console.log(`Purchase ${purchaseId} has no products to process.`);
      return;
    }

    for (const product of purchase.products) {
      const quantity = purchase.quantity;
      const price = purchase.purchase_price;
      if (!product?.id || !quantity) continue;

      const stock = await strapi.db.query('api::stock.stock').findOne({ where: { product: product.id } }) as Stock;

      if (operation === 'INCREASE') {
        if (stock) {
          const currentQuantity = Number(stock.quantity) || 0;
          const currentAvgCost = Number(stock.average_cost) || 0;
          const newTotalQuantity = currentQuantity + quantity;
          
          const rawAvgCost = newTotalQuantity > 0
            ? ((currentQuantity * currentAvgCost) + (quantity * price)) / newTotalQuantity
            : price;
          const newAvgCost = Number(rawAvgCost.toFixed(2)); // Round to 2 decimal places
          
          await strapi.db.query('api::stock.stock').update({
            where: { id: stock.id },
            data: { quantity: newTotalQuantity, average_cost: newAvgCost },
          });
          console.log(`Stock for product ${product.id} increased to ${newTotalQuantity}, new avg cost is ${newAvgCost}.`);
        } else {
          await strapi.db.query('api::stock.stock').create({
            data: { product: product.id, quantity, average_cost: price, publishedAt: new Date() },
          });
          console.log(`New stock created for product ${product.id} with quantity ${quantity}.`);
        }
      } else { // DECREASE operation
        if (stock) {
          const newQuantity = (Number(stock.quantity) || 0) - quantity;
          // Note: We do not recalculate average cost on reversal as per the rules.
          await strapi.db.query('api::stock.stock').update({
            where: { id: stock.id },
            data: { quantity: newQuantity >= 0 ? newQuantity : 0 },
          });
          console.log(`Stock for product ${product.id} decreased to ${newQuantity}.`);
        }
      }
    }
  } catch (error) {
    console.error(`Error during stock update for Purchase ${purchaseId}:`, error);
  }
}

// --- LIFECYCLE HOOKS (Aligned with Sale/RepairJob Logic) ---

export default {
  async afterCreate(event: Event) {
    const { result } = event as { result: Purchase };
    // If a purchase is created as RECEIVED, update stock immediately.
    if (result.status_purchase === 'RECEIVED') {
      console.log(`New purchase ${result.id} created as RECEIVED. Updating stock.`);
      await updateStockForPurchase(result.id, 'INCREASE');
    }
  },

  async beforeUpdate(event: Event) {
    const { where } = event.params;
    // Fetch the full state before the update to get the old status
    const existingEntry = await strapi.db.query('api::purchase.purchase').findOne({ where });
    event.state = existingEntry;
  },

  async afterUpdate(event: Event) {
    const result = event.result as Purchase;
    const state = event.state as unknown as Purchase;
    if (!state || !result) return;

    const oldStatus = state.status_purchase;
    const newStatus = result.status_purchase;

    if (oldStatus === newStatus) return;

    console.log(`Purchase ${result.id} status change: FROM '${oldStatus}' TO '${newStatus}'`);

    // Case 1: Goods are received
    if (newStatus === 'RECEIVED' && oldStatus !== 'RECEIVED') {
      await updateStockForPurchase(result.id, 'INCREASE');
    }
    // Case 2: Reception is cancelled/reverted
    else if (oldStatus === 'RECEIVED' && newStatus !== 'RECEIVED') {
      await updateStockForPurchase(result.id, 'DECREASE');
    }
  },

  async beforeDelete(event: Event) {
    const { where } = event.params;
    const purchaseId = where.id;
    if (!purchaseId) return;

    const purchaseToDelete = await strapi.entityService.findOne('api::purchase.purchase', purchaseId, { populate: ['products'] }) as unknown as Purchase;
    if (!purchaseToDelete) return;

    // If the purchase being deleted was already RECEIVED, we must revert the stock.
    if (purchaseToDelete.status_purchase === 'RECEIVED') {
      console.log(`Purchase ${purchaseId} was RECEIVED. Reverting stock before deletion.`);
      await updateStockForPurchase(purchaseId, 'DECREASE');
    }
  },
};
