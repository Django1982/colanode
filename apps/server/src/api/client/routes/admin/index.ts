import { FastifyPluginCallback } from 'fastify';

import { accountAuthenticator } from '@colanode/server/api/client/plugins/account-auth';
import { adminAuthenticator } from '@colanode/server/api/client/plugins/admin-auth';

import { adminAuditLogsRoute } from './audit-logs';
import { adminAccountRoutes } from './accounts';
import { adminLogRoutes } from './logs';
import { adminTokensRoute } from './tokens';
import { adminWorkspaceRoutes } from './workspaces';

export const adminRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);
  instance.register(adminAuthenticator);

  instance.register(adminAccountRoutes, { prefix: '/accounts' });
  instance.register(adminWorkspaceRoutes, { prefix: '/workspaces' });
  instance.register(adminAuditLogsRoute, { prefix: '/audit-logs' });
  instance.register(adminLogRoutes, { prefix: '/logs' });
  instance.register(adminTokensRoute, { prefix: '/tokens' });

  done();
};
