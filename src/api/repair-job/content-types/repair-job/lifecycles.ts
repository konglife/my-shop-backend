import type { Event } from '@strapi/database/dist/lifecycles';

// --- TYPE DEFINITIONS ---
interface Stock {
  id: number;
  quantity: number;
}

interface Product {
  id: number;
}

interface UsedPart {
  id: number;
  quantity: number;
  products: Product[];
}

interface PopulatedRepairJob {
  id: number;
  status_repair: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  parts_cost?: number;
  used_parts: UsedPart[];
}

/**
 * Helper function to update stock for a given repair job.
 * @param {number} repairJobId - The ID of the repair job.
 * @param {'INCREASE' | 'DECREASE'} operation - The operation to perform on the stock.
 */
async function updateStockForRepairJob(repairJobId: number, operation: 'INCREASE' | 'DECREASE') {
  console.log(`--- Starting stock update (${operation}) for RepairJob ID: ${repairJobId} ---`);
  try {
    const repairJob = await strapi.entityService.findOne('api::repair-job.repair-job', repairJobId, {
      populate: ['used_parts.products'],
    }) as unknown as PopulatedRepairJob;

    if (!repairJob || !repairJob.used_parts || repairJob.used_parts.length === 0) {
      console.log(`RepairJob ${repairJobId} has no used parts to process for stock update.`);
      return;
    }

    for (const part of repairJob.used_parts) {
      // The schema for UsedPart has a 'oneToMany' relation named 'products'.
      // We assume that for stock-keeping purposes, each 'used_part' entry corresponds to one product type
      // and will process the first product in the array.
      if (!part.products || part.products.length === 0 || !part.quantity) continue;

      const product = part.products[0];
      const { quantity } = part;

      const stock = await strapi.db.query('api::stock.stock').findOne({
        where: { product: product.id },
      }) as Stock;

      if (stock) {
        const newQuantity = operation === 'DECREASE' ? stock.quantity - quantity : stock.quantity + quantity;
        
        await strapi.db.query('api::stock.stock').update({
          where: { id: stock.id },
          data: { quantity: newQuantity },
        });
        console.log(`Stock for product ID ${product.id} updated from ${stock.quantity} to ${newQuantity}.`);
      } else {
        console.error(`Stock record not found for product ID: ${product.id}. Cannot update stock.`);
      }
    }
    console.log(`--- Stock update (${operation}) successful for RepairJob ID: ${repairJobId} ---`);
  } catch (error) {
    console.error(`Error during stock update for RepairJob ${repairJobId} (Operation: ${operation}):`, error);
    throw new Error(`Failed to ${operation.toLowerCase()} stock for repair job ${repairJobId}.`);
  }
}

export default {
  /**
   * beforeUpdate lifecycle hook.
   * - Fetches full state for afterUpdate.
   * - Calculates labor_cost automatically.
   */
  async beforeUpdate(event: Event) {
    console.log('--- RepairJob beforeUpdate Triggered ---');
    const { data, where } = event.params;

    // 1. Fetch the full entry to ensure we have the complete state in afterUpdate
    const existingEntry = await strapi.db.query('api::repair-job.repair-job').findOne({ where });
    event.state = existingEntry;
    console.log('State fetched and attached to event:', JSON.stringify(event.state, null, 2));

    // 2. Calculate labor_cost automatically if total_cost is being updated
    if (typeof data.total_cost === 'number' && existingEntry) {
      const partsCost = existingEntry.parts_cost || 0;
      data.labor_cost = data.total_cost - partsCost;
      console.log(`Calculated labor_cost: ${data.labor_cost}`);
    }
  },

  /**
   * afterUpdate lifecycle hook.
   * - Manages stock based on status changes.
   */
  async afterUpdate(event: Event) {
    console.log('--- RepairJob afterUpdate Triggered ---');
    const { result, state } = event;

    const populatedState = state as unknown as PopulatedRepairJob;

    if (!populatedState || !('status_repair' in populatedState)) {
      console.log('Exiting afterUpdate: State is missing or does not contain status_repair.');
      return;
    }

    const oldStatus = populatedState.status_repair;
    const newStatus = result.status_repair;

    console.log(`Received state in afterUpdate:`, JSON.stringify(state, null, 2));
    console.log(`Received result in afterUpdate:`, JSON.stringify(result, null, 2));

    if (oldStatus === newStatus) {
      console.log('Status has not changed. Exiting.');
      return;
    }
    console.log(`Status change detected: FROM '${oldStatus}' TO '${newStatus}'`);

    // Case 1: Job is completed
    if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      console.log(`Processing "COMPLETED" status for RepairJob ID: ${result.id}`);
      await updateStockForRepairJob(result.id, 'DECREASE');
    }
    // Case 2: A completed job is reverted (e.g., to CANCELLED)
    else if (oldStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
      console.log(`Reverting "COMPLETED" status for RepairJob ID: ${result.id}`);
      await updateStockForRepairJob(result.id, 'INCREASE');
    }
  },
};
