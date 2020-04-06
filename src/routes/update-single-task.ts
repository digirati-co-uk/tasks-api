import { RouteMiddleware } from '../types';
import { NotFound } from '../errors/not-found';
import { sql } from 'slonik';
import { UpdateTask } from '../schemas/UpdateTask';
import { RequestError } from '../errors/request-error';
import { mapSingleTask } from '../utility/map-single-task';

export const updateSingleTask: RouteMiddleware<{ id: string }> = async context => {
  const id = context.params.id;
  const userId = context.state.jwt.user.id;
  const isAdmin = context.state.jwt.scope.indexOf('tasks.admin') !== -1;
  const canOnlyProgress = !isAdmin && context.state.jwt.scope.indexOf('tasks.progress') !== -1;
  const taskChanges: UpdateTask = context.requestBody;

  const { assignee_id, creator_id } = await context.connection.one<{ assignee_id: string; creator_id: string }>(sql`
      SELECT t.assignee_id, t.creator_id 
      FROM tasks t 
      WHERE id = ${id} 
        AND context ?& ${sql.array(context.state.jwt.context, 'text')}
    `);

  if (canOnlyProgress && (creator_id !== userId || assignee_id !== userId)) {
    // Only apply status change.
    const updateRows = [];
    if (typeof taskChanges.status !== 'undefined') {
      updateRows.push(sql`status = ${taskChanges.status}`);
    }
    if (typeof taskChanges.status_text !== 'undefined') {
      updateRows.push(sql`status_text = ${taskChanges.status_text}`);
    }

    const task = await context.connection.one(sql`
      UPDATE tasks SET ${sql.join(updateRows, sql`, `)} WHERE id = ${id} RETURNING *
    `);

    context.response.body = mapSingleTask(task);
    return;
  }

  if (!isAdmin && (creator_id !== userId || assignee_id !== userId)) {
    throw new NotFound(); // Maybe access denied?
  }

  const updateRows = [];

  if (taskChanges.assignee) {
    updateRows.push(sql`assignee_id = ${taskChanges.assignee.id}`);
    updateRows.push(sql`assignee_name = ${taskChanges.assignee.name || ''}`);
    updateRows.push(sql`assignee_is_service = ${taskChanges.assignee.is_service || false}`);
  } else if (taskChanges.assignee === undefined && assignee_id) {
    updateRows.push(sql`assignee_id = ${null}`);
    updateRows.push(sql`assignee_name = ${null}`);
    updateRows.push(sql`assignee_is_service = ${false}`);
  }

  if (typeof taskChanges.description !== 'undefined') {
    updateRows.push(sql`description = ${taskChanges.description}`);
  }
  if (typeof taskChanges.state !== 'undefined') {
    updateRows.push(sql`state = state || ${JSON.stringify(taskChanges.state)}`);
  }
  if (typeof taskChanges.status !== 'undefined') {
    updateRows.push(sql`status = ${taskChanges.status}`);
  }
  if (typeof taskChanges.status_text !== 'undefined') {
    updateRows.push(sql`status_text = ${taskChanges.status_text}`);
  }
  if (updateRows.length === 0) {
    throw new RequestError('No data provided to update.');
  }

  const task = await context.connection.one(sql`
    UPDATE tasks SET ${sql.join(updateRows, sql`, `)} WHERE id = ${id} RETURNING *
  `);

  context.response.body = mapSingleTask(task);
};
