
"use strict";

/**
 * used-part service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::used-part.used-part', ({ strapi }) => ({
  /**
   * Recalculates the costs (parts_cost, labor_cost) for a given repair job.
   * This function is typically called after a used_part is created, updated, or deleted.
   * @param {number} repairJobId The ID of the repair job to recalculate.
   */
  async recalculateRepairJobCosts(repairJobId) {
    if (!repairJobId) {
      console.warn("recalculateRepairJobCosts called without a repairJobId.");
      return;
    }

    try {
      // --- 1. ดึงข้อมูล RepairJob พร้อมกับ UsedPart ทั้งหมดที่เกี่ยวข้อง ---
      // เราต้องการข้อมูล used_parts ทั้งหมดเพื่อคำนวณต้นทุนอะไหล่ใหม่
      const repairJob = await strapi.entityService.findOne(
        'api::repair-job.repair-job',
        repairJobId,
        {
          populate: { used_parts: true },
        }
      );

      if (!repairJob) {
        console.error(`RepairJob with ID ${repairJobId} not found.`);
        return;
      }

      // --- 2. คำนวณต้นทุนอะไหล่รวมใหม่ (newPartsCost) ---
      // วนลูป used_parts ทั้งหมด แล้วบวกรวม `cost_at_time` * `quantity`
      let newPartsCost = 0;
      if (repairJob.used_parts && repairJob.used_parts.length > 0) {
        newPartsCost = repairJob.used_parts.reduce((total, part) => {
          const cost = part.cost_at_time || 0;
          const quantity = part.quantity || 0;
          return total + (cost * quantity);
        }, 0);
      }

      // --- 3. คำนวณค่าแรงใหม่ (newLaborCost) ---
      // ค่าแรง = ค่าซ่อมทั้งหมด - ต้นทุนอะไหล่รวมใหม่
      const totalCost = repairJob.total_cost || 0;
      const newLaborCost = totalCost - newPartsCost;

      // --- 4. อัปเดต RepairJob ด้วยข้อมูลต้นทุนที่คำนวณใหม่ ---
      // เราจะอัปเดตเฉพาะ `parts_cost` และ `labor_cost`
      await strapi.entityService.update('api::repair-job.repair-job', repairJobId, {
        data: {
          parts_cost: newPartsCost,
          labor_cost: newLaborCost,
        },
      });

      console.log(`Costs recalculated for RepairJob ID: ${repairJobId}. New Parts Cost: ${newPartsCost}, New Labor Cost: ${newLaborCost}`);

    } catch (error) {
      console.error(`Failed to recalculate costs for RepairJob ID ${repairJobId}:`, error);
      // ไม่ควร throw error ออกไป เพราะอาจจะทำให้ transaction หลัก (เช่นการสร้าง used_part) ล้มเหลว
      // แต่ควร log ไว้เพื่อตรวจสอบ
    }
  }
}));
