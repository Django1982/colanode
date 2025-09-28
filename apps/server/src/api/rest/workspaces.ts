import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { ApiErrorCode, NodeAttributes } from '@colanode/core';
import {
  WRITE_SCOPE,
  apiTokenAuthenticator,
} from '@colanode/server/api/rest/plugins/api-token-auth';
import { database } from '@colanode/server/data/database';
import { recordAuditLog } from '@colanode/server/lib/audit-logs';

const workspaceSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  avatar: z.string().nullable(),
  apiEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

const workspaceListSchema = z.array(workspaceSummarySchema);

const documentSummarySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  type: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

const documentListSchema = z.array(documentSummarySchema);

const documentDetailSchema = documentSummarySchema.extend({
  content: z.any(),
});

const fileSummarySchema = z.object({
  id: z.string(),
  path: z.string(),
  mimeType: z.string(),
  size: z.number(),
  uploadedAt: z.string().nullable(),
  createdAt: z.string(),
  createdBy: z.string(),
});

const fileListSchema = z.array(fileSummarySchema);

const userSummarySchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  status: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

const userListSchema = z.array(userSummarySchema);

const workspaceUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    apiEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one property must be provided',
  });

const toWorkspaceSummary = (
  workspace: {
    id: string;
    name: string;
    description: string | null;
    avatar: string | null;
    api_enabled: boolean;
    created_at: Date;
    updated_at: Date | null;
  }
) => ({
  id: workspace.id,
  name: workspace.name,
  description: workspace.description,
  avatar: workspace.avatar,
  apiEnabled: workspace.api_enabled,
  createdAt: workspace.created_at.toISOString(),
  updatedAt: workspace.updated_at ? workspace.updated_at.toISOString() : null,
});

