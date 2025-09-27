import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { ApiErrorCode, ApiTokenScope, ApiTokenScopeValue } from '@colanode/core';
import {
  ApiTokenContext,
  requireScope,
  touchApiTokenLastUsed,
  verifyApiToken,
} from '@colanode/server/lib/api-tokens';

declare module 'fastify' {
  interface FastifyRequest {
    apiToken: ApiTokenContext | null;
    requireApiScope: (scope: ApiTokenScopeValue) => boolean;
  }
}

const statusForError = (code: ApiErrorCode): number => {
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

const apiTokenAuthenticatorCallback: FastifyPluginCallback = (
  fastify,
  _,
  done
) => {
  if (!fastify.hasRequestDecorator('apiToken')) {
    fastify.decorateRequest('apiToken', null as ApiTokenContext | null);
  }

  if (!fastify.hasRequestDecorator('requireApiScope')) {
    fastify.decorateRequest(
      'requireApiScope',
      ((_: ApiTokenScopeValue) => false) as (scope: ApiTokenScopeValue) => boolean
    );
  }

  fastify.addHook('onRequest', async (request, reply) => {
    const header = request.headers.authorization;

    if (!header) {
      const status = statusForError(ApiErrorCode.TokenMissing);
      return reply.code(status).send({
        code: ApiErrorCode.TokenMissing,
        message: 'Authorization header is required.',
      });
    }

    const token = header.startsWith('Bearer ')
      ? header.slice('Bearer '.length)
      : header;

    const result = await verifyApiToken(token);

    if (result.type === 'error') {
      const status = statusForError(result.code);
      return reply.code(status).send({
        code: result.code,
        message: result.message,
      });
    }

    request.apiToken = result.context;
    request.requireApiScope = (scope: ApiTokenScopeValue) =>
      requireScope(result.context, scope);

    void touchApiTokenLastUsed(result.context.token.id);
  });

  done();
};

export const apiTokenAuthenticator = fp(apiTokenAuthenticatorCallback);
export const WRITE_SCOPE = ApiTokenScope.Write;
export const READ_SCOPE = ApiTokenScope.Read;
