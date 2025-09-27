import { AdminAccountSummary } from '@colanode/client/types/admin';

export type AdminAccountsListQueryInput = {
  type: 'admin.accounts.list';
  accountId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'admin.accounts.list': {
      input: AdminAccountsListQueryInput;
      output: AdminAccountSummary[];
    };
  }
}
