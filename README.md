# Tasks API
A generic service for storing the state of "Tasks" or units of work for users or other services.

## Installation
You can either grab the built docker image, or run your own server using the NPM package.

### Requirements
- Postgres 12+
- Node 12+ or Docker

### Docker

The image can be found at:
```
ghcr.io/digirati-co-uk/tasks-api:latest
```

You need to have a postgres available. Configuration is passed through environment variables.
- `DATABASE_HOST` - postgres host
- `DATABASE_USER` - postgres user
- `DATABASE_NAME` - name of the database

Some other environment variables are optional:
- `DATABASE_PORT` - postgres port (default: 5432)
- `SERVER_PORT` - server port internal (default: 3000)
- `REDIS_HOST` - redis host
- `REDIS_DB` - redis database
- `QUEUE_LIST` - comma separated list of queues to push

### NPM

First install with NPM or Yarn
```
$ npm install @madoc.io/tasks-api
$ yarn add @madoc.io/tasks-api
```

And create a javascript file to run your server:

```js
const { createApp } = require('@madoc.io/tasks-api');
const path = require('path');

createApp({
  migrate: true,
  migrationsPath: path.join(process.cwd(), './node_modules/@madoc.io/tasks-api/migrations'),
  postgres: `postgresql://postgres:postgres@localhost:5432/postgres`,
  env: 'production',
  enableQueue: false,
  queueList: []
}).then(app => {

    // Listen on a port.
    app.listen(8999);
});
```

`createApp` returns a promise, when resolve you can start to listen on a port. 


## BullMQ
If you set up a redis host, you can configure different events to be published to a BullMQ instance. This can then be consumed by an external service or services.

List of events:

- `created`
- `modified`
- `assigned`
- `status`
- `subtask_created`
- `deleted`
- `subtask_status`

Open an issue or discussion if you'd like more information on how these work.


## API Documentation


### Task lists
get all tasks
```
GET /tasks
```

get all statistics
```
GET /tasks/stats
```

export tasks
```
GET /tasks/export-all
```

create task
```
POST /tasks
```

import tasks
```
POST /tasks/import
```

batch delete
```
DELETE /tasks
```



### Single tasks
get single task
```
GET /tasks/:id
```

get task statistics
```
GET /tasks/:id/stats
```

update single task
```
PATCH /tasks/:id
```

update task metadata
```
PATCH /tasks/:id/metadata
```

delete task
```
DELETE /tasks/:id
```

delete subtasks
```
DELETE /tasks/:id/subtasks
```

create subtask
```
POST /tasks/:id/subtasks
```

get task subjects
```
GET /tasks/:id/subjects
```

post task subjects
```
POST /tasks/:id/subjects
```

accept task
```
POST /tasks/:id/accept
```

post task event
```
POST /tasks/:id/dispatch/:event
```

unassign task
```
POST /tasks/:id/unassign
```


