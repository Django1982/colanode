import { FastifyPluginCallback } from 'fastify';

import { accountRoutes } from '@colanode/server/api/client/routes/accounts';
import { adminRoutes } from '@colanode/server/api/client/routes/admin';
import { avatarRoutes } from '@colanode/server/api/client/routes/avatars';
import { socketRoutes } from '@colanode/server/api/client/routes/sockets';
import { workspaceRoutes } from '@colanode/server/api/client/routes/workspaces';

export const clientRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(socketRoutes, { prefix: '/sockets' });
  instance.register(accountRoutes, { prefix: '/accounts' });
  instance.register(avatarRoutes, { prefix: '/avatars' });
  instance.register(workspaceRoutes, { prefix: '/workspaces' });
  instance.register(adminRoutes, { prefix: '/admin' });

  done();
};
