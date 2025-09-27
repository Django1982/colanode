import { z } from 'zod/v4';

import { build } from '@colanode/core';

const serverModeSchema = z.enum(['standalone', 'cluster']);
export type ServerMode = z.infer<typeof serverModeSchema>;

export const serverConfigSchema = z.object({
  version: z.string().default(build.version),
  sha: z.string().default(build.sha),
  name: z.string().default('Colanode Server'),
  avatar: z.string().optional(),
  mode: serverModeSchema.default('standalone'),
  pathPrefix: z.string().optional(),
  cors: z.object({
    origin: z.string().default('http://localhost:4000'),
    maxAge: z.coerce.number().default(7200),
  }),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export const readServerConfigVariables = () => {
  const version = process.env.SERVER_VERSION ?? build.version;
  const sha = process.env.SERVER_SHA ?? build.sha;
  const name = process.env.SERVER_NAME ?? 'Colanode Server';
  return {
    version,
    sha,
    name,
    avatar: process.env.SERVER_AVATAR,
    mode: process.env.SERVER_MODE,
    pathPrefix: process.env.SERVER_PATH_PREFIX,
    cors: {
      origin: process.env.SERVER_CORS_ORIGIN,
      maxAge: process.env.SERVER_CORS_MAX_AGE,
    },
  };
};
