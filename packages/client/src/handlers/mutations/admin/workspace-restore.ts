import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AdminWorkspaceRestoreMutationInput,
  AdminWorkspaceRestoreMutationOutput,
} from '@colanode/client/mutations/admin/workspace-restore';
import { AppService } from '@colanode/client/services/app-service';
import { AdminWorkspaceSummary } from '@colanode/client/types/admin';
import { parseApiError } from '@colanode/client/lib/ky';

export class AdminWorkspaceRestoreMutationHandler
  implements MutationHandler<AdminWorkspaceRestoreMutationInput>
{
  constructor(private readonly app: AppService) {}

  async handleMutation(
    input: AdminWorkspaceRestoreMutationInput
  ): Promise<AdminWorkspaceRestoreMutationOutput> {
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
        .post(`v1/admin/workspaces/${input.workspaceId}/restore`)
        .json<AdminWorkspaceSummary>();

      return response;
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
