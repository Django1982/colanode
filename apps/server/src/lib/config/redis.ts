import { z } from 'zod/v4';

export const redisConfigSchema = z.object({
  url: z.string({ error: 'REDIS_URL is required' }),
  db: z.coerce.number().default(0),
  health: z
    .object({
      optional: z.boolean().default(false),
    })
    .default({
      optional: false,
    }),
  jobs: z.object({
    name: z.string().optional().default('jobs'),
    prefix: z.string().optional().default('colanode'),
  }),
  tus: z.object({
    lockPrefix: z.string().optional().default('colanode:tus:lock'),
    kvPrefix: z.string().optional().default('colanode:tus:kv'),
  }),
  eventsChannel: z.string().optional().default('events'),
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;

export const readRedisConfigVariables = () => {
  return {
    url: process.env.REDIS_URL,
    db: process.env.REDIS_DB,
    health: {
      optional: process.env.REDIS_HEALTH_OPTIONAL === 'true',
    },
    jobs: {
      name: process.env.REDIS_JOBS_NAME,
      prefix: process.env.REDIS_JOBS_PREFIX,
    },
    tus: {
      lockPrefix: process.env.REDIS_TUS_LOCK_PREFIX,
      kvPrefix: process.env.REDIS_TUS_KV_PREFIX,
    },
    eventsChannel: process.env.REDIS_EVENTS_CHANNEL,
  };
};
