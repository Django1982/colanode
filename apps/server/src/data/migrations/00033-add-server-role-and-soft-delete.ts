import { Migration, sql } from 'kysely';

export const addServerRoleAndSoftDelete: Migration = {
  up: async (db) => {
    await sql`
      ALTER TABLE accounts
      ADD COLUMN IF NOT EXISTS server_role text NOT NULL DEFAULT 'member'
    `.execute(db);

    await sql`
      ALTER TABLE workspaces
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz
    `.execute(db);

    await sql`
      WITH first_account AS (
        SELECT id FROM accounts ORDER BY created_at ASC LIMIT 1
      )
      UPDATE accounts
      SET server_role = 'administrator'
      WHERE id IN (SELECT id FROM first_account)
    `.execute(db);
  },
  down: async (db) => {
    await sql`ALTER TABLE workspaces DROP COLUMN IF EXISTS deleted_at`.execute(db);
    await sql`ALTER TABLE accounts DROP COLUMN IF EXISTS server_role`.execute(db);
  },
};
