# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/digirati-co-uk/tasks-api/compare/v1.1.3...main)

<!--
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
-->

## [v1.1.3](https://github.com/digirati-co-uk/tasks-api/compare/v1.1.2...v1.1.3)

### Fixed
- Fixed ascii characters in tokens
- Fixed Postgres connection timeout

## [v1.1.2](https://github.com/digirati-co-uk/tasks-api/compare/v1.1.1...v1.1.2)

### Added
- Added 2 `group_by` option to task stats endpoint
  - `group_by=creator` - returns statistics for each creator
  - `group_by=assignee` - returns statistics for each assignee

## [v1.1.1](https://github.com/digirati-co-uk/tasks-api/compare/v1.1.0...v1.1.1)

### Added
- Added `assignee_id` to `order_by` sorting options.

## [v1.1.0](https://github.com/digirati-co-uk/tasks-api/compare/v1.0.6...v1.1.0)

### Added
- Added missing index on `delegated_task` which greatly improves performance of large tasks.
- New sorting options
  -`order_by=` now takes in a comma separated list of columns from the following list:
    - `subject`
    - `subject_parent`
    - `created_at`
    - `modified_at`
    - `status`
    - `title`
  - Can optionally specify an order: (e.g. `subject:desc`)
  - Multiple sorts will be processed in order: (e.g. `subject:desc,status:asc`)
- Details root-task statistics
  - adding `root_statistics=true` to `/tasks/:id` will enable
  - Returns new field:
```json
{
  "root_statistics": {
    "accepted": 2,
    "done": 4,
    "error": 0,
    "not_started": 0,
    "progress": 3
  }
}
```

### Fixed
- Fixed permission issue with progressing tasks

## [1.0.6](https://github.com/digirati-co-uk/tasks-api/compare/v1.0.5...v1.0.6) - 2022-08-30

### Fixed
- Missing handling of `all` parameter in task list
- Fixed casting of boolean query strings (e.g. handling `?all_tasks=false`)

## [1.0.5](https://github.com/digirati-co-uk/tasks-api/compare/v1.0.4...v1.0.5) - 2022-04-25

### Fixed
- Fixed orphaned tasks (via parent_task)

## [1.0.4](https://github.com/digirati-co-uk/tasks-api/compare/v1.0.3...v1.0.4) - 2022-01-24

### Fixed
- Fixed integrity constraint when deleting tasks

## [1.0.3](https://github.com/digirati-co-uk/tasks-api/compare/v1.0.2...v1.0.3) - 2021-12-03

### Added
- Added queue retrying (3, 1000ms exponential backoff)
- Added new environment variable `QUEUE_RETRY_ATTEMPTS` (default: 5)

## [1.0.2](https://github.com/digirati-co-uk/tasks-api/releases/tag/v1.0.2) - 2021-10-28

### Fixed
- Missing subtasks when not querying for a subject

## [1.0.1](https://github.com/digirati-co-uk/tasks-api/releases/tag/v1.0.1) - 2021-10-13

### Fixed
- Added semver tags
- Remove unused dev dependencies
- Update ansi-regex (dev dependency)

## [1.0.0](https://github.com/digirati-co-uk/tasks-api/releases/tag/v1.0.0) - 2021-10-13
First stable release of the Tasks API.

- Create custom task definitions
- Update / Delete tasks and subtasks
- React to task changes in events using BullMQ
- Protected by JWT (no validation)
  - Sandboxed using JWT issuer (`iss`)
  - Tasks can be assigned to JWT subject (`sub`)
  - JWT scopes: `tasks.admin`, `tasks.create`
  - Users have access to tasks assigned to them
- Return statistics for your tasks
- Search / filter tasks
