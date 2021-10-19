// For coverage.
import { createApp } from '../src/app';
import { Worker } from 'bullmq';

beforeAll(async () => {
  await global.setApp(baseConfig => createApp(baseConfig));
});

describe('Creating and fetching a task', () => {
  test('A task can be created', async () => {
    const created = await global.asAdmin.post('/tasks', {
      type: 'task-type-a',
      name: 'A test task',
      description: `A description of a test task`,
      subject: 'my-subject',
      state: {},
      events: [],
      status: 0,
      status_text: 'not started',
      parameters: ['param-1', 'param-2'],
    });

    // No error.
    expect(created.status).toEqual(201);

    // Make sure the body matches
    expect((created.body as any).type).toEqual('task-type-a');
    expect((created.body as any).name).toEqual('A test task');

    // Fetching task.
    const fetched = await global.asAdmin.get(`/tasks/${(created.body as any).id}`);
    expect(fetched.status).toEqual(200);
  });

  test('We should now have one task', async () => {
    const tasks = await global.asAdmin.get('/tasks');

    expect((tasks.body as any).tasks).toHaveLength(1);
  });

  test('Simple event', async () => {
    expect.assertions(4);

    const worker = new Promise<Worker>(resolve => {
      const _worker = new Worker(
        'jest',
        async job => {
          expect(job.name).toEqual('created');
          expect(job.data.type).toEqual('task-type-a');
          expect(job.data.context[0]).toEqual('urn:madoc:site:456');
          resolve(_worker);
        },
        global.workerOptions
      );
    });

    const created = await global.asAdmin.post('/tasks', {
      type: 'task-type-a',
      name: 'A test task',
      description: `A description of a test task`,
      subject: 'my-subject',
      state: {},
      events: ['jest.created'],
      status: 0,
      status_text: 'not started',
      parameters: ['param-1', 'param-2'],
    });

    expect(created.status).toEqual(201);

    await (await worker).disconnect();
    await (await worker).close(true);
  });
});
