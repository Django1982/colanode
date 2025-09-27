export type AdminAccountPasswordResetMutationInput = {
  type: 'admin.account.password-reset';
  accountId: string;
  targetAccountId: string;
};

export type AdminAccountPasswordResetMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'admin.account.password-reset': {
      input: AdminAccountPasswordResetMutationInput;
      output: AdminAccountPasswordResetMutationOutput;
    };
  }
}
