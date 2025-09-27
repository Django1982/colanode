import { z } from 'zod/v4';

export const workspaceConfigSchema = z.object({
  storageLimit: z.string().optional().nullable(),
  maxFileSize: z.string().optional().nullable(),
  retentionDays: z.number().int().min(1).default(30),
});

export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;

export const readWorkspaceConfigVariables = () => {
  return {
    storageLimit: process.env.WORKSPACE_STORAGE_LIMIT,
    maxFileSize: process.env.WORKSPACE_MAX_FILE_SIZE,
    retentionDays: process.env.WORKSPACE_RETENTION_DAYS
      ? Number(process.env.WORKSPACE_RETENTION_DAYS)
      : undefined,
  };
};
