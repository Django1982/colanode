import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AdminAccountServerRoleUpdateMutationInput,
  AdminAccountServerRoleUpdateMutationOutput,
} from '@colanode/client/mutations/admin/account-server-role-update';
import { AppService } from '@colanode/client/services/app-service';
import { AdminAccountSummary } from '@colanode/client/types/admin';
import { parseApiError } from '@colanode/client/lib/ky';

export class AdminAccountServerRoleUpdateMutationHandler
  implements MutationHandler<AdminAccountServerRoleUpdateMutationInput>
{
  constructor(private readonly app: AppService) {}

  async handleMutation(
    input: AdminAccountServerRoleUpdateMutationInput
  ): Promise<AdminAccountServerRoleUpdateMutationOutput> {
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
        .patch(`v1/admin/accounts/${input.targetAccountId}/server-role`, {
          json: {
            serverRole: input.serverRole,
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
