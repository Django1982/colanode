import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AdminAccountSummary,
  AdminWorkspaceSummary,
} from '@colanode/client/types/admin';
import { AccountStatus, ServerRole, WorkspaceStatus } from '@colanode/core';
import { Button } from '@colanode/ui/components/ui/button';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useAccount } from '@colanode/ui/contexts/account';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { cn } from '@colanode/ui/lib/utils';

const accountStatusLabels: Record<AccountStatus, string> = {
  [AccountStatus.Pending]: 'Pending',
  [AccountStatus.Active]: 'Active',
  [AccountStatus.Unverified]: 'Unverified',
};

const workspaceStatusLabels: Record<WorkspaceStatus, string> = {
  [WorkspaceStatus.Active]: 'Active',
  [WorkspaceStatus.Inactive]: 'Inactive',
};

type AdminTab = 'accounts' | 'workspaces';

export const SidebarAdmin = () => {
  const account = useAccount();
  const [activeTab, setActiveTab] = useState<AdminTab>('accounts');
  const [accountFilter, setAccountFilter] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('');

  const accountsQuery = useQuery(
    {
      type: 'admin.accounts.list',
      accountId: account.id,
    },
    {
      enabled: account.serverRole === 'administrator',
    }
  );

  const workspacesQuery = useQuery(
    {
      type: 'admin.workspaces.list',
      accountId: account.id,
    },
    {
      enabled: account.serverRole === 'administrator',
    }
  );

  const { mutate: updateServerRole, isPending: isUpdatingServerRole } =
    useMutation();
  const { mutate: updateAccountStatus, isPending: isUpdatingAccountStatus } =
    useMutation();
  const { mutate: triggerPasswordReset, isPending: isTriggeringReset } =
    useMutation();
  const { mutate: restoreWorkspace, isPending: isRestoringWorkspace } =
    useMutation();
  const { mutate: purgeWorkspace, isPending: isPurgingWorkspace } =
    useMutation();

  const filteredAccounts = useMemo(() => {
    const list = accountsQuery.data ?? [];
    if (!accountFilter.trim()) {
      return list;
    }

    const query = accountFilter.toLowerCase();
    return list.filter((item) =>
      [item.name, item.email]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [accountFilter, accountsQuery.data]);

  const filteredWorkspaces = useMemo(() => {
    const list = workspacesQuery.data ?? [];
    if (!workspaceFilter.trim()) {
      return list;
    }

    const query = workspaceFilter.toLowerCase();
    return list.filter((item) =>
      [item.name, item.description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [workspaceFilter, workspacesQuery.data]);

  const handleServerRoleChange = (
    targetAccountId: string,
    serverRole: ServerRole
  ) => {
    updateServerRole({
      input: {
        type: 'admin.account.server-role.update',
        accountId: account.id,
        targetAccountId,
        serverRole,
      },
      onSuccess() {
        toast.success('Server role updated');
        accountsQuery.refetch();
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const handleAccountStatusChange = (
    targetAccountId: string,
    status: AccountStatus
  ) => {
    updateAccountStatus({
      input: {
        type: 'admin.account.status.update',
        accountId: account.id,
        targetAccountId,
        status,
      },
      onSuccess() {
        toast.success('Account status updated');
        accountsQuery.refetch();
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const handlePasswordReset = (targetAccountId: string) => {
    triggerPasswordReset({
      input: {
        type: 'admin.account.password-reset',
        accountId: account.id,
        targetAccountId,
      },
      onSuccess() {
        toast.success('Password reset email triggered');
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const handleWorkspaceRestore = (workspaceId: string) => {
    restoreWorkspace({
      input: {
        type: 'admin.workspace.restore',
        accountId: account.id,
        workspaceId,
      },
      onSuccess() {
        toast.success('Workspace restored');
        workspacesQuery.refetch();
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const handleWorkspacePurge = (workspaceId: string) => {
    purgeWorkspace({
      input: {
        type: 'admin.workspace.purge',
        accountId: account.id,
        workspaceId,
      },
      onSuccess() {
        toast.success('Workspace purge scheduled');
        workspacesQuery.refetch();
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const isLoadingAccounts = accountsQuery.isLoading || accountsQuery.isFetching;
  const isLoadingWorkspaces =
    workspacesQuery.isLoading || workspacesQuery.isFetching;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'accounts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('accounts')}
          >
            Accounts
          </Button>
          <Button
            variant={activeTab === 'workspaces' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('workspaces')}
          >
            Workspaces
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'accounts' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => accountsQuery.refetch()}
            >
              Refresh
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => workspacesQuery.refetch()}
            >
              Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 overflow-auto">
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Accounts</h2>
              <Input
                placeholder="Search accounts"
                value={accountFilter}
                onChange={(event) => setAccountFilter(event.target.value)}
                className="max-w-sm"
              />
            </div>
            {isLoadingAccounts ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner className="mr-2" /> Loading accounts…
              </div>
            ) : (
              <AccountsTable
                accounts={filteredAccounts}
                disableActions={
                  isUpdatingServerRole ||
                  isUpdatingAccountStatus ||
                  isTriggeringReset
                }
                onRoleChange={handleServerRoleChange}
                onStatusChange={handleAccountStatusChange}
                onPasswordReset={handlePasswordReset}
              />
            )}
          </div>
        )}

        {activeTab === 'workspaces' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Workspaces</h2>
              <Input
                placeholder="Search workspaces"
                value={workspaceFilter}
                onChange={(event) => setWorkspaceFilter(event.target.value)}
                className="max-w-sm"
              />
            </div>
            {isLoadingWorkspaces ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner className="mr-2" /> Loading workspaces…
              </div>
            ) : (
              <WorkspacesTable
                workspaces={filteredWorkspaces}
                disableActions={isRestoringWorkspace || isPurgingWorkspace}
                onRestore={handleWorkspaceRestore}
                onPurge={handleWorkspacePurge}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface AccountsTableProps {
  accounts: AdminAccountSummary[];
  disableActions: boolean;
  onRoleChange: (id: string, role: ServerRole) => void;
  onStatusChange: (id: string, status: AccountStatus) => void;
  onPasswordReset: (id: string) => void;
}

const AccountsTable = ({
  accounts,
  disableActions,
  onRoleChange,
  onStatusChange,
  onPasswordReset,
}: AccountsTableProps) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-sidebar-border bg-sidebar/50">
      <table className="min-w-full divide-y divide-sidebar-border text-sm">
        <thead className="bg-sidebar">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Account</th>
            <th className="px-4 py-3 text-left font-medium">Server role</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
            <th className="px-4 py-3 text-left font-medium">Updated</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sidebar-border">
          {accounts.map((item) => (
            <tr key={item.id} className="hover:bg-sidebar/70">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.email}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <select
                  className="w-40 rounded border border-sidebar-border bg-background px-2 py-1 text-sm"
                  value={item.serverRole}
                  onChange={(event) =>
                    onRoleChange(item.id, event.target.value as ServerRole)
                  }
                  disabled={disableActions}
                >
                  <option value="administrator">Administrator</option>
                  <option value="member">Member</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  className="w-36 rounded border border-sidebar-border bg-background px-2 py-1 text-sm"
                  value={item.status}
                  onChange={(event) =>
                    onStatusChange(
                      item.id,
                      Number(event.target.value) as AccountStatus
                    )
                  }
                  disabled={disableActions}
                >
                  {Object.entries(accountStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disableActions}
                    onClick={() => onPasswordReset(item.id)}
                  >
                    Send reset
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {accounts.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-6 text-center text-sm text-muted-foreground"
              >
                No accounts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

interface WorkspacesTableProps {
  workspaces: AdminWorkspaceSummary[];
  disableActions: boolean;
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
}

const WorkspacesTable = ({
  workspaces,
  disableActions,
  onRestore,
  onPurge,
}: WorkspacesTableProps) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-sidebar-border bg-sidebar/50">
      <table className="min-w-full divide-y divide-sidebar-border text-sm">
        <thead className="bg-sidebar">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Workspace</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">API</th>
            <th className="px-4 py-3 text-left font-medium">Deleted at</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sidebar-border">
          {workspaces.map((item) => (
            <tr key={item.id} className="hover:bg-sidebar/70">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    item.status === WorkspaceStatus.Active
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-500'
                  )}
                >
                  {workspaceStatusLabels[item.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                {item.apiEnabled ? 'Enabled' : 'Disabled'}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={disableActions}
                    onClick={() => onRestore(item.id)}
                  >
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={disableActions}
                    onClick={() => onPurge(item.id)}
                  >
                    Purge
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {workspaces.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-6 text-center text-sm text-muted-foreground"
              >
                No workspaces found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
