import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AdminAccountStatusUpdateMutationInput,
  AdminAccountStatusUpdateMutationOutput,
} from '@colanode/client/mutations/admin/account-status-update';
import { AppService } from '@colanode/client/services/app-service';
import { AdminAccountSummary } from '@colanode/client/types/admin';
import { parseApiError } from '@colanode/client/lib/ky';

export class AdminAccountStatusUpdateMutationHandler
  implements MutationHandler<AdminAccountStatusUpdateMutationInput>
{
  constructor(private readonly app: AppService) {}

  async handleMutation(
    input: AdminAccountStatusUpdateMutationInput
  ): Promise<AdminAccountStatusUpdateMutationOutput> {
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
        .patch(`v1/admin/accounts/${input.targetAccountId}/status`, {
          json: {
            status: input.status,
          },
        })
        .json<AdminAccountSummary>();

      return response;
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
