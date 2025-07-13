import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::repair-job.repair-job', {
  config: {
    addPart: {},
    removePart: {},
  },
  routes: [
    {
      method: 'POST',
      path: '/repair-jobs/:id/parts',
      handler: 'repair-job.addPart',
    },
    {
      method: 'DELETE',
      path: '/repair-jobs/:jobId/parts/:partId',
      handler: 'repair-job.removePart',
    },
  ],
});
