import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::used-part.used-part', ({ strapi }) => ({
  /**
   * Recalculates the costs (parts_cost, labor_cost) for a given repair job.
   * This function is typically called after a used_part is created, updated, or deleted.
   * @param repairJobId number ID of the repair job to recalculate.
   */
  async recalculateRepairJobCosts(repairJobId: number) {
    if (!repairJobId) {
      console.warn('recalculateRepairJobCosts called without a repairJobId.');
      return;
    }

    try {
      // 1. Find the RepairJob with all related UsedParts
      const repairJob = await strapi.entityService.findOne('api::repair-job.repair-job', repairJobId, {
        populate: { used_parts: true },
      });

      if (!repairJob) {
        console.error(`RepairJob with ID ${repairJobId} not found.`);
        return;
      }

      // 2. Calculate total parts cost
      let newPartsCost = 0;
      if (repairJob.used_parts && repairJob.used_parts.length > 0) {
        newPartsCost = repairJob.used_parts.reduce((total: number, part: any) => {
          const cost = part.cost_at_time || 0;
          const quantity = part.quantity || 0;
          return total + cost * quantity;
        }, 0);
      }

      // 3. Calculate new labor cost
      const totalCost = repairJob.total_cost || 0;
      const newLaborCost = totalCost - newPartsCost;

      // 4. Update RepairJob with new costs
      await strapi.entityService.update('api::repair-job.repair-job', repairJobId, {
        data: {
          parts_cost: newPartsCost,
          labor_cost: newLaborCost,
        },
      });

      console.log(
        `Costs recalculated for RepairJob ID: ${repairJobId}. New Parts Cost: ${newPartsCost}, New Labor Cost: ${newLaborCost}`,
      );
    } catch (error) {
      console.error(`Failed to recalculate costs for RepairJob ID ${repairJobId}:`, error);
      // Avoid throwing to prevent failure of main transaction
    }
  },
}));
