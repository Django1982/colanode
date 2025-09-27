import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { QueryError, QueryErrorCode } from '@colanode/client/queries';
import { AdminAccountsListQueryInput } from '@colanode/client/queries/admin/accounts-list';
import { AppService } from '@colanode/client/services/app-service';
import { AdminAccountSummary } from '@colanode/client/types/admin';
import { Event } from '@colanode/client/types/events';

export class AdminAccountsListQueryHandler
  implements QueryHandler<AdminAccountsListQueryInput>
{
  constructor(private readonly app: AppService) {}

  async handleQuery(
    input: AdminAccountsListQueryInput
  ): Promise<AdminAccountSummary[]> {
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
      .get('v1/admin/accounts')
      .json<AdminAccountSummary[]>();

    return response;
  }

  async checkForChanges(
    _event: Event,
    _input: AdminAccountsListQueryInput,
    output: AdminAccountSummary[]
  ): Promise<ChangeCheckResult<AdminAccountsListQueryInput>> {
    return {
      hasChanges: false,
      result: output,
    };
  }
}
