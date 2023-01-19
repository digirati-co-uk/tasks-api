import { createApp } from '../src/app';
import { FullSingleTask } from '../src/schemas/FullSingleTask';

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

describe('All tasks - order by', function () {
  test('order by subject (asc)', async () => {
    const t1 = await global.asAdmin.post('/tasks', {
      ...baseTask,
      subject: 'urn:madoc:manifest:1',
    });
    createdTasks.push((t1.body as any).id);

    const t2 = await global.asAdmin.post('/tasks', {
      ...baseTask,
      subject: 'urn:madoc:manifest:2',
    });
    createdTasks.push((t2.body as any).id);

    const t3 = await global.asAdmin.post('/tasks', {
      ...baseTask,
      subject: 'urn:madoc:manifest:3',
    });
    createdTasks.push((t3.body as any).id);

    const BySubjectAsc = (await global.asAdmin.get('/tasks?sort_by=subject&detail=true')).body as { tasks: FullSingleTask[] };
    expect(BySubjectAsc.tasks.map((t) => t.subject)).toEqual([
      'urn:madoc:manifest:1',
      'urn:madoc:manifest:2',
      'urn:madoc:manifest:3',
    ]);
  });

  test('order by subject (desc)', async () => {
    const t1 = await global.asAdmin.post('/tasks', {
      ...baseTask,
      subject: 'urn:madoc:manifest:1',
    });
    createdTasks.push((t1.body as any).id);

    const t2 = await global.asAdmin.post('/tasks', {
      ...baseTask,
      subject: 'urn:madoc:manifest:2',
    });
    createdTasks.push((t2.body as any).id);

    const t3 = await global.asAdmin.post('/tasks', {
      ...baseTask,
      subject: 'urn:madoc:manifest:3',
    });
    createdTasks.push((t3.body as any).id);

    const BySubject = (await global.asAdmin.get('/tasks?sort_by=subject:desc&detail=true')).body as { tasks: FullSingleTask[] };
    expect(BySubject.tasks.map((t) => t.subject)).toEqual([
      'urn:madoc:manifest:3',
      'urn:madoc:manifest:2',
      'urn:madoc:manifest:1',
    ]);
  });
});
