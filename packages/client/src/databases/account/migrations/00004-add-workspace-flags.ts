import { Migration } from 'kysely';

export const addWorkspaceFlags: Migration = {
  up: async (db) => {
    await db.schema
      .alterTable('workspaces')
      .addColumn('status', 'integer', (col) => col.defaultTo(1))
      .addColumn('deleted_at', 'text')
      .addColumn('api_enabled', 'integer', (col) => col.defaultTo(0))
      .execute();

    await db
      .updateTable('workspaces')
      .set({ status: 1, api_enabled: 0 })
      .where('status', 'is', null)
      .execute();
  },
  down: async (db) => {
    await db.schema
      .alterTable('workspaces')
      .dropColumn('status')
      .dropColumn('deleted_at')
      .dropColumn('api_enabled')
      .execute();
  },
};
