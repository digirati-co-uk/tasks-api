# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/digirati-co-uk/tasks-api/compare/v1.0.4...main)

<!--
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
-->

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
