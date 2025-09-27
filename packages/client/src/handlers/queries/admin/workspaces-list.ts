import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { QueryError, QueryErrorCode } from '@colanode/client/queries';
import { AdminWorkspacesListQueryInput } from '@colanode/client/queries/admin/workspaces-list';
import { AppService } from '@colanode/client/services/app-service';
import { AdminWorkspaceSummary } from '@colanode/client/types/admin';
import { Event } from '@colanode/client/types/events';

export class AdminWorkspacesListQueryHandler
  implements QueryHandler<AdminWorkspacesListQueryInput>
{
  constructor(private readonly app: AppService) {}

  async handleQuery(
    input: AdminWorkspacesListQueryInput
  ): Promise<AdminWorkspaceSummary[]> {
    const account = this.app.getAccount(input.accountId);

    if (!account) {
      throw new QueryError(
        QueryErrorCode.AccountNotFound,
        'Account not found.'
      );
    }

    if (account.serverRole !== 'administrator') {
      throw new QueryError(
        QueryErrorCode.ApiError,
        'Administrator permissions required.'
      );
    }

    const response = await account.client
      .get('v1/admin/workspaces')
      .json<AdminWorkspaceSummary[]>();

    return response;
  }

  async checkForChanges(
    _event: Event,
    _input: AdminWorkspacesListQueryInput,
    output: AdminWorkspaceSummary[]
  ): Promise<ChangeCheckResult<AdminWorkspacesListQueryInput>> {
    return {
      hasChanges: false,
      result: output,
    };
  }
}
