import { FastifyPluginCallback } from 'fastify';

import { accountAuthenticator } from '@colanode/server/api/client/plugins/account-auth';
import { adminAuthenticator } from '@colanode/server/api/client/plugins/admin-auth';

import { adminAccountRoutes } from './accounts';
import { adminWorkspaceRoutes } from './workspaces';

export const adminRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);
  instance.register(adminAuthenticator);

  instance.register(adminAccountRoutes, { prefix: '/accounts' });
  instance.register(adminWorkspaceRoutes, { prefix: '/workspaces' });

  done();
};
