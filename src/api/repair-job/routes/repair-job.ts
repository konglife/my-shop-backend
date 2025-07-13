/**
 * repair-job router
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/repair-jobs/:id/parts',
      handler: 'repair-job.addPart',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/repair-jobs/:jobId/parts/:partId',
      handler: 'repair-job.removePart',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
