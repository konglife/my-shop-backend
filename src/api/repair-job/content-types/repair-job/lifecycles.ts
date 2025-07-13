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
  cost_at_time: number;
  products: Product[];
}

interface RepairJob {
  id: number;
  status_repair: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'AWAITING_PARTS';
  total_cost?: number;
  parts_cost?: number;
  labor_cost?: number;
  used_parts?: UsedPart[];
}

// --- HELPER FUNCTIONS ---

function calculateCosts(repairJob: Partial<RepairJob>): { parts_cost: number; labor_cost: number } {
  console.log(`--- Calculating costs for RepairJob ID: ${repairJob.id} ---`);
  const parts_cost = Array.isArray(repairJob.used_parts)
    ? repairJob.used_parts.reduce((sum, part) => sum + (part.cost_at_time || 0) * (part.quantity || 0), 0)
    : 0;
  const total_cost = repairJob.total_cost || 0;
  const labor_cost = total_cost - parts_cost;
  console.log(`Calculated Costs: parts_cost=${parts_cost}, labor_cost=${labor_cost}`);
  return { parts_cost, labor_cost };
}

async function updateStockForRepairJob(repairJobId: number, operation: 'INCREASE' | 'DECREASE') {
  console.log(`--- Starting stock update (${operation}) for RepairJob ID: ${repairJobId} ---`);
  try {
    const repairJob = await strapi.entityService.findOne('api::repair-job.repair-job', repairJobId, {
      populate: { used_parts: { populate: 'products' } },
    }) as unknown as RepairJob;

    if (!repairJob || !repairJob.used_parts || repairJob.used_parts.length === 0) {
      console.log(`RepairJob ${repairJobId} has no parts for stock update.`);
      return;
    }

    for (const part of repairJob.used_parts) {
      if (!part.products || part.products.length === 0 || !part.quantity) continue;
      const product = part.products[0];
      const stock = await strapi.db.query('api::stock.stock').findOne({ where: { product: product.id } });
      if (stock) {
        const newQuantity = operation === 'DECREASE' ? stock.quantity - part.quantity : stock.quantity + part.quantity;
        await strapi.db.query('api::stock.stock').update({
          where: { id: stock.id },
          data: { quantity: newQuantity },
        });
        console.log(`Stock for product ${product.id} (${operation}D by ${part.quantity}) is now ${newQuantity}.`);
      }
    }
  } catch (error) {
    console.error(`Error during stock update for RepairJob ${repairJobId}:`, error);
  }
}

// --- LIFECYCLE HOOKS (Aligned with Sale Logic) ---

export default {
  async afterCreate(event: Event) {
    const { result } = event as { result: RepairJob };
    const repairJobId = result.id;

    // Recalculate costs after creation in case parts were added
    const newRepairJob = await strapi.entityService.findOne('api::repair-job.repair-job', repairJobId, { populate: ['used_parts'] }) as RepairJob;
    if (newRepairJob) {
      const { parts_cost, labor_cost } = calculateCosts(newRepairJob);
      await strapi.entityService.update('api::repair-job.repair-job', repairJobId, { data: { parts_cost, labor_cost } });
    }

    // If created as COMPLETED, deduct stock
    if (result.status_repair === 'COMPLETED') {
      await updateStockForRepairJob(repairJobId, 'DECREASE');
    }
  },

  async beforeUpdate(event: Event) {
    const { data, where } = event.params;
    const repairJobId = where.id;
    if (!repairJobId) return;

    // Fetch the full, current state of the repair job with its parts
    const existingEntry = await strapi.entityService.findOne('api::repair-job.repair-job', repairJobId, {
      populate: { used_parts: true },
    }) as unknown as RepairJob;

    if (!existingEntry) return;

    // Cost calculation logic
    // Ensure used_parts is an array before calculation.
    const partsForCostCalc = Array.isArray(existingEntry.used_parts) ? existingEntry.used_parts : [];
    const stateForCostCalc = {
      ...existingEntry,
      used_parts: partsForCostCalc,
      total_cost: data.total_cost ?? existingEntry.total_cost,
    };
    const { parts_cost, labor_cost } = calculateCosts(stateForCostCalc);
    data.parts_cost = parts_cost;
    data.labor_cost = labor_cost;

    // Stock management logic based on status change
    const oldStatus = existingEntry.status_repair;
    const newStatus = data.status_repair;

    if (newStatus && oldStatus !== newStatus) {
      console.log(`RepairJob status change: FROM '${oldStatus}' TO '${newStatus}'`);
      if (oldStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
        await updateStockForRepairJob(repairJobId, 'INCREASE');
      } else if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
        await updateStockForRepairJob(repairJobId, 'DECREASE');
      }
    }
  },

  async beforeDelete(event: Event) {
    const { where } = event.params;
    const repairJobId = where.id;
    if (!repairJobId) return;

    const jobToDelete = await strapi.entityService.findOne('api::repair-job.repair-job', repairJobId, { populate: ['used_parts'] }) as unknown as RepairJob;
    if (!jobToDelete) return;

    // If the job was COMPLETED, return the stock.
    if (jobToDelete.status_repair === 'COMPLETED') {
      console.log(`RepairJob ${repairJobId} is COMPLETED. Returning stock before deletion.`);
      await updateStockForRepairJob(repairJobId, 'INCREASE');
    }

    // Always delete associated used_parts.
    if (jobToDelete.used_parts && jobToDelete.used_parts.length > 0) {
      const partIds = jobToDelete.used_parts.map(p => p.id);
      await strapi.db.query('api::used-part.used-part').deleteMany({
        where: { id: { $in: partIds } },
      });
      console.log(`Deleted ${partIds.length} associated UsedParts for RepairJob ${repairJobId}.`);
    }
  },
  
  // afterUpdate is no longer needed for stock logic but can be kept for other purposes if necessary.
  // For now, it's removed to align with the 'sale' logic pattern.
};
