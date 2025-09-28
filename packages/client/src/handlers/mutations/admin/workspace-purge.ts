import { parseApiError } from '@colanode/client/lib/ky';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  AdminWorkspacePurgeMutationInput,
  AdminWorkspacePurgeMutationOutput,
} from '@colanode/client/mutations/admin/workspace-purge';
import { AppService } from '@colanode/client/services/app-service';
import { AdminWorkspaceSummary } from '@colanode/client/types/admin';

export class AdminWorkspacePurgeMutationHandler
  implements MutationHandler<AdminWorkspacePurgeMutationInput>
{
  constructor(private readonly app: AppService) {}

  async handleMutation(
    input: AdminWorkspacePurgeMutationInput
  ): Promise<AdminWorkspacePurgeMutationOutput> {
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
        .post(`v1/admin/workspaces/${input.workspaceId}/purge`)
        .json<AdminWorkspaceSummary>();

      return response;
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
