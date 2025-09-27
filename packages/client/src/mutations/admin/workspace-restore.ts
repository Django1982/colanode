import { AdminWorkspaceSummary } from '@colanode/client/types/admin';

export type AdminWorkspaceRestoreMutationInput = {
  type: 'admin.workspace.restore';
  accountId: string;
  workspaceId: string;
};

export type AdminWorkspaceRestoreMutationOutput = AdminWorkspaceSummary;

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'admin.workspace.restore': {
      input: AdminWorkspaceRestoreMutationInput;
      output: AdminWorkspaceRestoreMutationOutput;
    };
  }
}
