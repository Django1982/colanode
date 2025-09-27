import { z } from 'zod/v4';

import { AccountStatus, serverRoleSchema } from './accounts';
import { WorkspaceStatus } from './workspaces';

export const adminAccountSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  serverRole: serverRoleSchema,
  status: z.nativeEnum(AccountStatus),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type AdminAccountSummary = z.infer<typeof adminAccountSummarySchema>;

export const adminWorkspaceSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  avatar: z.string().nullable(),
  apiEnabled: z.boolean(),
  status: z.nativeEnum(WorkspaceStatus),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type AdminWorkspaceSummary = z.infer<typeof adminWorkspaceSummarySchema>;
