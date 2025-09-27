import { IdType, generateId } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { CreateAuditLog } from '@colanode/server/data/schema';
import { createLogger } from '@colanode/server/lib/logger';

const logger = createLogger('server:audit');

export type AuditLogInput = {
  workspaceId?: string | null;
  userId?: string | null;
  accountId?: string | null;
  apiTokenId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export const recordAuditLog = async (input: AuditLogInput): Promise<void> => {
  const values: CreateAuditLog = {
    id: generateId(IdType.AuditLog),
    workspace_id: input.workspaceId ?? null,
    user_id: input.userId ?? null,
    account_id: input.accountId ?? null,
    api_token_id: input.apiTokenId ?? null,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
    created_at: new Date(),
  };

  try {
    await database.insertInto('audit_logs').values(values).execute();
  } catch (error) {
    logger.warn({ error }, 'Failed to record audit log entry');
  }
};
