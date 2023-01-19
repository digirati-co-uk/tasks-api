import { createApp } from '../src/app';

let createdTasks: string[] = [];

beforeEach(async () => {
  createdTasks = [];
  await global.setApp((baseConfig) => createApp(baseConfig));
});

afterEach(async () => {
  await Promise.all(createdTasks.map((createdTask) => global.asAdmin.delete(`/tasks/${createdTask}`)));
});

const baseTask = {
  type: 'example-type',
  name: 'A test task',
  description: `A description of a test task`,
  subject: 'default',
  state: {},
  events: [],
  status: 0,
  status_text: 'not started',
  parameters: ['param-1', 'param-2'],
};

function track(t: any) {
  createdTasks.push(t.body.id);
}

describe('Root statistics', function () {
  test('some statistics', async () => {
    const root = await global.asAdmin.post('/tasks', {
      ...baseTask,
      subject: 'urn:madoc:manifest:1',
    });
    track(root);
    const rootId: string = (root.body as any).id;

    // 2x status=1
    for (let i = 0; i < 2; i++) {
      await global.asAdmin.post('/tasks', {
        ...baseTask,
        subject: 'urn:madoc:manifest:1',
        root_task: rootId,
        parent_task: rootId,
        status: 1,
      });
    }

    // 3x status=2
    for (let i = 0; i < 3; i++) {
      await global.asAdmin.post('/tasks', {
        ...baseTask,
        subject: 'urn:madoc:manifest:1',
        root_task: rootId,
        parent_task: rootId,
        status: 2,
      });
    }

    // 4x status=3
    for (let i = 0; i < 4; i++) {
      await global.asAdmin.post('/tasks', {
        ...baseTask,
        subject: 'urn:madoc:manifest:1',
        root_task: rootId,
        parent_task: rootId,
        status: 3,
      });
    }

    // now refetch first task.
    const newList = await global.asAdmin.get(`/tasks/${rootId}?root_statistics=true`);
    expect((newList.body as any).root_statistics).toEqual({
      error: 0,
      not_started: 0,
      accepted: 2,
      progress: 3,
      done: 4,
    });
  });
});
