// For coverage.
import '../src/app';
import { createApp } from '../src/app';

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
    expect(created.body.type).toEqual('task-type-a');
    expect(created.body.name).toEqual('A test task');

    // Fetching task.
    const fetched = await global.asAdmin.get(`/tasks/${created.body.id}`);
    expect(fetched.status).toEqual(200);
  });

  test('We should now have one task', async () => {
    const tasks = await global.asAdmin.get('/tasks');

    expect(tasks.body.tasks).toHaveLength(1);
  });
});