const readAttribute = (
  attributes: NodeAttributes,
  key: 'name' | 'type'
): string | null => {
  if (!attributes || typeof attributes !== 'object') {
    return null;
  }

  const value = (attributes as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
};

const toDocumentSummary = (
  item: {
    id: string;
    created_at: Date;
    updated_at: Date | null;
    attributes: NodeAttributes;
  }
) => ({
  id: item.id,
  name: readAttribute(item.attributes, 'name'),
  type: readAttribute(item.attributes, 'type') ?? 'unknown',
  createdAt: item.created_at.toISOString(),
  updatedAt: item.updated_at ? item.updated_at.toISOString() : null,
});

export const workspaceRestRoutes: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.register(apiTokenAuthenticator);

  instance.route({
    method: 'GET',
    url: '/workspaces',
    schema: {
      response: {
        200: workspaceListSchema,
      },
    },
    handler: async (request) => {
      const context = request.apiToken!;
      return [
        toWorkspaceSummary({
          id: context.workspace.id,
          name: context.workspace.name,
          description: context.workspace.description,
          avatar: context.workspace.avatar,
          api_enabled: context.workspace.api_enabled,
          created_at: context.workspace.created_at,
          updated_at: context.workspace.updated_at,
        }),
      ];
    },
  });

  instance.route({
    method: 'GET',
    url: '/workspaces/:workspaceId',
    schema: {
      params: z.object({ workspaceId: z.string() }),
      response: {
        200: workspaceSummarySchema,
        403: z.any(),
        404: z.any(),
      },
    },
    handler: async (request, reply) => {
      const context = request.apiToken!;
      const { workspaceId } = request.params;

      if (workspaceId !== context.workspace.id) {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceNoAccess,
          message: 'Token does not grant access to this workspace.',
        });
      }

      const workspace = await database
        .selectFrom('workspaces')
        .selectAll()
        .where('id', '=', workspaceId)
        .executeTakeFirst();

      if (!workspace) {
        return reply.code(404).send({
          code: ApiErrorCode.WorkspaceNotFound,
          message: 'Workspace not found.',
        });
      }

      return toWorkspaceSummary(workspace);
    },
  });

  instance.route({
    method: 'PATCH',
    url: '/workspaces/:workspaceId',
    schema: {
      params: z.object({ workspaceId: z.string() }),
      body: workspaceUpdateSchema,
      response: {
        200: workspaceSummarySchema,
        400: z.any(),
        403: z.any(),
        404: z.any(),
      },
    },
    handler: async (request, reply) => {
      const context = request.apiToken!;
      const { workspaceId } = request.params;

      if (workspaceId !== context.workspace.id) {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceNoAccess,
          message: 'Token does not grant access to this workspace.',
        });
      }

      if (!request.requireApiScope?.(WRITE_SCOPE)) {
        return reply.code(403).send({
          code: ApiErrorCode.TokenScopeMissing,
          message: 'Write access required for this operation.',
        });
      }

      const updateValues: Partial<{
        name: string;
        description: string | null;
        avatar: string | null;
        api_enabled: boolean;
      }> = {};

      if (Object.prototype.hasOwnProperty.call(request.body, 'name')) {
        updateValues.name = request.body.name!;
      }

      if (Object.prototype.hasOwnProperty.call(request.body, 'description')) {
        updateValues.description = request.body.description ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(request.body, 'avatar')) {
        updateValues.avatar = request.body.avatar ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(request.body, 'apiEnabled')) {
        updateValues.api_enabled = request.body.apiEnabled ?? false;
      }

      const hasUpdates = Object.keys(updateValues).length > 0;

      if (!hasUpdates) {
        return reply.code(400).send({
          code: ApiErrorCode.BadRequest,
          message: 'No updates provided.',
        });
      }

      await database
        .updateTable('workspaces')
        .set(updateValues)
        .where('id', '=', workspaceId)
        .execute();

      const workspace = await database
        .selectFrom('workspaces')
        .selectAll()
        .where('id', '=', workspaceId)
        .executeTakeFirst();

      if (workspace) {
        void recordAuditLog({
          workspaceId,
          userId: context.user.id,
          accountId: context.account.id,
          apiTokenId: context.token.id,
          action: 'workspace.updated',
          resourceType: 'workspace',
          resourceId: workspaceId,
          metadata: updateValues,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] ?? null,
        });
      }

      return workspace ? toWorkspaceSummary(workspace) : reply.code(404).send({
        code: ApiErrorCode.WorkspaceNotFound,
        message: 'Workspace not found after update.',
      });
    },
  });

  instance.route({
    method: 'GET',
    url: '/workspaces/:workspaceId/documents',
    schema: {
      params: z.object({ workspaceId: z.string() }),
      response: {
        200: documentListSchema,
        403: z.any(),
      },
    },
    handler: async (request, reply) => {
      const context = request.apiToken!;
      const { workspaceId } = request.params;

      if (workspaceId !== context.workspace.id) {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceNoAccess,
          message: 'Token does not grant access to this workspace.',
        });
      }

      const items = await database
        .selectFrom('documents')
        .innerJoin('nodes', 'nodes.id', 'documents.id')
        .select([
          'documents.id as id',
          'documents.created_at as created_at',
          'documents.updated_at as updated_at',
          'nodes.attributes as attributes',
        ])
        .where('documents.workspace_id', '=', workspaceId)
        .execute();

      return items.map(toDocumentSummary);
    },
  });

  instance.route({
    method: 'GET',
    url: '/workspaces/:workspaceId/documents/:documentId',
    schema: {
      params: z.object({
        workspaceId: z.string(),
        documentId: z.string(),
      }),
      response: {
        200: documentDetailSchema,
        403: z.any(),
        404: z.any(),
      },
    },
    handler: async (request, reply) => {
      const context = request.apiToken!;
      const { workspaceId, documentId } = request.params;

      if (workspaceId !== context.workspace.id) {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceNoAccess,
          message: 'Token does not grant access to this workspace.',
        });
      }

      const document = await database
        .selectFrom('documents')
        .innerJoin('nodes', 'nodes.id', 'documents.id')
        .select([
          'documents.id as id',
          'documents.created_at as created_at',
          'documents.updated_at as updated_at',
          'documents.content as content',
          'nodes.attributes as attributes',
        ])
        .where('documents.workspace_id', '=', workspaceId)
        .where('documents.id', '=', documentId)
        .executeTakeFirst();

      if (!document) {
        return reply.code(404).send({
          code: ApiErrorCode.NotFound,
          message: 'Document not found.',
        });
      }

      const summary = toDocumentSummary(document);

      return {
        ...summary,
        content: document.content,
      };
    },
  });

  instance.route({
    method: 'GET',
    url: '/workspaces/:workspaceId/files',
    schema: {
      params: z.object({ workspaceId: z.string() }),
      response: {
        200: fileListSchema,
        403: z.any(),
      },
    },
    handler: async (request, reply) => {
      const context = request.apiToken!;
      const { workspaceId } = request.params;

      if (workspaceId !== context.workspace.id) {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceNoAccess,
          message: 'Token does not grant access to this workspace.',
        });
      }

      const uploads = await database
        .selectFrom('uploads')
        .selectAll()
        .where('workspace_id', '=', workspaceId)
        .execute();

      return uploads.map((upload) => ({
        id: upload.file_id,
        path: upload.path,
        mimeType: upload.mime_type,
        size: upload.size,
        uploadedAt: upload.uploaded_at ? upload.uploaded_at.toISOString() : null,
        createdAt: upload.created_at.toISOString(),
        createdBy: upload.created_by,
      }));
    },
  });

  instance.route({
    method: 'GET',
    url: '/workspaces/:workspaceId/users',
    schema: {
      params: z.object({ workspaceId: z.string() }),
      response: {
        200: userListSchema,
        403: z.any(),
      },
    },
   handler: async (request, reply) => {
     const context = request.apiToken!;
     const { workspaceId } = request.params;

      if (workspaceId !== context.workspace.id) {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceNoAccess,
          message: 'Token does not grant access to this workspace.',
        });
      }

      const users = await database
        .selectFrom('users')
        .selectAll()
        .where('workspace_id', '=', workspaceId)
        .execute();

      return users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at ? user.updated_at.toISOString() : null,
      }));
    },
  });

  done();
};

export const workspaceRestRoutesSchema = {
  workspaceList: workspaceListSchema,
};
