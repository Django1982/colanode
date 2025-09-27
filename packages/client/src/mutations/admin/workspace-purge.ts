import { AdminWorkspaceSummary } from '@colanode/client/types/admin';

export type AdminWorkspacePurgeMutationInput = {
  type: 'admin.workspace.purge';
  accountId: string;
  workspaceId: string;
};

export type AdminWorkspacePurgeMutationOutput = AdminWorkspaceSummary;

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'admin.workspace.purge': {
      input: AdminWorkspacePurgeMutationInput;
      output: AdminWorkspacePurgeMutationOutput;
    };
  }
}
