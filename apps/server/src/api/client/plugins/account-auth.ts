import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { ApiErrorCode, DeviceTokenScope } from '@colanode/core';
import { isDeviceApiRateLimited } from '@colanode/server/lib/rate-limits';
import { parseToken, verifyToken } from '@colanode/server/lib/tokens';
import { RequestAccount } from '@colanode/server/types/api';

declare module 'fastify' {
  interface FastifyRequest {
    account: RequestAccount;
  }
}

const isSafeMethod = (method: string): boolean => {
  const upper = method.toUpperCase();
  return upper === 'GET' || upper === 'HEAD' || upper === 'OPTIONS';
};

const isReadOnlyAllowedRoute = (method: string, url: string): boolean => {
  const path = url.split('?')[0] ?? url;
  const key = `${method.toUpperCase()} ${path}`;
  return (
    key === 'POST /client/v1/accounts/sync' ||
    key === 'POST /client/v1/sockets' ||
    key === 'DELETE /client/v1/accounts/logout'
  );
};

const accountAuthenticatorCallback: FastifyPluginCallback = (
  fastify,
  _,
  done
) => {
  if (!fastify.hasRequestDecorator('account')) {
    fastify.decorateRequest('account');
  }

  fastify.addHook('onRequest', async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth) {
      return reply.code(401).send({
        code: ApiErrorCode.TokenMissing,
        message: 'No token provided',
      });
    }

    const parts = auth.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (!token) {
      return reply.code(401).send({
        code: ApiErrorCode.TokenMissing,
        message: 'No token provided',
      });
    }

    const tokenData = parseToken(token);
    if (!tokenData) {
      return reply.code(401).send({
        code: ApiErrorCode.TokenInvalid,
        message: 'Token is invalid or expired',
      });
    }

    const isRateLimited = await isDeviceApiRateLimited(tokenData.deviceId);

    if (isRateLimited) {
      return reply.code(429).send({
        code: ApiErrorCode.TooManyRequests,
        message: 'Too many requests from this device. Please try again later.',
      });
    }

    const result = await verifyToken(tokenData);
    if (!result.authenticated) {
      return reply.code(401).send({
        code: ApiErrorCode.TokenInvalid,
        message: 'Token is invalid or expired',
      });
    }

    const hasApprovalFull = result.account.scopes.includes(
      DeviceTokenScope.ApprovalFull
    );

    if (
      !hasApprovalFull &&
      !isSafeMethod(request.method) &&
      !isReadOnlyAllowedRoute(request.method, request.url)
    ) {
      return reply.code(403).send({
        code: ApiErrorCode.TokenScopeMissing,
        message: 'Token scope does not allow this operation.',
      });
    }

    request.account = result.account;
  });

  done();
};

export const accountAuthenticator = fp(accountAuthenticatorCallback);
