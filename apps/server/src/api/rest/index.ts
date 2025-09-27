import { FastifyPluginCallback } from 'fastify';

import { workspaceRestRoutes } from '@colanode/server/api/rest/workspaces';

export const restRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(workspaceRestRoutes);
  done();
};
