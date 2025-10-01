import { eventBus } from '@colanode/client/lib/event-bus';
import { mapAccount, mapWorkspace } from '@colanode/client/lib/mappers';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';
import { ServerService } from '@colanode/client/services/server-service';
import { LoginSuccessOutput, WorkspaceStatus } from '@colanode/core';

export abstract class AccountMutationHandlerBase {
  protected readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  protected async handleLoginSuccess(
    login: LoginSuccessOutput,
    server: ServerService
  ): Promise<void> {
    const now = new Date().toISOString();

    const existingAccount = await this.app.database
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', login.account.id)
      .executeTakeFirst();

    let accountRow = existingAccount ?? null;

    if (existingAccount) {
      const updateData = {
        name: login.account.name,
        avatar: login.account.avatar ?? null,
        token: login.token,
        server_role: login.account.serverRole,
        updated_at: now,
      };

      await this.app.database
        .updateTable('accounts')
        .set(updateData)
        .where('id', '=', login.account.id)
        .execute();

      accountRow = {
        ...existingAccount,
        ...updateData,
      };
    } else {
      const createdAccount = await this.app.database
        .insertInto('accounts')
        .returningAll()
        .values({
          id: login.account.id,
          email: login.account.email,
          name: login.account.name,
          server: server.domain,
          token: login.token,
          device_id: login.deviceId,
          avatar: login.account.avatar ?? null,
          server_role: login.account.serverRole,
          created_at: now,
          updated_at: now,
        })
        .executeTakeFirst();

      if (!createdAccount) {
        throw new MutationError(
          MutationErrorCode.AccountLoginFailed,
          'Account login failed, please try again.'
        );
      }

      accountRow = createdAccount;
    }

    if (!accountRow) {
      throw new MutationError(
        MutationErrorCode.AccountLoginFailed,
        'Account login failed, please try again.'
      );
    }

    const account = mapAccount(accountRow);
    const accountService = await this.app.initAccount(account);

    if (existingAccount) {
      accountService.updateAccount(account);
      eventBus.publish({
        type: 'account.updated',
        account,
      });
    } else {
      eventBus.publish({
        type: 'account.created',
        account,
      });
    }

    if (login.workspaces.length === 0) {
      return;
    }

    for (const workspace of login.workspaces) {
      const workspaceNow = now;
      const existingWorkspace = await accountService.database
        .selectFrom('workspaces')
        .selectAll()
        .where('id', '=', workspace.id)
        .executeTakeFirst();

      if (existingWorkspace) {
        const workspaceUpdate = {
          name: workspace.name,
          role: workspace.user.role,
          storage_limit: workspace.user.storageLimit,
          max_file_size: workspace.user.maxFileSize,
          avatar: workspace.avatar ?? null,
          description: workspace.description ?? null,
          status: workspace.status ?? WorkspaceStatus.Active,
          deleted_at: workspace.deletedAt ?? null,
          api_enabled: workspace.apiEnabled ? 1 : 0,
        };

        await accountService.database
          .updateTable('workspaces')
          .set(workspaceUpdate)
          .where('id', '=', workspace.id)
          .execute();

        const updatedWorkspaceRow = {
          ...existingWorkspace,
          ...workspaceUpdate,
        };

        const mappedWorkspace = mapWorkspace(updatedWorkspaceRow);
        const workspaceService = accountService.getWorkspace(workspace.id);

        if (workspaceService) {
          workspaceService.updateWorkspace(mappedWorkspace);
        } else {
          await accountService.initWorkspace(mappedWorkspace);
        }

        eventBus.publish({
          type: 'workspace.updated',
          workspace: mappedWorkspace,
        });
      } else {
        const createdWorkspace = await accountService.database
          .insertInto('workspaces')
          .returningAll()
          .values({
            id: workspace.id,
            name: workspace.name,
            user_id: workspace.user.id,
            account_id: account.id,
            role: workspace.user.role,
            storage_limit: workspace.user.storageLimit,
            max_file_size: workspace.user.maxFileSize,
            avatar: workspace.avatar ?? null,
            description: workspace.description ?? null,
            status: workspace.status ?? WorkspaceStatus.Active,
            deleted_at: workspace.deletedAt ?? null,
            api_enabled: workspace.apiEnabled ? 1 : 0,
            created_at: workspaceNow,
          })
          .executeTakeFirst();

        if (!createdWorkspace) {
          continue;
        }

        const mappedWorkspace = mapWorkspace(createdWorkspace);
        await accountService.initWorkspace(mappedWorkspace);
        eventBus.publish({
          type: 'workspace.created',
          workspace: mappedWorkspace,
        });
      }
    }
  }
}
