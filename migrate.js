const { setupSlonikMigrator } = require('@slonik/migrator');
const { createPool } = require('slonik');
const path = require('path');

const slonik = createPool(
  `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`
);

const migrationsPath = process.env.MIGRATIONS_PATH || process.cwd();

const migrator = setupSlonikMigrator({
  migrationsPath: path.join(process.cwd(), '/migrations'),
  slonik,
  mainModule: module,
});

module.exports = { slonik, migrator };
