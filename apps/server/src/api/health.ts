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
      const redisOptional = config.redis.health.optional;
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

      const requiredChecks: Array<keyof typeof checks> = ['database', 'storage'];
      if (!redisOptional) {
        requiredChecks.push('redis');
      }

      const requiredHealthy = requiredChecks.every((key) => checks[key]);
      const redisDegraded = redisOptional && !checks.redis;
      const status = requiredHealthy && !redisDegraded ? 'ok' : 'degraded';
      const replyStatus = requiredHealthy ? 200 : 503;

      const payload: Record<string, unknown> = {
        status,
        time: new Date().toISOString(),
        version: config.server.version,
        sha: config.server.sha ?? null,
        checks,
      };

      if (redisOptional) {
        payload.optional = {
          redis: true,
        };
      }

      return reply.code(replyStatus).send(payload);
    },
  });

  done();
};
