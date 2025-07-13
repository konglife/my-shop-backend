import { addPart, removePart } from '../src/api/repair-job/controllers/repair-job';

describe('repair-job controller', () => {
  const createCtx = (params: any = {}, body: any = {}) => ({
    params,
    request: { body },
    throw: jest.fn(),
    body: undefined as any,
  });

  const serviceCreate = jest.fn().mockResolvedValue({ id: 1 });
  const serviceDelete = jest.fn().mockResolvedValue(undefined);
  const strapi = {
    service: jest.fn((name: string) => {
      if (name === 'api::used-part.used-part') {
        return { create: serviceCreate, delete: serviceDelete };
      }
      return {};
    }),
  } as any;


  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('addPart creates used part and sets response', async () => {
    const ctx = createCtx({ id: '5' }, { quantity: 2 });
    await addPart(strapi, ctx);
    expect(serviceCreate).toHaveBeenCalledWith({
      data: { quantity: 2, repair_job: '5' },
    });
    expect(ctx.body).toEqual({ id: 1 });
  });

  it('removePart deletes used part', async () => {
    const ctx = createCtx({ partId: '3' });
    await removePart(strapi, ctx);
    expect(serviceDelete).toHaveBeenCalledWith('3');
    expect(ctx.body).toEqual({ ok: true });
  });
});
