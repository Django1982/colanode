import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { ApiErrorCode } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import type { SelectAuditLog } from '@colanode/server/data/schema';

const auditLogEntrySchema = z.object({
  id: z.string(),
  workspaceId: z.string().nullable(),
  userId: z.string().nullable(),
  accountId: z.string().nullable(),
  apiTokenId: z.string().nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
});

const auditLogListResponseSchema = z.object({
  entries: z.array(auditLogEntrySchema),
  nextCursor: z.string().nullable(),
});

const auditLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  workspaceId: z.string().optional(),
  accountId: z.string().optional(),
  userId: z.string().optional(),
});

const normalizeMetadata = (
  value: SelectAuditLog['metadata']
): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  return null;
};

export const adminAuditLogsRoute: FastifyPluginCallbackZod = (instance, _, done) => {
  instance.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: auditLogQuerySchema,
      response: {
        200: auditLogListResponseSchema,
        400: z.any(),
      },
    },
    handler: async (request, reply) => {
      const { limit, cursor, workspaceId, accountId, userId } = request.query;

      let query = database
        .selectFrom('audit_logs')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(limit + 1);

      if (workspaceId) {
        query = query.where('workspace_id', '=', workspaceId);
      }

      if (accountId) {
        query = query.where('account_id', '=', accountId);
      }

      if (userId) {
        query = query.where('user_id', '=', userId);
      }

      if (cursor) {
        const cursorDate = new Date(cursor);
        if (Number.isNaN(cursorDate.getTime())) {
          return reply.code(400).send({
            code: ApiErrorCode.BadRequest,
            message: 'Invalid cursor provided.',
          });
        }

        query = query.where('created_at', '<', cursorDate);
      }

      const rows = await query.execute();

      const entries = rows.slice(0, limit).map((row) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        userId: row.user_id,
        accountId: row.account_id,
        apiTokenId: row.api_token_id,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        metadata: normalizeMetadata(row.metadata),
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at.toISOString(),
      }));

      let next: string | null = null;
      if (rows.length > limit) {
        const nextRow = rows[limit];
        if (nextRow) {
          next = nextRow.created_at.toISOString();
        }
      }

      return {
        entries,
        nextCursor: next,
      };
    },
  });

  done();
};
