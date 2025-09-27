import { Migration } from 'kysely';

import { createWorkspacesTable } from './00001-create-workspaces-table';
import { createMetadataTable } from './00002-create-metadata-table';
import { createAvatarsTable } from './00003-create-avatars-table';
import { addWorkspaceFlags } from './00004-add-workspace-flags';

export const accountDatabaseMigrations: Record<string, Migration> = {
  '00001-create-workspaces-table': createWorkspacesTable,
  '00002-create-metadata-table': createMetadataTable,
  '00003-create-avatars-table': createAvatarsTable,
  '00004-add-workspace-flags': addWorkspaceFlags,
};
