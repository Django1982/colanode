import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import {
  ApiErrorCode,
  apiErrorOutputSchema,
  passwordRotateInputSchema,
  passwordRotateOutputSchema,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import {
  generatePasswordHash,
  validatePasswordStrength,
  verifyPassword,
} from '@colanode/server/lib/accounts';
import { recordAuditLog } from '@colanode/server/lib/audit-logs';
import { emailService } from '@colanode/server/services/email-service';

export const accountPasswordRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/password',
    schema: {
      body: passwordRotateInputSchema,
      response: {
        200: passwordRotateOutputSchema,
        400: apiErrorOutputSchema,
        401: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const input = request.body;

      const account = await database
        .selectFrom('accounts')
        .selectAll()
        .where('id', '=', request.account.id)
        .executeTakeFirst();

      if (!account || !account.password) {
        return reply.code(404).send({
          code: ApiErrorCode.AccountNotFound,
          message: 'Account not found.',
        });
      }

      const passwordMatches = await verifyPassword(
        input.currentPassword,
        account.password
      );

      if (!passwordMatches) {
        return reply.code(401).send({
          code: ApiErrorCode.Unauthorized,
          message: 'Current password is incorrect.',
        });
      }

      if (input.currentPassword === input.newPassword) {
        return reply.code(400).send({
          code: ApiErrorCode.BadRequest,
          message: 'New password must be different from the current password.',
        });
      }

      const passwordValidationError = validatePasswordStrength(input.newPassword);
      if (passwordValidationError) {
        return reply.code(400).send({
          code: ApiErrorCode.BadRequest,
          message: passwordValidationError,
        });
      }

      const hashedPassword = await generatePasswordHash(input.newPassword);

      await database
        .updateTable('accounts')
        .set({
          password: hashedPassword,
          updated_at: new Date(),
        })
        .where('id', '=', account.id)
        .execute();

      await database
        .deleteFrom('devices')
        .where('account_id', '=', account.id)
        .execute();

      await recordAuditLog({
        accountId: account.id,
        action: 'account.password.rotate',
        resourceType: 'account',
        resourceId: account.id,
      });

      await emailService.sendEmail({
        to: account.email,
        subject: 'Your Colanode password has been changed',
        html: `<!DOCTYPE html><html><body><p>Hi ${
          account.name ?? 'there'
        },</p><p>This is a confirmation that your Colanode password was changed on ${new Date().toUTCString()}.</p><p>If you did not perform this change, please contact your administrator immediately.</p></body></html>`,
      });

      return {
        success: true,
      };
    },
  });

  done();
};
