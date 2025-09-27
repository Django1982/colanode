import { ServerRole } from '@colanode/core';
import { AdminAccountSummary } from '@colanode/client/types/admin';

export type AdminAccountServerRoleUpdateMutationInput = {
  type: 'admin.account.server-role.update';
  accountId: string;
  targetAccountId: string;
  serverRole: ServerRole;
};

export type AdminAccountServerRoleUpdateMutationOutput = AdminAccountSummary;

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'admin.account.server-role.update': {
      input: AdminAccountServerRoleUpdateMutationInput;
      output: AdminAccountServerRoleUpdateMutationOutput;
    };
  }
}
