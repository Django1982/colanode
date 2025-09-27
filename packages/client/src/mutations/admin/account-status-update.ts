import { AccountStatus } from '@colanode/core';
import { AdminAccountSummary } from '@colanode/client/types/admin';

export type AdminAccountStatusUpdateMutationInput = {
  type: 'admin.account.status.update';
  accountId: string;
  targetAccountId: string;
  status: AccountStatus;
};

export type AdminAccountStatusUpdateMutationOutput = AdminAccountSummary;

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'admin.account.status.update': {
      input: AdminAccountStatusUpdateMutationInput;
      output: AdminAccountStatusUpdateMutationOutput;
    };
  }
}
