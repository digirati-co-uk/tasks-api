import { RouteMiddleware } from '../types';
import { NotFound } from '../errors/not-found';
import { CreateTask } from '../schemas/CreateTask';
import { v4 } from 'uuid';
import { insertTask } from '../database/insert-task';
import { validateEvents } from '../utility/events';
import { mapSingleTask } from '../utility/map-single-task';

export const createTask: RouteMiddleware<{}, CreateTask> = async (context, next) => {
  const isAdmin = context.state.jwt.scope.indexOf('tasks.admin') !== -1;
  const canCreate = isAdmin || context.state.jwt.scope.indexOf('tasks.create') !== -1;
  const task = context.requestBody;

  if (!canCreate) {
    throw new NotFound();
  }

  if (task.events) {
    task.events = validateEvents(task.events, context.state.queueList);
  }

  const id = v4();
  const taskContext = context.state.jwt.context;
  if (task.context) {
    taskContext.push(...task.context);
  }

  const insertedTask = await insertTask(context.connection, {
    id,
    task,
    user: context.state.jwt.user,
    context: taskContext,
  });

  // Task events
  const taskWithId = { id, ...task };
  context.state.dispatch(taskWithId, 'created');
  if (task.assignee) {
    context.state.dispatch(taskWithId, 'assigned', undefined, task.assignee);
    context.state.dispatch(taskWithId, 'assigned_to', task.assignee.id, task.assignee);
  }
  if (typeof task.status !== 'undefined') {
    context.state.dispatch(taskWithId, 'status', task.status, { status_text: task.status_text });
  }

  context.response.status = 201;
  context.response.body = mapSingleTask(insertedTask);
};
