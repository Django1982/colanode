import { Migration, sql } from 'kysely';

export const addApiTokensAndAuditLogs: Migration = {
  up: async (db) => {
    await sql`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS api_enabled boolean NOT NULL DEFAULT false`.execute(db);

    await sql`
      CREATE TABLE IF NOT EXISTS api_tokens (
        id text PRIMARY KEY,
        workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        scopes text[] NOT NULL DEFAULT ARRAY['read'],
        token_prefix text NOT NULL,
        token_salt text NOT NULL,
        token_hash text NOT NULL,
        expires_at timestamptz,
        last_rotated_at timestamptz,
        last_used_at timestamptz,
        disabled_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by text REFERENCES users(id) ON DELETE SET NULL
      )
    `.execute(db);

    await sql`CREATE INDEX IF NOT EXISTS api_tokens_workspace_idx ON api_tokens (workspace_id)`.execute(db);
    await sql`CREATE INDEX IF NOT EXISTS api_tokens_user_idx ON api_tokens (user_id)`.execute(db);
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS api_tokens_workspace_user_name_idx ON api_tokens (workspace_id, user_id, name)`.execute(db);

    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id text PRIMARY KEY,
        workspace_id text REFERENCES workspaces(id) ON DELETE SET NULL,
        user_id text REFERENCES users(id) ON DELETE SET NULL,
        account_id text REFERENCES accounts(id) ON DELETE SET NULL,
        api_token_id text REFERENCES api_tokens(id) ON DELETE SET NULL,
        action text NOT NULL,
        resource_type text NOT NULL,
        resource_id text,
        metadata jsonb,
        ip_address text,
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `.execute(db);

    await sql`CREATE INDEX IF NOT EXISTS audit_logs_workspace_idx ON audit_logs (workspace_id)`.execute(db);
    await sql`CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at)`.execute(db);
  },
  down: async (db) => {
    await sql`DROP INDEX IF EXISTS audit_logs_created_at_idx`.execute(db);
    await sql`DROP INDEX IF EXISTS audit_logs_workspace_idx`.execute(db);
    await sql`DROP TABLE IF EXISTS audit_logs`.execute(db);

    await sql`DROP INDEX IF EXISTS api_tokens_workspace_user_name_idx`.execute(db);
    await sql`DROP INDEX IF EXISTS api_tokens_user_idx`.execute(db);
    await sql`DROP INDEX IF EXISTS api_tokens_workspace_idx`.execute(db);
    await sql`DROP TABLE IF EXISTS api_tokens`.execute(db);

    await sql`ALTER TABLE workspaces DROP COLUMN IF EXISTS api_enabled`.execute(db);
  },
};
