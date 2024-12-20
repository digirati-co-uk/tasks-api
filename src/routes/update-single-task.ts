import { RouteMiddleware } from '../types';
import { NotFound } from '../errors/not-found';
import { sql } from 'slonik';
import { UpdateTask } from '../schemas/UpdateTask';
import { RequestError } from '../errors/request-error';
import { mapSingleTask } from '../utility/map-single-task';
import { dispatchUpdateSubtaskStatus } from '../utility/dispatch-update-subtask-status';

export const updateSingleTask: RouteMiddleware<{ id: string }> = async (context) => {
  const id = context.params.id;
  const userId = context.state.jwt.user.id;
  const isAdmin = context.state.jwt.scope.indexOf('tasks.admin') !== -1;
  const canCreate = isAdmin || context.state.jwt.scope.indexOf('tasks.create') !== -1;
  const canOnlyProgress = !isAdmin && !canCreate && context.state.jwt.scope.indexOf('tasks.progress') !== -1;
  const taskChanges: UpdateTask = context.requestBody;
  let statusChanged = false;

  const { assignee_id, creator_id, delegated_assignee, events, type } = await context.connection.one<{
    assignee_id: string;
    creator_id: string;
    delegated_assignee?: string;
    events?: string[];
    type: string;
  }>(sql`
      SELECT t.assignee_id, t.creator_id, t.events, t.type, dt.assignee_id as delegated_assignee
      FROM tasks t
      left join tasks dt on t.delegated_task = dt.id
      WHERE t.id = ${id}
        AND t.context ?& ${sql.array(context.state.jwt.context, 'text')}::text[]
    `);

  const taskWithId = { id, type, events };
  if (canOnlyProgress && (creator_id === userId || assignee_id === userId || delegated_assignee === userId)) {
    // Only apply status change.
    const updateRows = [];
    if (typeof taskChanges.status !== 'undefined') {
      statusChanged = true;
      updateRows.push(sql`status = ${taskChanges.status}`);
    }
    if (typeof taskChanges.status_text !== 'undefined') {
      updateRows.push(sql`status_text = ${taskChanges.status_text}`);
    }

    if (updateRows.length === 0) {
      throw new RequestError('Status not updated');
    }

    updateRows.push(sql`modified_at = CURRENT_TIMESTAMP`);

    const task = await context.connection.one(sql`
      UPDATE tasks SET ${sql.join(updateRows, sql`, `)} WHERE id = ${id} RETURNING *
    `);

    if (taskChanges.status === 0) {
      context.state.dispatch(taskWithId, 'created');
    }

    context.state.dispatch(taskWithId, 'modified');

    if (statusChanged) {
      context.state.dispatch(taskWithId, 'status', taskChanges.status, { status_text: taskChanges.status_text });
    }

    context.response.body = mapSingleTask(task);

    // Special event:
    // subtask_type_status.{type}.{status}
    if (statusChanged) {
      await dispatchUpdateSubtaskStatus(task, context.connection, context.state);
    }

    return;
  }

  if (!isAdmin && creator_id !== userId && assignee_id !== userId && delegated_assignee !== userId) {
    throw new NotFound(); // Maybe access denied?
  }

  const updateRows = [];

  if (taskChanges.delegated_owners) {
    updateRows.push(sql`delegated_owners = ${sql.array(taskChanges.delegated_owners, 'text')}`);
  }

  if (taskChanges.delegated_task) {
    updateRows.push(sql`delegated_task = ${taskChanges.delegated_task}`);
  }

  if (taskChanges.assignee) {
    updateRows.push(sql`assignee_id = ${taskChanges.assignee.id}`);
    updateRows.push(sql`assignee_name = ${taskChanges.assignee.name || ''}`);
    updateRows.push(sql`assignee_is_service = ${taskChanges.assignee.is_service || false}`);
    context.state.dispatch(taskWithId, 'assigned');
    context.state.dispatch(taskWithId, 'assigned_to', taskChanges.assignee.id, {
      id: taskChanges.assignee.id,
      name: taskChanges.assignee.name,
      is_service: taskChanges.assignee.is_service,
    });
  } else if (taskChanges.assignee === null && assignee_id) {
    updateRows.push(sql`assignee_id = ${null}`);
    updateRows.push(sql`assignee_name = ${null}`);
    updateRows.push(sql`assignee_is_service = ${false}`);
    context.state.dispatch(taskWithId, 'assigned');
  }

  if (typeof taskChanges.name !== 'undefined') {
    updateRows.push(sql`name = ${taskChanges.name}`);
  }

  if (typeof taskChanges.description !== 'undefined') {
    updateRows.push(sql`description = ${taskChanges.description}`);
  }
  if (typeof taskChanges.state !== 'undefined') {
    updateRows.push(sql`state = state || ${JSON.stringify(taskChanges.state)}`);
  }
  if (typeof taskChanges.metadata !== 'undefined') {
    updateRows.push(sql`metadata = metadata || ${JSON.stringify(taskChanges.metadata)}`);
  }
  if (typeof taskChanges.status !== 'undefined') {
    statusChanged = true;
    updateRows.push(sql`status = ${taskChanges.status}`);
    context.state.dispatch(taskWithId, 'status', taskChanges.status, { status_text: taskChanges.status_text });
  }
  if (typeof taskChanges.status_text !== 'undefined') {
    updateRows.push(sql`status_text = ${taskChanges.status_text}`);
  }
  if (updateRows.length === 0) {
    throw new RequestError('No data provided to update.');
  }

  updateRows.push(sql`modified_at = CURRENT_TIMESTAMP`);

  const task = await context.connection.one(sql`
    UPDATE tasks SET ${sql.join(updateRows, sql`, `)} WHERE id = ${id} RETURNING *
  `);

  if (taskChanges.status === 0) {
    context.state.dispatch(taskWithId, 'created');
  }

  // Special event:
  // subtask_type_status.{type}.{status}
  if (statusChanged) {
    await dispatchUpdateSubtaskStatus(task, context.connection, context.state);
  }

  context.state.dispatch(taskWithId, 'modified');

  context.response.body = mapSingleTask(task);
};
