import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AdminAccountPasswordResetMutationInput,
  AdminAccountPasswordResetMutationOutput,
} from '@colanode/client/mutations/admin/account-password-reset';
import { AppService } from '@colanode/client/services/app-service';
import { parseApiError } from '@colanode/client/lib/ky';

export class AdminAccountPasswordResetMutationHandler
  implements MutationHandler<AdminAccountPasswordResetMutationInput>
{
  constructor(private readonly app: AppService) {}

  async handleMutation(
    input: AdminAccountPasswordResetMutationInput
  ): Promise<AdminAccountPasswordResetMutationOutput> {
    const account = this.app.getAccount(input.accountId);

    if (!account) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found.'
      );
    }

    if (account.serverRole !== 'administrator') {
      throw new MutationError(
        MutationErrorCode.ApiError,
        'Administrator permissions required.'
      );
    }

    try {
      const response = await account.client
        .post(`v1/admin/accounts/${input.targetAccountId}/password-reset`)
        .json<{ success: boolean }>();

      return {
        success: response.success,
      };
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
