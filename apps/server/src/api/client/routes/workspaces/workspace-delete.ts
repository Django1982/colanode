import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import {
  ApiErrorCode,
  apiErrorOutputSchema,
  workspaceOutputSchema,
  WorkspaceStatus,
  UserStatus,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { eventBus } from '@colanode/server/lib/event-bus';
import { jobService } from '@colanode/server/services/job-service';
import { config } from '@colanode/server/lib/config';

export const workspaceDeleteRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'DELETE',
    url: '/',
    schema: {
      params: z.object({
        workspaceId: z.string(),
      }),
      response: {
        200: workspaceOutputSchema,
        400: apiErrorOutputSchema,
        403: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const workspaceId = request.params.workspaceId;

      if (request.user.role !== 'owner') {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceDeleteNotAllowed,
          message:
            'You are not allowed to delete this workspace. Only owners can delete workspaces.',
        });
      }

      const workspace = await database
        .updateTable('workspaces')
        .set({
          status: WorkspaceStatus.Inactive,
          deleted_at: new Date(),
          updated_at: new Date(),
        })
        .where('id', '=', workspaceId)
        .where('status', '=', WorkspaceStatus.Active)
        .returningAll()
        .executeTakeFirst();

      if (!workspace) {
        return reply.code(404).send({
          code: ApiErrorCode.WorkspaceNotFound,
          message: 'Workspace not found.',
        });
      }

      await database
        .updateTable('users')
        .set({
          status: UserStatus.Removed,
          updated_at: new Date(),
        })
        .where('workspace_id', '=', workspaceId)
        .execute();

      const retentionMs = Math.max(
        config.workspace.retentionDays * 24 * 60 * 60 * 1000,
        0
      );

      await jobService.addJob(
        {
          type: 'workspace.clean',
          workspaceId: workspaceId,
        },
        {
          jobId: `workspace.clean.${workspaceId}`,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          delay: retentionMs,
        }
      );

      eventBus.publish({
        type: 'workspace.deleted',
        workspaceId: workspaceId,
      });

      return {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        avatar: workspace.avatar,
        apiEnabled: workspace.api_enabled ?? false,
        status: workspace.status as WorkspaceStatus,
        deletedAt: workspace.deleted_at?.toISOString() ?? null,
        user: {
          id: request.user.id,
          accountId: request.user.account_id,
          role: request.user.role,
          storageLimit: request.user.storage_limit,
          maxFileSize: request.user.max_file_size,
        },
      };
    },
  });

  done();
};
