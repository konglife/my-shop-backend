import type { Event } from '@strapi/database/dist/lifecycles';

interface SaleResult {
  id: number;
  status_sale?: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
}

interface SaleItem {
  id: number;
  quantity: number;
  product: { id: number };
}

interface PopulatedSale {
  id: number;
  status_sale: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  sale_items: SaleItem[];
}

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;
    if (!data.status_sale) {
      data.status_sale = 'DRAFT';
    }
  },

  async beforeUpdate(event: Event) {
    const { data, where } = event.params;
    const { status_sale } = data;

    const saleId = where.id;
    const saleBeforeUpdate = await strapi.entityService.findOne('api::sale.sale', saleId, { populate: ['sale_items', 'sale_items.product'] }) as unknown as PopulatedSale;

    // Case 1: Stock Deduction when marking as COMPLETED
    if (data.status_sale === 'COMPLETED' && saleBeforeUpdate.status_sale !== 'COMPLETED') {
      console.log(`--- Stock Deduction for Sale ID: ${saleId} ---`);
      for (const item of saleBeforeUpdate.sale_items) {
        const stock = await strapi.db.query('api::stock.stock').findOne({ where: { product: item.product.id } });
        if (stock) {
          const newQuantity = stock.quantity - item.quantity;
          await strapi.entityService.update('api::stock.stock', stock.id, { data: { quantity: newQuantity } });
          console.log(`Deducted ${item.quantity} from stock for product ${item.product.id}. New quantity: ${newQuantity}`);
        }
      }
    }

    // Case 2: Stock Replenishment when CANCELLED from COMPLETED
    if (data.status_sale === 'CANCELLED' && saleBeforeUpdate.status_sale === 'COMPLETED') {
      console.log(`--- Stock Replenishment for Sale ID: ${saleId} ---`);
      for (const item of saleBeforeUpdate.sale_items) {
        const stock = await strapi.db.query('api::stock.stock').findOne({ where: { product: item.product.id } });
        if (stock) {
          const newQuantity = stock.quantity + item.quantity;
          await strapi.entityService.update('api::stock.stock', stock.id, { data: { quantity: newQuantity } });
          console.log(`Replenished ${item.quantity} to stock for product ${item.product.id}. New quantity: ${newQuantity}`);
        }
      }
    }
  },

  async afterCreate(event: Event) {
    const { result } = event as { result: SaleResult };
    if (result.id) {
      console.log(`--- Sale afterCreate: Triggering updateSaleCosts for Sale ID: ${result.id} ---`);
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(result.id);
    }
  },

  async afterUpdate(event: Event) {
    const { result } = event as { result: SaleResult };
    if (result.id) {
      console.log(`--- Sale afterUpdate: Triggering updateSaleCosts for Sale ID: ${result.id} ---`);
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(result.id);
    }
  },
};
