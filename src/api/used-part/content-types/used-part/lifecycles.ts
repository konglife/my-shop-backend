import type { Event } from '@strapi/database/dist/lifecycles';

// Define interfaces for type safety
interface RepairJob {
  id: number;
  labor_cost?: number;
}

interface UsedPart {
  id: number;
  quantity: number;
  cost_at_time: number;
  repair_job?: RepairJob; // Populated relation
}

// Helper function to update costs in the related Repair Job
async function updateRepairJobCosts(repairJobId: number) {
  console.log(`--- Triggered updateRepairJobCosts for Repair Job ID: ${repairJobId} ---`);
  if (!repairJobId) {
    console.log('No Repair Job ID provided. Skipping update.');
    return;
  }

  const usedParts: UsedPart[] = await strapi.db.query('api::used-part.used-part').findMany({
    where: { repair_job: repairJobId },
  });

  const parts_cost = usedParts.reduce((acc, part) => {
    const cost = (part.cost_at_time || 0) * (part.quantity || 0);
    return acc + cost;
  }, 0);

  console.log(`Calculated parts_cost: ${parts_cost}`);

  const repairJob: RepairJob | null = await strapi.db.query('api::repair-job.repair-job').findOne({
    where: { id: repairJobId },
  });

  if (!repairJob) {
    console.error(`Repair Job with ID ${repairJobId} not found.`);
    return;
  }

  const labor_cost = repairJob.labor_cost || 0;
  const total_cost = parts_cost + labor_cost;

  console.log(`Calculated total_cost: ${total_cost} (parts: ${parts_cost} + labor: ${labor_cost})`);

  await strapi.entityService.update('api::repair-job.repair-job', repairJobId, {
    data: {
      parts_cost,
      total_cost,
    },
  });

  console.log(`--- Finished updateRepairJobCosts for Repair Job ID: ${repairJobId} ---`);
}

export default {
  async beforeCreate(event: Event) {
    const { data } = event.params;
    console.log('--- UsedPart beforeCreate Triggered ---');
    console.log('Initial data:', JSON.stringify(data, null, 2));

    const products_relation = data.products as unknown as { connect: { id: number }[] };

    if (products_relation?.connect?.length > 0 && data.cost_at_time == null) {
      const productId = products_relation.connect[0].id;
      console.log(`Product ID found from connect relation: ${productId}`);
      
      const stock = await strapi.db.query('api::stock.stock').findOne({ where: { product: productId } });
      if (stock && typeof stock.average_cost === 'number') {
        data.cost_at_time = stock.average_cost;
        console.log(`Stock found for product ID ${productId}, cost_at_time set to: ${data.cost_at_time}`);
      } else {
        data.cost_at_time = 0;
        console.log(`No stock found for product ID ${productId}, cost_at_time set to 0`);
      }
    } else {
      console.log('Skipping cost calculation: No product relation found, or cost_at_time is already set.');
    }
    console.log('--- UsedPart beforeCreate End ---');
  },

  async beforeUpdate(event: Event) {
    const { where } = event.params;
    if (where.id) {
      const existingEntry = await strapi.db.query('api::used-part.used-part').findOne({
        where: { id: where.id },
        populate: ['repair_job'],
      });
      event.state = existingEntry;
      console.log('--- UsedPart beforeUpdate: State attached ---');
    }
  },

  async beforeDelete(event: Event) {
    const { where } = event.params;
    if (where.id) {
        const existingEntry = await strapi.db.query('api::used-part.used-part').findOne({
            where: { id: where.id },
            populate: ['repair_job'],
        });
        event.state = existingEntry;
        console.log('--- UsedPart beforeDelete: State attached ---');
    }
  },

  async afterCreate(event: Event) {
    console.log('--- UsedPart afterCreate Triggered ---');
    const { result } = event;
    const newUsedPart = await strapi.entityService.findOne('api::used-part.used-part', result.id, {
        populate: ['repair_job'],
    }) as unknown as UsedPart;
    
    if (newUsedPart?.repair_job?.id) {
      await updateRepairJobCosts(newUsedPart.repair_job.id);
    } else {
        console.log('No associated repair_job found to update.');
    }
  },

  async afterUpdate(event: Event) {
    console.log('--- UsedPart afterUpdate Triggered ---');
    const { state } = event;
    const oldState = state as unknown as UsedPart;

    const newUsedPart = await strapi.entityService.findOne('api::used-part.used-part', (event.result as UsedPart).id, {
        populate: ['repair_job'],
    }) as unknown as UsedPart;

    const newRepairJobId = newUsedPart?.repair_job?.id;
    const oldRepairJobId = oldState?.repair_job?.id;

    console.log(`Old Repair Job ID: ${oldRepairJobId}, New Repair Job ID: ${newRepairJobId}`);

    if (newRepairJobId) {
      await updateRepairJobCosts(newRepairJobId);
    }

    if (oldRepairJobId && oldRepairJobId !== newRepairJobId) {
      await updateRepairJobCosts(oldRepairJobId);
    }
  },

  async afterDelete(event: Event) {
    console.log('--- UsedPart afterDelete Triggered ---');
    const { state } = event;
    const oldState = state as unknown as UsedPart;
    const repairJobId = oldState?.repair_job?.id;
    if (repairJobId) {
      await updateRepairJobCosts(repairJobId);
    } else {
        console.log('No associated repair_job found to update from pre-delete state.');
    }
  },
};
