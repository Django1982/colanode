import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { ApiErrorCode } from '@colanode/core';

const adminAuthenticatorCallback: FastifyPluginCallback = (
  fastify,
  _,
  done
) => {
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.account.serverRole !== 'administrator') {
      return reply.code(403).send({
        code: ApiErrorCode.Forbidden,
        message: 'Administrator privileges required.',
      });
    }
  });

  done();
};

export const adminAuthenticator = fp(adminAuthenticatorCallback);
