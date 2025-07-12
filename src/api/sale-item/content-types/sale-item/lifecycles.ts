import type { Event } from '@strapi/database/dist/lifecycles';

// --- TYPE DEFINITIONS ---
interface Product {
  id: number;
  selling_price?: number;
}

interface Stock {
  average_cost?: number;
}

interface SaleItemData {
  quantity: number;
  cost_at_time?: number;
  price_at_time?: number;
  product?: {
    connect?: { id: number }[];
  };
}

interface SaleItem {
  id: number;
  quantity: number;
  product: Product;
  sale?: { id: number };
}

// --- LIFECYCLE HOOKS ---

export default {
  /**
   * Before creating a sale item, fetch and set the price and cost at the time of creation.
   */
  async beforeCreate(event: Event) {
    const { data } = event.params as { data: SaleItemData };
    console.log('--- SaleItem beforeCreate Triggered ---');

    const product_relation = data.product;

    if (product_relation?.connect?.length > 0) {
      const productId = product_relation.connect[0].id;

      if (data.price_at_time == null) {
        const product: Product = await strapi.db.query('api::product.product').findOne({ where: { id: productId } });
        data.price_at_time = product?.selling_price || 0;
        console.log(`Set price_at_time to ${data.price_at_time}`);
      }

      if (data.cost_at_time == null) {
        const stock: Stock = await strapi.db.query('api::stock.stock').findOne({ where: { product: productId } });
        data.cost_at_time = stock?.average_cost || 0;
        console.log(`Set cost_at_time to ${data.cost_at_time}`);
      }
    } else {
      console.log('Skipping price/cost calculation: No product relation.');
    }
    console.log('--- SaleItem beforeCreate End ---');
  },

  /**
   * Before any update or delete, fetch the previous state to correctly update the parent sale's costs.
   */
  async beforeUpdate(event: Event) {
    const { where } = event.params;
    const saleItem = await strapi.db.query('api::sale-item.sale-item').findOne({ where, populate: ['sale'] });
    (event.state as any).previousState = saleItem;
  },

  async beforeDelete(event: Event) {
    const { where } = event.params;
    const saleItem = await strapi.db.query('api::sale-item.sale-item').findOne({ where, populate: ['sale'] });
    (event.state as any).previousState = saleItem;
  },

  /**
   * After creating, updating, or deleting a sale item, trigger a cost recalculation on the parent sale.
   */
  async afterCreate(event: Event) {
    const { result } = event as { result: SaleItem };
    console.log('--- SaleItem afterCreate Triggered ---');
    // Stock is no longer managed here. It's managed on the Sale status change.
    if (result.sale?.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(result.sale.id);
    }
  },

  async afterUpdate(event: Event) {
    const { result } = event as { result: SaleItem };
    const previousState = (event.state as any).previousState as SaleItem;
    console.log('--- SaleItem afterUpdate Triggered ---');

    if (result.sale?.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(result.sale.id);
    }

    if (previousState?.sale?.id && previousState.sale.id !== result.sale?.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(previousState.sale.id);
    }
  },

  async afterDelete(event: Event) {
    const previousState = (event.state as any).previousState as SaleItem;
    console.log('--- SaleItem afterDelete Triggered ---');
    // Stock is no longer managed here. It's managed on the Sale status change.
    if (previousState?.sale?.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(previousState.sale.id);
    }
  },
};
