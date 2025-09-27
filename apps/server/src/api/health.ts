import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { FastifyPluginCallback } from 'fastify';

import { database } from '@colanode/server/data/database';
import { redis } from '@colanode/server/data/redis';
import { s3Client } from '@colanode/server/data/storage';
import { config } from '@colanode/server/lib/config';

export const healthRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.route({
    method: 'GET',
    url: '/health',
    handler: async (_, reply) => {
      const checks: Record<string, boolean> = {
        database: false,
        redis: false,
        storage: false,
      };

      try {
        await database.selectFrom('accounts').select('id').limit(1).executeTakeFirst();
        checks.database = true;
      } catch (error) {
        instance.log.error({ error }, 'Database health check failed');
      }

      try {
        await redis.ping();
        checks.redis = true;
      } catch (error) {
        instance.log.error({ error }, 'Redis health check failed');
      }

      try {
        const command = new HeadBucketCommand({ Bucket: config.storage.bucket });
        await s3Client.send(command);
        checks.storage = true;
      } catch (error) {
        instance.log.error({ error }, 'Storage health check failed');
      }

      const healthy = Object.values(checks).every((value) => value);

      return reply.code(healthy ? 200 : 503).send({
        status: healthy ? 'ok' : 'degraded',
        time: new Date().toISOString(),
        version: config.server.version,
        sha: config.server.sha ?? null,
        checks,
      });
    },
  });

  done();
};
