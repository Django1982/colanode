export type AccountPasswordRotateMutationInput = {
  type: 'account.password.rotate';
  accountId: string;
  currentPassword: string;
  newPassword: string;
};

export type AccountPasswordRotateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'account.password.rotate': {
      input: AccountPasswordRotateMutationInput;
      output: AccountPasswordRotateMutationOutput;
    };
  }
}
