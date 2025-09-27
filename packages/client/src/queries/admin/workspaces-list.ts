import { AdminWorkspaceSummary } from '@colanode/client/types/admin';

export type AdminWorkspacesListQueryInput = {
  type: 'admin.workspaces.list';
  accountId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'admin.workspaces.list': {
      input: AdminWorkspacesListQueryInput;
      output: AdminWorkspaceSummary[];
    };
  }
}
