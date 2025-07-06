/**
 * sale service
 */

import { factories } from '@strapi/strapi';

interface SaleItem {
    id: number;
    quantity: number;
    price_at_time: number;
    cost_at_time: number;
}

export default factories.createCoreService('api::sale.sale', ({ strapi }) =>  ({
    async updateSaleCosts(saleId: number) {
        console.log(`--- Triggered updateSaleCosts for Sale ID: ${saleId} ---`);
        if (!saleId) {
            console.log('No Sale ID provided. Skipping update.');
            return;
        }

        // Fetch the current sale to compare values and prevent infinite loops
        const currentSale = await strapi.entityService.findOne('api::sale.sale', saleId, {
            fields: ['total_amount', 'total_cost'],
        });

        const saleItems: SaleItem[] = await strapi.db.query('api::sale-item.sale-item').findMany({
            where: { sale: saleId },
        });

        const total_amount = saleItems.reduce((acc, item) => {
            const amount = (item.price_at_time || 0) * (item.quantity || 0);
            return acc + amount;
        }, 0);

        const total_cost = saleItems.reduce((acc, item) => {
            const cost = (item.cost_at_time || 0) * (item.quantity || 0);
            return acc + cost;
        }, 0);

        // Only update if the values have actually changed
        if (currentSale.total_amount !== total_amount || currentSale.total_cost !== total_cost) {
            console.log(`Values have changed. Updating sale...`);
            console.log(`New Amount: ${total_amount}, Old Amount: ${currentSale.total_amount}`);
            console.log(`New Cost: ${total_cost}, Old Cost: ${currentSale.total_cost}`);

            await strapi.entityService.update('api::sale.sale', saleId, {
                data: {
                    total_amount,
                    total_cost,
                },
            });
        } else {
            console.log('No changes detected. Skipping update to prevent loop.');
        }

        console.log(`--- Finished updateSaleCosts for Sale ID: ${saleId} ---`);
    }
}));
