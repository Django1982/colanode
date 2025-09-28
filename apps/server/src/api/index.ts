import { FastifyPluginCallback } from 'fastify';

import { clientRoutes } from '@colanode/server/api/client/routes';
import { configGetRoute } from '@colanode/server/api/config';
import { healthRoutes } from '@colanode/server/api/health';
import { homeRoute } from '@colanode/server/api/home';
import { restRoutes } from '@colanode/server/api/rest';
import { config } from '@colanode/server/lib/config';

export const apiRoutes: FastifyPluginCallback = (instance, _, done) => {
  const prefix = config.server.pathPrefix ? `/${config.server.pathPrefix}` : '';

  instance.register(homeRoute, { prefix });
  instance.register(configGetRoute, { prefix });
  instance.register(clientRoutes, { prefix: `${prefix}/client/v1` });
  instance.register(restRoutes, { prefix: `${prefix}/rest/v1` });
  instance.register(healthRoutes);

  if (prefix) {
    instance.register(healthRoutes, { prefix });
  }

  done();
};
