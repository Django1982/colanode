import { useEffect, useMemo, useState } from 'react';
import { Building2, ClipboardList, Users, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  AdminAccountSummary,
  AdminWorkspaceSummary,
} from '@colanode/client/types/admin';
import { AccountStatus, ServerRole, WorkspaceStatus } from '@colanode/core';
import { AdminAuditLogEntry } from '@colanode/client/queries/admin/audit-logs-list';
import { SidebarHeader } from '@colanode/ui/components/layouts/sidebars/sidebar-header';
import { Button } from '@colanode/ui/components/ui/button';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useAccount } from '@colanode/ui/contexts/account';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { cn } from '@colanode/ui/lib/utils';
import { AdminAuditLogTable } from '@colanode/ui/components/layouts/sidebars/admin/admin-audit-log-table';

const accountStatusLabels: Record<AccountStatus, string> = {
  [AccountStatus.Pending]: 'Pending',
  [AccountStatus.Active]: 'Active',
  [AccountStatus.Unverified]: 'Unverified',
};

const workspaceStatusLabels: Record<WorkspaceStatus, string> = {
  [WorkspaceStatus.Active]: 'Active',
  [WorkspaceStatus.Inactive]: 'Inactive',
};

type AdminTab = 'accounts' | 'workspaces' | 'auditLogs';

interface AdminSection {
  key: AdminTab;
  label: string;
  icon: LucideIcon;
}

const ADMIN_SECTIONS: readonly [AdminSection, ...AdminSection[]] = [
  {
    key: 'accounts',
    label: 'Accounts',
    icon: Users,
  },
  {
    key: 'workspaces',
    label: 'Workspaces',
    icon: Building2,
  },
  {
    key: 'auditLogs',
    label: 'Audit Logs',
    icon: ClipboardList,
  },
];

interface AdminSettingsProps {
  initialTab?: AdminTab;
}

export const AdminSettings = ({ initialTab = 'accounts' }: AdminSettingsProps) => {
  const account = useAccount();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [accountFilter, setAccountFilter] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [auditWorkspaceFilter, setAuditWorkspaceFilter] = useState('');
  const [auditUserFilter, setAuditUserFilter] = useState('');
  const [auditCursor, setAuditCursor] = useState<string | null>(null);
  const [auditEntries, setAuditEntries] = useState<AdminAuditLogEntry[]>([]);

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

  const auditLogsQueryInput = useMemo(
    () => ({
      type: 'admin.audit-logs.list' as const,
      accountId: account.id,
      limit: 50,
      cursor: auditCursor,
      workspaceId: auditWorkspaceFilter.trim()
        ? auditWorkspaceFilter.trim()
        : undefined,
      userId: auditUserFilter.trim() ? auditUserFilter.trim() : undefined,
    }),
    [account.id, auditCursor, auditWorkspaceFilter, auditUserFilter]
  );

  const auditLogsQuery = useQuery(auditLogsQueryInput, {
    enabled: account.serverRole === 'administrator' && activeTab === 'auditLogs',
  });

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

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  useEffect(() => {
    if (!auditLogsQuery.data) {
      if (!auditCursor) {
        setAuditEntries([]);
      }
      return;
    }

    setAuditEntries((prev) => {
      if (auditCursor) {
        const existing = new Set(prev.map((entry) => entry.id));
        const next = [...prev];
        for (const entry of auditLogsQuery.data.entries) {
          if (!existing.has(entry.id)) {
            next.push(entry);
          }
        }
        return next;
      }

      return auditLogsQuery.data.entries;
    });
  }, [auditLogsQuery.data, auditCursor]);

  const resetAuditFilters = () => {
    setAuditCursor(null);
    setAuditEntries([]);
  };

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
    <div className="flex h-full overflow-hidden">
      <div className="flex w-60 min-w-[15rem] flex-col border-r border-sidebar-border bg-sidebar/80">
        <div className="px-4 py-4">
          <SidebarHeader title="Admin Settings" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 pb-4">
          {ADMIN_SECTIONS.map((section) => (
            <AdminSettingsNavItem
              key={section.key}
              label={section.label}
              icon={section.icon}
              active={activeTab === section.key}
              onClick={() => setActiveTab(section.key)}
            />
          ))}
        </nav>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
          <h2 className="text-lg font-semibold">
            {
              (
                ADMIN_SECTIONS.find((section) => section.key === activeTab) ??
                ADMIN_SECTIONS[0]
              ).label
            }
          </h2>
          <div className="flex items-center gap-2">
            {activeTab === 'accounts' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => accountsQuery.refetch()}
              >
                Refresh
              </Button>
            )}
            {activeTab === 'workspaces' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => workspacesQuery.refetch()}
              >
                Refresh
              </Button>
            )}
            {activeTab === 'auditLogs' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetAuditFilters();
                  auditLogsQuery.refetch();
                }}
              >
                Refresh
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-end gap-4">
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
              <div className="flex items-center justify-end gap-4">
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

          {activeTab === 'auditLogs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  placeholder="Filter by workspace id"
                  value={auditWorkspaceFilter}
                  onChange={(event) => {
                    setAuditWorkspaceFilter(event.target.value);
                    setAuditCursor(null);
                    setAuditEntries([]);
                  }}
                  className="w-48"
                />
                <Input
                  placeholder="Filter by user id"
                  value={auditUserFilter}
                  onChange={(event) => {
                    setAuditUserFilter(event.target.value);
                    setAuditCursor(null);
                    setAuditEntries([]);
                  }}
                  className="w-48"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAuditWorkspaceFilter('');
                    setAuditUserFilter('');
                    resetAuditFilters();
                    auditLogsQuery.refetch();
                  }}
                >
                  Reset filters
                </Button>
              </div>

              <AdminAuditLogTable
                entries={auditEntries}
                isLoading={
                  auditLogsQuery.isLoading || auditLogsQuery.isFetching
                }
                hasMore={Boolean(auditLogsQuery.data?.nextCursor)}
                onLoadMore={() => {
                  if (!auditLogsQuery.data?.nextCursor) {
                    return;
                  }
                  setAuditCursor(auditLogsQuery.data.nextCursor);
                }}
              />
            </div>
          )}
        </div>
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

interface AdminSettingsNavItemProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

const AdminSettingsNavItem = ({
  label,
  icon: Icon,
  active,
  onClick,
}: AdminSettingsNavItemProps) => {
  return (
    <button
      type="button"
      className={cn(
        'flex h-9 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
      onClick={onClick}
    >
      <Icon className="size-4" />
      <span className="truncate">{label}</span>
    </button>
  );
};
