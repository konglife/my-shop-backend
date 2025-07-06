import { type Event } from '@strapi/database/dist/lifecycles';

// Define interfaces for better type safety with TypeScript
interface Product {
  id: number;
}

interface Stock {
  id: number;
  quantity: number;
  average_cost: number;
}

interface PopulatedPurchase {
  id: number;
  status_purchase: string; // Corrected field name from schema
  quantity: number;
  purchase_price: number;
  products: Product[];
}

export default {
  /**
   * beforeUpdate lifecycle hook.
   * Ensures the full state of the entity is available in afterUpdate.
   * @param {Event} event - The event object from Strapi.
   */
  async beforeUpdate(event: Event) {
    console.log('--- Purchase beforeUpdate Triggered ---');
    const { where } = event.params;
    // Fetch the full entry before the update to ensure we have the complete state
    const existingEntry = await strapi.db.query('api::purchase.purchase').findOne({ where });
    event.state = existingEntry;
    console.log('State fetched and attached to event:', JSON.stringify(event.state, null, 2));
  },

  /**
   * afterUpdate lifecycle hook.
   * Handles stock updates and average cost calculation based on purchase status changes.
   * @param {Event} event - The event object from Strapi.
   */
  async afterUpdate(event: Event) {
    const { result, state } = event;
    console.log('--- Purchase afterUpdate Triggered ---');
    console.log('Received state in afterUpdate:', JSON.stringify(state, null, 2));
    console.log('Received result in afterUpdate:', JSON.stringify(result, null, 2));

    if (!state || !('status_purchase' in state) || !result || !('status_purchase' in result)) {
      console.log('Lifecycle hook exited: state or result is missing status_purchase.');
      return;
    }

    const oldStatus = state.status_purchase as string;
    const newStatus = result.status_purchase as string;
    console.log(`Status change detected: FROM '${oldStatus}' TO '${newStatus}'`);

    if (oldStatus === newStatus) {
      console.log('Status has not changed. Exiting.');
      return;
    }

    const purchase = await strapi.entityService.findOne('api::purchase.purchase', result.id, {
      populate: ['products'], // Trying alternative populate syntax
    }) as unknown as PopulatedPurchase;
    console.log('Fetched populated purchase object:', JSON.stringify(purchase, null, 2));

    if (!purchase || !purchase.products || purchase.products.length === 0) {
      console.log(`Purchase ${result.id} has no products to process. Exiting.`);
      return;
    }

    if (newStatus === 'RECEIVED' && oldStatus !== 'RECEIVED') {
      console.log(`Processing "RECEIVED" status for Purchase ID: ${purchase.id}`);
      try {
        for (const product of purchase.products) {
          console.log(`Processing product ID: ${product.id}`);
          const quantity = purchase.quantity;
          const price = purchase.purchase_price;

          if (!product || !quantity) {
            console.log(`Skipping product ID: ${product.id} due to missing product or quantity.`);
            continue;
          }

          const stock = await strapi.db.query('api::stock.stock').findOne({
            where: { product: product.id },
          }) as Stock;

          if (stock) {
            console.log(`Found existing stock for product ${product.id}:`, JSON.stringify(stock, null, 2));
            const currentQuantity = Number(stock.quantity) || 0;
            const currentAvgCost = Number(stock.average_cost) || 0;
            const newTotalQuantity = currentQuantity + quantity;
            const newAvgCost = newTotalQuantity > 0
              ? ((currentQuantity * currentAvgCost) + (quantity * price)) / newTotalQuantity
              : 0;
            
            const updateData = { quantity: newTotalQuantity, average_cost: newAvgCost };
            console.log(`Updating stock with data:`, JSON.stringify(updateData, null, 2));
            await strapi.db.query('api::stock.stock').update({
              where: { id: stock.id },
              data: updateData,
            });
            console.log(`Stock for product ${product.id} updated successfully.`);
          } else {
            console.log(`No stock found for product ${product.id}. Creating new entry.`);
            const createData = {
                product: product.id,
                quantity: quantity,
                average_cost: price,
                publishedAt: new Date().toISOString(),
            };
            console.log(`Creating stock with data:`, JSON.stringify(createData, null, 2));
            await strapi.db.query('api::stock.stock').create({ data: createData });
            console.log(`Stock for product ${product.id} created successfully.`);
          }
        }
      } catch (error) {
        console.error(`Error processing RECEIVED purchase ${purchase.id}:`, error);
        throw new Error(`Failed to update stock for purchase ${purchase.id}. Reason: ${(error as Error).message}`);
      }
    } else if (oldStatus === 'RECEIVED' && newStatus !== 'RECEIVED') {
        console.log(`Processing cancellation of "RECEIVED" status for Purchase ID: ${purchase.id}`);
        try {
          for (const product of purchase.products) {
            const quantity = purchase.quantity;
  
            if (!product || !quantity) continue;
  
            const stock = await strapi.db.query('api::stock.stock').findOne({
              where: { product: product.id },
            }) as Stock;
  
            if (stock) {
              const newQuantity = (Number(stock.quantity) || 0) - quantity;
              await strapi.db.query('api::stock.stock').update({
                where: { id: stock.id },
                data: {
                  quantity: newQuantity >= 0 ? newQuantity : 0,
                },
              });
            } else {
              console.warn(`Stock not found for product ID ${product.id} when cancelling purchase ${purchase.id}.`);
            }
          }
        } catch (error) {
          console.error(`Error processing cancellation of RECEIVED purchase ${purchase.id}:`, error);
          throw new Error(`Failed to revert stock for purchase ${purchase.id}. Reason: ${(error as Error).message}`);
        }
    } else {
        console.log('No relevant status change to process stock. Exiting.');
    }
  },
};
