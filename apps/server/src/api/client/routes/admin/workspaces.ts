import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import {
  ApiErrorCode,
  WorkspaceStatus,
  apiErrorOutputSchema,
  UserStatus,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { recordAuditLog } from '@colanode/server/lib/audit-logs';
import { jobService } from '@colanode/server/services/job-service';

const workspaceAdminSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  avatar: z.string().nullable(),
  apiEnabled: z.boolean(),
  status: z.nativeEnum(WorkspaceStatus),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

const workspaceAdminListSchema = z.array(workspaceAdminSummarySchema);

export const adminWorkspaceRoutes: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'GET',
    url: '/',
    schema: {
      response: {
        200: workspaceAdminListSchema,
      },
    },
    handler: async () => {
      const workspaces = await database
        .selectFrom('workspaces')
        .selectAll()
        .orderBy('created_at', 'asc')
        .execute();

      return workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        avatar: workspace.avatar,
        apiEnabled: workspace.api_enabled ?? false,
        status: workspace.status as WorkspaceStatus,
        deletedAt: workspace.deleted_at
          ? workspace.deleted_at.toISOString()
          : null,
        createdAt: workspace.created_at.toISOString(),
        updatedAt: workspace.updated_at
          ? workspace.updated_at.toISOString()
          : null,
      }));
    },
  });

  instance.route({
    method: 'POST',
    url: '/:workspaceId/restore',
    schema: {
      params: z.object({
        workspaceId: z.string(),
      }),
      response: {
        200: workspaceAdminSummarySchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const { workspaceId } = request.params;

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

      if (workspace.status === WorkspaceStatus.Active) {
        return reply.code(400).send({
          code: ApiErrorCode.BadRequest,
          message: 'Workspace is already active.',
        });
      }

      await database
        .updateTable('workspaces')
        .set({
          status: WorkspaceStatus.Active,
          deleted_at: null,
          updated_at: new Date(),
        })
        .where('id', '=', workspaceId)
        .execute();

      await database
        .updateTable('users')
        .set({ status: UserStatus.Active, updated_at: new Date() })
        .where('workspace_id', '=', workspaceId)
        .where('role', '!=', 'none')
        .where('status', '!=', UserStatus.Active)
        .execute();

      try {
        await jobService.removeJob(`workspace.clean.${workspaceId}`);
      } catch {
        // job may not exist; ignore
      }

      const restoredWorkspace = await database
        .selectFrom('workspaces')
        .selectAll()
        .where('id', '=', workspaceId)
        .executeTakeFirst();

      if (!restoredWorkspace) {
        return reply.code(404).send({
          code: ApiErrorCode.WorkspaceNotFound,
          message: 'Workspace not found.',
        });
      }

      await recordAuditLog({
        accountId: request.account.id,
        action: 'workspace.restore',
        resourceType: 'workspace',
        resourceId: workspaceId,
      });

      return {
        id: restoredWorkspace.id,
        name: restoredWorkspace.name,
        description: restoredWorkspace.description,
        avatar: restoredWorkspace.avatar,
        apiEnabled: restoredWorkspace.api_enabled ?? false,
        status: restoredWorkspace.status as WorkspaceStatus,
        deletedAt: restoredWorkspace.deleted_at
          ? restoredWorkspace.deleted_at.toISOString()
          : null,
        createdAt: restoredWorkspace.created_at.toISOString(),
        updatedAt: restoredWorkspace.updated_at
          ? restoredWorkspace.updated_at.toISOString()
          : null,
      };
    },
  });

  instance.route({
    method: 'POST',
    url: '/:workspaceId/purge',
    schema: {
      params: z.object({
        workspaceId: z.string(),
      }),
      response: {
        200: workspaceAdminSummarySchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const { workspaceId } = request.params;

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

      if (workspace.status === WorkspaceStatus.Active) {
        return reply.code(400).send({
          code: ApiErrorCode.BadRequest,
          message: 'Workspace must be inactive before purge.',
        });
      }

      const jobId = `workspace.clean.${workspaceId}`;
      try {
        await jobService.removeJob(jobId);
      } catch {
        // ignore if job missing
      }

      await jobService.addJob(
        {
          type: 'workspace.clean',
          workspaceId,
        },
        {
          jobId,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          delay: 0,
        }
      );

      await database
        .updateTable('workspaces')
        .set({ deleted_at: workspace.deleted_at ?? new Date(), updated_at: new Date() })
        .where('id', '=', workspaceId)
        .execute();

      const updatedWorkspace = await database
        .selectFrom('workspaces')
        .selectAll()
        .where('id', '=', workspaceId)
        .executeTakeFirst();

      if (!updatedWorkspace) {
        return reply.code(404).send({
          code: ApiErrorCode.WorkspaceNotFound,
          message: 'Workspace not found.',
        });
      }

      await recordAuditLog({
        accountId: request.account.id,
        action: 'workspace.purge',
        resourceType: 'workspace',
        resourceId: workspaceId,
      });

      return {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        description: updatedWorkspace.description,
        avatar: updatedWorkspace.avatar,
        apiEnabled: updatedWorkspace.api_enabled ?? false,
        status: updatedWorkspace.status as WorkspaceStatus,
        deletedAt: updatedWorkspace.deleted_at
          ? updatedWorkspace.deleted_at.toISOString()
          : null,
        createdAt: updatedWorkspace.created_at.toISOString(),
        updatedAt: updatedWorkspace.updated_at
          ? updatedWorkspace.updated_at.toISOString()
          : null,
      };
    },
  });

  done();
};
