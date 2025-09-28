import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import ms from 'ms';
import { z } from 'zod/v4';

import {
  AccountStatus,
  ApiErrorCode,
  IdType,
  apiErrorOutputSchema,
  emailPasswordResetCompleteOutputSchema,
  generateId,
  ServerRole,
  serverRoleSchema,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { recordAuditLog } from '@colanode/server/lib/audit-logs';
import { config } from '@colanode/server/lib/config';
import {
  AccountPasswordResetOtpAttributes,
  Otp,
  generateOtpCode,
  saveOtp,
} from '@colanode/server/lib/otps';
import { jobService } from '@colanode/server/services/job-service';

const accountSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  serverRole: serverRoleSchema,
  status: z.nativeEnum(AccountStatus),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

const accountListSchema = z.array(accountSummarySchema);

const serverRoleUpdateSchema = z.object({
  serverRole: serverRoleSchema,
});

const accountStatusUpdateSchema = z.object({
  status: z.nativeEnum(AccountStatus),
});

export const adminAccountRoutes: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'GET',
    url: '/',
    schema: {
      response: {
        200: accountListSchema,
      },
    },
    handler: async () => {
      const accounts = await database
        .selectFrom('accounts')
        .selectAll()
        .orderBy('created_at', 'asc')
        .execute();

      return accounts.map((account) => ({
        id: account.id,
        name: account.name,
        email: account.email,
        avatar: account.avatar,
        serverRole: account.server_role as ServerRole,
        status: account.status as AccountStatus,
        createdAt: account.created_at.toISOString(),
        updatedAt: account.updated_at ? account.updated_at.toISOString() : null,
      }));
    },
  });

  instance.route({
    method: 'PATCH',
    url: '/:accountId/server-role',
    schema: {
      params: z.object({
        accountId: z.string(),
      }),
      body: serverRoleUpdateSchema,
      response: {
        200: accountSummarySchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const { accountId } = request.params;
      const { serverRole } = request.body;

      if (request.account.id === accountId) {
        return reply.code(400).send({
          code: ApiErrorCode.BadRequest,
          message: 'You cannot change your own server role.',
        });
      }

      const account = await database
        .selectFrom('accounts')
        .selectAll()
        .where('id', '=', accountId)
        .executeTakeFirst();

      if (!account) {
        return reply.code(404).send({
          code: ApiErrorCode.AccountNotFound,
          message: 'Account not found.',
        });
      }

      if (account.server_role === serverRole) {
        return {
          id: account.id,
          name: account.name,
          email: account.email,
          avatar: account.avatar,
          serverRole: account.server_role as ServerRole,
          status: account.status as AccountStatus,
          createdAt: account.created_at.toISOString(),
          updatedAt: account.updated_at
            ? account.updated_at.toISOString()
            : null,
        };
      }

      if (account.server_role === 'administrator') {
        const remainingAdmins = await database
          .selectFrom('accounts')
          .select(({ fn }) => fn.count<string>('id').as('count'))
          .where('server_role', '=', 'administrator')
          .where('id', '!=', accountId)
          .executeTakeFirst();

        if (!remainingAdmins || Number(remainingAdmins.count) === 0) {
          return reply.code(400).send({
            code: ApiErrorCode.BadRequest,
            message: 'Cannot demote the last administrator.',
          });
        }
      }

      const updatedAccount = await database
        .updateTable('accounts')
        .set({
          server_role: serverRole,
          updated_at: new Date(),
        })
        .where('id', '=', accountId)
        .returningAll()
        .executeTakeFirst();

      if (!updatedAccount) {
        return reply.code(400).send({
          code: ApiErrorCode.BadRequest,
          message: 'Failed to update server role.',
        });
      }

      await recordAuditLog({
        accountId: request.account.id,
        action: 'account.server_role.update',
        resourceType: 'account',
        resourceId: accountId,
        metadata: {
          previous: account.server_role,
          next: updatedAccount.server_role,
        },
      });

      return {
        id: updatedAccount.id,
        name: updatedAccount.name,
        email: updatedAccount.email,
        avatar: updatedAccount.avatar,
        serverRole: updatedAccount.server_role as ServerRole,
        status: updatedAccount.status as AccountStatus,
        createdAt: updatedAccount.created_at.toISOString(),
        updatedAt: updatedAccount.updated_at
          ? updatedAccount.updated_at.toISOString()
          : null,
      };
    },
  });

  instance.route({
    method: 'PATCH',
    url: '/:accountId/status',
    schema: {
      params: z.object({
        accountId: z.string(),
      }),
      body: accountStatusUpdateSchema,
      response: {
        200: accountSummarySchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const { accountId } = request.params;
      const { status } = request.body;

      const account = await database
        .selectFrom('accounts')
        .selectAll()
        .where('id', '=', accountId)
        .executeTakeFirst();

      if (!account) {
        return reply.code(404).send({
          code: ApiErrorCode.AccountNotFound,
          message: 'Account not found.',
        });
      }

      const updatedAccount = await database
        .updateTable('accounts')
        .set({ status, updated_at: new Date() })
        .where('id', '=', accountId)
        .returningAll()
        .executeTakeFirst();

      if (!updatedAccount) {
        return reply.code(404).send({
          code: ApiErrorCode.AccountNotFound,
          message: 'Account not found.',
        });
      }

      await recordAuditLog({
        accountId: request.account.id,
        action: 'account.status.update',
        resourceType: 'account',
        resourceId: accountId,
        metadata: {
          previous: account.status,
          next: updatedAccount.status,
        },
      });

      return {
        id: updatedAccount.id,
        name: updatedAccount.name,
        email: updatedAccount.email,
        avatar: updatedAccount.avatar,
        serverRole: updatedAccount.server_role as ServerRole,
        status: updatedAccount.status as AccountStatus,
        createdAt: updatedAccount.created_at.toISOString(),
        updatedAt: updatedAccount.updated_at
          ? updatedAccount.updated_at.toISOString()
          : null,
      };
    },
  });

  instance.route({
    method: 'POST',
    url: '/:accountId/password-reset',
    schema: {
      params: z.object({
        accountId: z.string(),
      }),
      response: {
        200: emailPasswordResetCompleteOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const { accountId } = request.params;

      const account = await database
        .selectFrom('accounts')
        .selectAll()
        .where('id', '=', accountId)
        .executeTakeFirst();

      if (!account) {
        return reply.code(404).send({
          code: ApiErrorCode.AccountNotFound,
          message: 'Account not found.',
        });
      }

      const otpId = generateId(IdType.OtpCode);
      const expiresAt = new Date(
        Date.now() + ms(`${config.account.otpTimeout} seconds`)
      );
      const otpCode = generateOtpCode();

      const otp: Otp<AccountPasswordResetOtpAttributes> = {
        id: otpId,
        expiresAt,
        otp: otpCode,
        attributes: {
          accountId: account.id,
          attempts: 0,
        },
      };

      await saveOtp(otpId, otp);

      await jobService.addJob({
        type: 'email.password.reset.send',
        otpId,
      });

      await recordAuditLog({
        accountId: request.account.id,
        action: 'account.password.reset',
        resourceType: 'account',
        resourceId: accountId,
      });

      return {
        success: true,
      };
    },
  });

  done();
};
