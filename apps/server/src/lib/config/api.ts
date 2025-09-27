import { z } from 'zod/v4';

export const apiConfigSchema = z.object({
  defaultTokenExpiryDays: z.coerce.number().int().positive().default(180),
  maxTokenExpiryDays: z.coerce.number().int().positive().default(365),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;

export const readApiConfigVariables = () => {
  return {
    defaultTokenExpiryDays: process.env.API_TOKEN_DEFAULT_EXPIRY_DAYS,
    maxTokenExpiryDays: process.env.API_TOKEN_MAX_EXPIRY_DAYS,
  };
};
