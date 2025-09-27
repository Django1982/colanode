import { z } from 'zod/v4';

export const loggingConfigSchema = z.object({
  level: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .default('info'),
  audit: z
    .object({
      enabled: z.boolean().default(true),
      path: z.string().default('/var/log/colanode_audit.log'),
      retentionDays: z.number().int().min(1).default(30),
    })
    .default({
      enabled: true,
      path: '/var/log/colanode_audit.log',
      retentionDays: 30,
    }),
});

export type LoggingConfig = z.infer<typeof loggingConfigSchema>;

export const readLoggingConfigVariables = () => {
  const auditEnabled = process.env.LOGGING_AUDIT_ENABLED;
  const auditRetention = process.env.LOGGING_AUDIT_RETENTION_DAYS;

  return {
    level: process.env.LOGGING_LEVEL,
    audit: {
      enabled:
        auditEnabled === undefined ? undefined : auditEnabled === 'true',
      path: process.env.LOGGING_AUDIT_PATH,
      retentionDays:
        auditRetention === undefined ? undefined : Number(auditRetention),
    },
  };
};
