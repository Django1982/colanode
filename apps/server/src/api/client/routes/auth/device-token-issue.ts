import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import {
  ApiErrorCode,
  ApiTokenScope,
  DeviceTokenScope,
  DeviceTokenScopeValue,
  apiErrorOutputSchema,
  deviceTokenScopeArraySchema,
  deviceTokenScopeSchema,
  generateId,
  IdType,
  trimString,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import {
  generateToken,
  normalizeDeviceScopes,
  parseToken,
  verifyToken,
} from '@colanode/server/lib/tokens';
import { verifyApiToken } from '@colanode/server/lib/api-tokens';
import { DeviceType } from '@colanode/server/types/devices';

const deviceTokenIssueBodySchema = z.object({
  scopes: deviceTokenScopeArraySchema.optional(),
  type: z.enum(['web', 'desktop']).optional(),
  platform: z.string().max(255).optional(),
  version: z.string().max(30).optional(),
});

const deviceTokenIssueResponseSchema = z.object({
  deviceId: z.string(),
  token: z.string(),
  scopes: z.array(deviceTokenScopeSchema),
});

const scopeError = {
  code: ApiErrorCode.TokenScopeMissing,
  message: 'Token scope does not allow issuing device tokens.',
} as const;

const unauthorized = {
  code: ApiErrorCode.TokenMissing,
  message: 'Authorization header is required.',
} as const;

const invalidToken = {
  code: ApiErrorCode.TokenInvalid,
  message: 'Token is invalid or expired.',
} as const;

const statusForApiTokenError = (
  code: ApiErrorCode
): 401 | 403 | 404 => {
  switch (code) {
    case ApiErrorCode.TokenMissing:
    case ApiErrorCode.TokenInvalid:
    case ApiErrorCode.TokenExpired:
    case ApiErrorCode.TokenRevoked:
      return 401;
    case ApiErrorCode.WorkspaceNotFound:
      return 404;
    default:
      return 403;
  }
};

const toDeviceType = (type: string | undefined): DeviceType =>
  type === 'desktop' ? DeviceType.Desktop : DeviceType.Web;

export const deviceTokenIssueRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/device-tokens',
    schema: {
      body: deviceTokenIssueBodySchema,
      response: {
        201: deviceTokenIssueResponseSchema,
        401: apiErrorOutputSchema,
        403: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const header = request.headers.authorization;

      if (!header) {
        return reply.code(401).send(unauthorized);
      }

      const token = header.startsWith('Bearer ')
        ? header.slice('Bearer '.length)
        : header;

      let accountId: string;
      let canIssueApprovalFull = false;

      if (token.startsWith('cnd_')) {
        const tokenData = parseToken(token);

        if (!tokenData) {
          return reply.code(401).send(invalidToken);
        }

        const result = await verifyToken(tokenData);

        if (!result.authenticated) {
          return reply.code(401).send(invalidToken);
        }

        const hasApprovalFull = result.account.scopes.includes(
          DeviceTokenScope.ApprovalFull
        );

        if (!hasApprovalFull) {
          return reply.code(403).send(scopeError);
        }

        accountId = result.account.id;
        canIssueApprovalFull = true;
      } else if (token.startsWith('cna_')) {
        const apiResult = await verifyApiToken(token);

        if (apiResult.type === 'error') {
          const status = statusForApiTokenError(apiResult.code);
          return reply.code(status).send({
            code: apiResult.code,
            message: apiResult.message,
          });
        }

        accountId = apiResult.context.account.id;
        canIssueApprovalFull = apiResult.context.scopes.has(ApiTokenScope.Write);
      } else {
        return reply.code(401).send(invalidToken);
      }

      const body = request.body;
      const desiredScopes = body.scopes ?? [DeviceTokenScope.ReadOnly];

      if (
        !canIssueApprovalFull &&
        desiredScopes.includes(DeviceTokenScope.ApprovalFull)
      ) {
        return reply.code(403).send(scopeError);
      }

      const scopes = normalizeDeviceScopes(desiredScopes as DeviceTokenScopeValue[]);
      const deviceId = generateId(IdType.Device);
      const { token: issuedToken, salt, hash } = generateToken(deviceId);

      await database
        .insertInto('devices')
        .values({
          id: deviceId,
          account_id: accountId,
          token_hash: hash,
          token_salt: salt,
          token_generated_at: new Date(),
          type: toDeviceType(body.type ?? request.client.type),
          version: body.version ?? request.client.version,
          platform: trimString(
            body.platform ?? request.client.platform,
            255
          ),
          ip: request.client.ip,
          created_at: new Date(),
          scopes,
        })
        .executeTakeFirst();

      return reply.code(201).send({
        deviceId,
        token: issuedToken,
        scopes,
      });
    },
  });

  done();
};
