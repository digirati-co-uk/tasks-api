# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/digirati-co-uk/madoc-platform/compare/v1.0.0...main)

## [1.0.0](https://github.com/digirati-co-uk/madoc-platform/releases/tag/v1.0.0) - 2021-10-13
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