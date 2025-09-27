import { Migration } from 'kysely';

export const addServerRoleToAccounts: Migration = {
  up: async (db) => {
    await db.schema
      .alterTable('accounts')
      .addColumn('server_role', 'text', (col) => col.notNull().defaultTo('member'))
      .execute();

    await db
      .updateTable('accounts')
      .set({ server_role: 'member' })
      .where('server_role', 'is', null)
      .execute();
  },
  down: async (db) => {
    await db.schema
      .alterTable('accounts')
      .dropColumn('server_role')
      .execute();
  },
};
