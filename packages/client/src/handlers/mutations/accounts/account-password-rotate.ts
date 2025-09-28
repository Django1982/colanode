import { parseApiError } from '@colanode/client/lib/ky';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AccountPasswordRotateMutationInput,
  AccountPasswordRotateMutationOutput,
} from '@colanode/client/mutations/accounts/account-password-rotate';
import { AppService } from '@colanode/client/services/app-service';
import type {
  PasswordRotateInput,
  PasswordRotateOutput,
} from '@colanode/core';

export class AccountPasswordRotateMutationHandler
  implements MutationHandler<AccountPasswordRotateMutationInput>
{
  constructor(private readonly app: AppService) {}

  async handleMutation(
    input: AccountPasswordRotateMutationInput
  ): Promise<AccountPasswordRotateMutationOutput> {
    const accountService = this.app.getAccount(input.accountId);

    if (!accountService) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    try {
      const body: PasswordRotateInput = {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      };

      const response = await accountService.client
        .post('v1/accounts/password', {
          json: body,
        })
        .json<PasswordRotateOutput>();

      if (!response.success) {
        throw new Error('Password rotation failed.');
      }

      await accountService.logout();

      return {
        success: true,
      };
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
