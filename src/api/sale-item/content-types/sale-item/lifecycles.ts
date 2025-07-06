import type { Event } from '@strapi/database/dist/lifecycles';

// Define interfaces for type safety
interface SaleItemData {
  cost_at_time?: number;
  price_at_time?: number;
  product?: {
    connect?: { id: number }[];
  };
}

interface SaleItem {
  id: number;
  sale?: { id: number }; // Populated relation
}

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params as { data: SaleItemData };
    console.log('--- SaleItem beforeCreate Triggered ---');

    const product_relation = data.product;

    if (product_relation?.connect?.length > 0) {
      const productId = product_relation.connect[0].id;

      // Fetch product for selling_price if not provided
      if (data.price_at_time == null) {
        const product = await strapi.db.query('api::product.product').findOne({ where: { id: productId } });
        data.price_at_time = product?.selling_price || 0;
        console.log(`Set price_at_time to ${data.price_at_time}`);
      }

      // Fetch stock for average_cost if not provided
      if (data.cost_at_time == null) {
        const stock = await strapi.db.query('api::stock.stock').findOne({ where: { product: productId } });
        data.cost_at_time = stock?.average_cost || 0;
        console.log(`Set cost_at_time to ${data.cost_at_time}`);
      }
    } else {
      console.log('Skipping price/cost calculation: No product relation.');
    }
    console.log('--- SaleItem beforeCreate End ---');
  },

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

  async afterCreate(event: Event) {
    const { result } = event as { result: SaleItem };
    if (result.sale?.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(result.sale.id);
    }
  },

  async afterUpdate(event: Event) {
    const { result } = event as { result: SaleItem };
    const previousState = (event.state as any).previousState as SaleItem;

    // Update the new sale if it exists
    if (result.sale?.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(result.sale.id);
    }

    // If the sale was changed, update the old sale as well
    if (previousState?.sale?.id && previousState.sale.id !== result.sale?.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(previousState.sale.id);
    }
  },

  async afterDelete(event: Event) {
    const previousState = (event.state as any).previousState as SaleItem;
    if (previousState?.sale?.id) {
      await (strapi.service('api::sale.sale') as any).updateSaleCosts(previousState.sale.id);
    }
  },
};
