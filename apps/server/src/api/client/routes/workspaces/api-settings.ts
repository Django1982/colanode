import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { ApiErrorCode } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { recordAuditLog } from '@colanode/server/lib/audit-logs';

const apiSettingsSchema = z.object({
  apiEnabled: z.boolean(),
});

const ensureWorkspaceOwner = (role: string) => role === 'owner';

export const workspaceApiSettingsRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'PATCH',
    url: '/',
    schema: {
      body: apiSettingsSchema,
      response: {
        200: apiSettingsSchema,
        400: z.any(),
        403: z.any(),
      },
    },
    handler: async (request, reply) => {
      if (!ensureWorkspaceOwner(request.user.role)) {
        return reply.code(403).send({
          code: ApiErrorCode.Forbidden,
          message: 'Only workspace owners can update API settings.',
        });
      }

      await database
        .updateTable('workspaces')
        .set({ api_enabled: request.body.apiEnabled })
        .where('id', '=', request.user.workspace_id)
        .execute();

      void recordAuditLog({
        workspaceId: request.user.workspace_id,
        userId: request.user.id,
        accountId: request.user.account_id,
        action: request.body.apiEnabled
          ? 'workspace.api_enabled'
          : 'workspace.api_disabled',
        resourceType: 'workspace',
        resourceId: request.user.workspace_id,
        metadata: { apiEnabled: request.body.apiEnabled },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      });

      return {
        apiEnabled: request.body.apiEnabled,
      };
    },
  });

  done();
};
