export type AdminAuditLogEntry = {
  id: string;
  workspaceId: string | null;
  userId: string | null;
  accountId: string | null;
  apiTokenId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AdminAuditLogsListQueryInput = {
  type: 'admin.audit-logs.list';
  accountId: string;
  limit?: number;
  cursor?: string | null;
  workspaceId?: string | null;
  userId?: string | null;
};

export type AdminAuditLogsListOutput = {
  entries: AdminAuditLogEntry[];
  nextCursor: string | null;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'admin.audit-logs.list': {
      input: AdminAuditLogsListQueryInput;
      output: AdminAuditLogsListOutput;
    };
  }
}
