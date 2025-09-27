import { Migration } from 'kysely';

export const createWorkspacesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('workspaces')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('user_id', 'text', (col) => col.notNull())
      .addColumn('account_id', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('avatar', 'text')
      .addColumn('role', 'text', (col) => col.notNull())
      .addColumn('storage_limit', 'integer', (col) => col.notNull())
      .addColumn('max_file_size', 'integer', (col) => col.notNull())
      .addColumn('status', 'integer', (col) => col.notNull().defaultTo(1))
      .addColumn('deleted_at', 'text')
      .addColumn('api_enabled', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('created_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('workspaces').execute();
  },
};
