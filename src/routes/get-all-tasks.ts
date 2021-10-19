import { RouteMiddleware } from '../types';
import { NotFoundError, sql } from 'slonik';
import { date } from '../utility/date';
import { mapSingleTask } from '../utility/map-single-task';

function getStatus(statusQuery: string) {
  if (!statusQuery) {
    return sql``;
  }

  if (statusQuery.indexOf(',') === -1) {
    const singleStatus = Number(statusQuery);
    if (Number.isNaN(singleStatus)) {
      return sql``;
    }

    return sql`and t.status = ${singleStatus}`;
  }

  const statuses = statusQuery.split(',');
  const parsedStatuses: number[] = [];
  for (const status of statuses) {
    const singleStatus = Number(status);
    if (Number.isNaN(singleStatus)) {
      continue;
    }
    parsedStatuses.push(singleStatus);
  }

  if (parsedStatuses.length === 0) {
    return sql``;
  }

  return sql`and t.status = any (${sql.array(parsedStatuses, sql`int[]`)})`;
}

export const getAllTasks: RouteMiddleware = async (context) => {
  // Subject facet.
  // Type filter.
  // Include sub-tasks filter.
  const isAdmin = context.state.jwt.scope.indexOf('tasks.admin') !== -1;
  const canCreate = context.state.jwt.scope.indexOf('tasks.create') !== -1;
  const userId = context.state.jwt.user.id;
  const typeFilter = context.query.type ? sql`and t.type = ${context.query.type}` : sql``;
  const subjectFilter = context.query.subject ? sql`and t.subject = ${context.query.subject}` : sql``;
  const sortByNewest = context.query.sortBy ? context.query.sort_by === 'newest' : false;
  const parentSubjectFilter = context.query.subject_parent
    ? sql`and t.subject_parent = ${context.query.subject_parent}`
    : sql``;
  const statusFilter = getStatus(context.query.status as string);
  const subtaskExclusion =
    context.query.all_tasks || context.query.root_task_id || context.query.parent_task_id
      ? sql``
      : sql`and t.parent_task is null`;
  const assigneeId = context.query.assignee;
  const userExclusion =
    isAdmin || canCreate
      ? assigneeId
        ? // Admin assignee.
          sql`and (t.assignee_id = ${assigneeId})`
        : sql``
      : assigneeId
      ? // Normal user assignee.
        sql`and (t.assignee_id = ${userId})`
      : sql`and (t.creator_id = ${userId} OR t.assignee_id = ${userId} OR ${userId} = ANY (t.delegated_owners) OR dt.assignee_id = ${userId})`;
  const rootTaskFilter = context.query.root_task_id ? sql`and t.root_task = ${context.query.root_task_id}` : sql``;
  const parentTaskFilter = context.query.parent_task_id
    ? sql`and t.parent_task = ${context.query.parent_task_id}`
    : sql``;

  const page = Number(context.query.page || 1);
  const userPerPage = context.query.per_page ? Number(context.query.per_page) : 50;
  const perPage = userPerPage < 50 ? userPerPage : 50;
  const offset = (page - 1) * perPage;
  const taskPagination = sql`limit ${perPage} offset ${offset}`;
  const detail = !!context.query.detail;
  const detailedFields = detail
    ? sql`, t.assignee_name, t.parameters, t.assignee_id, t.subject, t.subject_parent, t.root_task, t.parent_task, t.modified_at, t.state`
    : sql``;
  const orderBy = sortByNewest ? sql`order by t.modified_at asc` : sql`order by t.modified_at desc`;

  // Modified search
  const modifiedStartFilter = context.query.modified_date_start
    ? sql`and t.modified_at > ${date(new Date(context.query.modified_date_start as string))}`
    : sql``;
  const modifiedEndFilter = context.query.modified_date_end
    ? sql`and t.modified_at <= ${date(new Date(context.query.modified_date_end as string))}`
    : sql``;

  const modifiedInterval = context.query.modified_date_interval
    ? sql`and t.modified_at > (now() - ${context.query.modified_date_interval}::interval)`
    : sql``;

  // Created search
  const createdStartFilter = context.query.created_date_start
    ? sql`and t.created_at > ${date(new Date(context.query.created_date_start as string))}`
    : sql``;
  const createdEndFilter = context.query.created_date_end
    ? sql`and t.created_at <= ${date(new Date(context.query.created_date_end as string))}`
    : sql``;

  const createdInterval = context.query.created_date_interval
    ? sql`and t.created_at > (now() - ${context.query.created_date_interval}::interval)`
    : sql``;

  try {
    const countQuery = sql<{ total_items: number }>`
        select COUNT(*) as total_items from tasks t
        left join tasks dt on t.delegated_task = dt.id
        where t.context ?& ${sql.array(context.state.jwt.context, 'text')}
        ${subtaskExclusion}
        ${userExclusion}
        ${typeFilter}
        ${subjectFilter}
        ${parentSubjectFilter}
        ${statusFilter}
        ${rootTaskFilter}
        ${parentTaskFilter}
        ${modifiedStartFilter}
        ${modifiedEndFilter}
        ${modifiedInterval}
        ${createdStartFilter}
        ${createdEndFilter}
        ${createdInterval}
    `;
    const query = sql`
      SELECT t.id, t.name, t.status, t.status_text, t.metadata, t.type ${detailedFields}
      FROM tasks t 
      LEFT JOIN tasks dt on t.delegated_task = dt.id
      WHERE t.context ?& ${sql.array(context.state.jwt.context, 'text')}
        ${subtaskExclusion}
        ${userExclusion}
        ${typeFilter}
        ${subjectFilter}
        ${parentSubjectFilter}
        ${statusFilter}
        ${rootTaskFilter}
        ${parentTaskFilter}
        ${modifiedStartFilter}
        ${modifiedEndFilter}
        ${modifiedInterval}
        ${createdStartFilter}
        ${createdEndFilter}
        ${createdInterval}
        ${orderBy}
    `;

    const { total_items: rowCount } = await context.connection.one(countQuery);

    const taskList = await context.connection.many(
      sql`
        ${query}
        ${taskPagination}
      `
    );

    context.response.body = {
      tasks: taskList.map((task) => mapSingleTask(task)),
      pagination: {
        page,
        totalResults: rowCount,
        totalPages: Math.ceil(rowCount / perPage),
      },
    };
  } catch (e) {
    if (e instanceof NotFoundError) {
      context.response.body = { tasks: [], pagination: { page: 1, totalPages: 1, totalResults: 0 } };
    } else {
      throw e;
    }
  }
};
