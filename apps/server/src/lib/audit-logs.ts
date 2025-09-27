import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import { IdType, generateId } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { CreateAuditLog } from '@colanode/server/data/schema';
import { config } from '@colanode/server/lib/config';
import { createLogger } from '@colanode/server/lib/logger';

const logger = createLogger('server:audit');
const ensuredDirectories = new Set<string>();

const ensureAuditDirectory = async (filePath: string) => {
  const directory = dirname(filePath);
  if (ensuredDirectories.has(directory)) {
    return;
  }

  await mkdir(directory, { recursive: true });
  ensuredDirectories.add(directory);
};

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

  if (!config.logging.audit.enabled) {
    return;
  }

  try {
    await ensureAuditDirectory(config.logging.audit.path);
    const fileEntry = {
      id: values.id,
      workspaceId: input.workspaceId ?? null,
      userId: input.userId ?? null,
      accountId: input.accountId ?? null,
      apiTokenId: input.apiTokenId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: values.created_at.toISOString(),
    };

    await appendFile(
      config.logging.audit.path,
      JSON.stringify(fileEntry) + '\n'
    );
  } catch (error) {
    logger.warn({ error }, 'Failed to append audit log file');
  }
};
