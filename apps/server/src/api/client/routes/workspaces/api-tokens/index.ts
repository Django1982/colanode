import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { ApiErrorCode, apiTokenScopeSchema } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import {
  ApiTokenSummary,
  createApiToken,
  disableApiToken,
  listApiTokens,
  rotateApiToken,
  toApiTokenSummary,
} from '@colanode/server/lib/api-tokens';
import { recordAuditLog } from '@colanode/server/lib/audit-logs';
import { config } from '@colanode/server/lib/config';

const scopesInputSchema = z.array(apiTokenScopeSchema).nonempty().optional();

const expiryInputSchema = z
  .number()
  .int()
  .positive()
  .max(config.api.maxTokenExpiryDays)
  .optional();

const tokenSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  scopes: z.array(apiTokenScopeSchema),
  tokenPrefix: z.string(),
  expiresAt: z.string().nullable(),
  lastRotatedAt: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  disabledAt: z.string().nullable(),
  createdAt: z.string(),
  createdBy: z.string().nullable(),
});

const tokenListSchema = z.array(tokenSummarySchema);

const tokenCreateBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  scopes: scopesInputSchema,
  expiresInDays: expiryInputSchema,
});

const tokenRotateBodySchema = z.object({
  expiresInDays: expiryInputSchema,
});

const serializeSummary = (summary: ApiTokenSummary) => ({
  id: summary.id,
  name: summary.name,
  description: summary.description,
  scopes: summary.scopes,
  tokenPrefix: summary.tokenPrefix,
  expiresAt: summary.expiresAt ? summary.expiresAt.toISOString() : null,
  lastRotatedAt: summary.lastRotatedAt
    ? summary.lastRotatedAt.toISOString()
    : null,
  lastUsedAt: summary.lastUsedAt ? summary.lastUsedAt.toISOString() : null,
  disabledAt: summary.disabledAt ? summary.disabledAt.toISOString() : null,
  createdAt: summary.createdAt.toISOString(),
  createdBy: summary.createdBy,
});

const ensureWorkspaceAdmin = (role: string) => role === 'owner' || role === 'admin';

export const workspaceApiTokenRoutes: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'GET',
    url: '/',
    schema: {
      response: {
        200: tokenListSchema,
        403: z.any(),
      },
    },
    handler: async (request, reply) => {
      if (!ensureWorkspaceAdmin(request.user.role)) {
        return reply.code(403).send({
          code: ApiErrorCode.Forbidden,
          message: 'Only workspace admins can view API tokens.',
        });
      }

      const tokens = await listApiTokens(request.user.workspace_id, request.user.id);
      return tokens.map(serializeSummary);
    },
  });

  instance.route({
    method: 'POST',
    url: '/',
    schema: {
      body: tokenCreateBodySchema,
      response: {
        201: z.object({
          token: z.string(),
          apiToken: tokenSummarySchema,
        }),
        400: z.any(),
        403: z.any(),
        404: z.any(),
      },
    },
    handler: async (request, reply) => {
      if (!ensureWorkspaceAdmin(request.user.role)) {
        return reply.code(403).send({
          code: ApiErrorCode.Forbidden,
          message: 'Only workspace admins can create API tokens.',
        });
      }

      const workspace = await database
        .selectFrom('workspaces')
        .select(['id', 'api_enabled'])
        .where('id', '=', request.user.workspace_id)
        .executeTakeFirst();

      if (!workspace) {
        return reply.code(404).send({
          code: ApiErrorCode.WorkspaceNotFound,
          message: 'Workspace not found.',
        });
      }

      if (!workspace.api_enabled) {
        return reply.code(400).send({
          code: ApiErrorCode.WorkspaceApiNotEnabled,
          message: 'Enable workspace API access before creating tokens.',
        });
      }

      const { token, record } = await createApiToken({
        workspaceId: request.user.workspace_id,
        userId: request.user.id,
        name: request.body.name,
        description: request.body.description ?? null,
        scopes: request.body.scopes,
        expiresInDays: request.body.expiresInDays,
        createdBy: request.user.id,
      });

      const summary = serializeSummary(toApiTokenSummary(record));

      void recordAuditLog({
        workspaceId: request.user.workspace_id,
        userId: request.user.id,
        accountId: request.user.account_id,
        apiTokenId: record.id,
        action: 'api_token.created',
        resourceType: 'api_token',
        resourceId: record.id,
        metadata: {
          name: record.name,
          scopes: record.scopes,
          expiresAt: record.expires_at?.toISOString() ?? null,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      });

      return reply.code(201).send({
        token,
        apiToken: summary,
      });
    },
  });

  instance.route({
    method: 'POST',
    url: '/:tokenId/rotate',
    schema: {
      params: z.object({ tokenId: z.string() }),
      body: tokenRotateBodySchema,
      response: {
        200: z.object({
          token: z.string(),
          apiToken: tokenSummarySchema,
        }),
        403: z.any(),
        404: z.any(),
      },
    },
    handler: async (request, reply) => {
      if (!ensureWorkspaceAdmin(request.user.role)) {
        return reply.code(403).send({
          code: ApiErrorCode.Forbidden,
          message: 'Only workspace admins can rotate API tokens.',
        });
      }

      const { tokenId } = request.params;

      const { token, record } = await rotateApiToken(
        tokenId,
        request.user.workspace_id,
        request.user.id,
        request.body.expiresInDays
      );

      if (!record) {
        return reply.code(404).send({
          code: ApiErrorCode.NotFound,
          message: 'API token not found.',
        });
      }

      const summary = serializeSummary(toApiTokenSummary(record));

      void recordAuditLog({
        workspaceId: request.user.workspace_id,
        userId: request.user.id,
        accountId: request.user.account_id,
        apiTokenId: record.id,
        action: 'api_token.rotated',
        resourceType: 'api_token',
        resourceId: record.id,
        metadata: {
          expiresAt: record.expires_at?.toISOString() ?? null,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      });

      return reply.send({
        token,
        apiToken: summary,
      });
    },
  });

  instance.route({
    method: 'DELETE',
    url: '/:tokenId',
    schema: {
      params: z.object({ tokenId: z.string() }),
      response: {
        204: z.undefined(),
        403: z.any(),
      },
    },
    handler: async (request, reply) => {
      if (!ensureWorkspaceAdmin(request.user.role)) {
        return reply.code(403).send({
          code: ApiErrorCode.Forbidden,
          message: 'Only workspace admins can revoke API tokens.',
        });
      }

      const { tokenId } = request.params;

      await disableApiToken(tokenId, request.user.workspace_id, request.user.id);

      void recordAuditLog({
        workspaceId: request.user.workspace_id,
        userId: request.user.id,
        accountId: request.user.account_id,
        apiTokenId: tokenId,
        action: 'api_token.disabled',
        resourceType: 'api_token',
        resourceId: tokenId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      });

      return reply.code(204).send();
    },
  });

  done();
};
