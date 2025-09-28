import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';

import { AdminAuditLogEntry } from '@colanode/client/queries/admin/audit-logs-list';

interface AdminAuditLogTableProps {
  entries: AdminAuditLogEntry[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

export const AdminAuditLogTable = ({
  entries,
  isLoading,
  onLoadMore,
  hasMore,
}: AdminAuditLogTableProps) => {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-sidebar-border">
        <table className="min-w-full divide-y divide-sidebar-border text-sm">
          <thead className="bg-sidebar">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">Resource</th>
              <th className="px-4 py-3 text-left font-medium">Target IDs</th>
              <th className="px-4 py-3 text-left font-medium">IP</th>
              <th className="px-4 py-3 text-left font-medium">User agent</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sidebar-border">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-sidebar/70">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{entry.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.accountId ?? 'n/a'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {entry.resourceType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.resourceId ?? '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    <span>Workspace: {entry.workspaceId ?? '—'}</span>
                    <span>User: {entry.userId ?? '—'}</span>
                    <span>Token: {entry.apiTokenId ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {entry.ipAddress ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {entry.userAgent ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {entries.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  No audit entries recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <Separator className="flex-1" />
        <div className="flex items-center gap-2">
          {isLoading && <Spinner className="size-4" />}
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || isLoading}
            onClick={() => onLoadMore()}
          >
            Load more
          </Button>
        </div>
      </div>
    </div>
  );
};
