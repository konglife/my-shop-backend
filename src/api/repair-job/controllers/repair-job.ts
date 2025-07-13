import { factories } from '@strapi/strapi';

export const addPart = async (strapi: any, ctx: any) => {
  const { id } = ctx.params;
  const data = ctx.request.body;
  const created = await strapi.service('api::used-part.used-part').create({
    data: { ...data, repair_job: id },
  });
  ctx.body = created;
};

export const removePart = async (strapi: any, ctx: any) => {
  const { partId } = ctx.params;
  await strapi.service('api::used-part.used-part').delete(partId);
  ctx.body = { ok: true };
};

export default factories.createCoreController('api::repair-job.repair-job', ({ strapi }) => ({
  async addPart(ctx) {
    await addPart(strapi, ctx);
  },

  async removePart(ctx) {
    await removePart(strapi, ctx);
  },
}));
