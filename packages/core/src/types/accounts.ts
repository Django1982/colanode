import { z } from 'zod/v4';

import {
  deviceTokenScopeSchema,
} from '@colanode/core/types/api';
import { workspaceOutputSchema } from '@colanode/core/types/workspaces';

export const serverRoleSchema = z.enum(['administrator', 'member']);

export type ServerRole = z.infer<typeof serverRoleSchema>;

export enum AccountStatus {
  Pending = 0,
  Active = 1,
  Unverified = 2,
}

export const accountOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().optional().nullable(),
  serverRole: serverRoleSchema,
});

export type AccountOutput = z.infer<typeof accountOutputSchema>;

export const accountUpdateInputSchema = z.object({
  name: z.string(),
  avatar: z.string().nullable().optional(),
});

export type AccountUpdateInput = z.infer<typeof accountUpdateInputSchema>;

export const accountUpdateOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
});

export type AccountUpdateOutput = z.infer<typeof accountUpdateOutputSchema>;

export const emailRegisterInputSchema = z.object({
  name: z.string({ error: 'Name is required' }),
  email: z.string({ error: 'Email is required' }).email({
    message: 'Invalid email address',
  }),
  password: z.string({ error: 'Password is required' }),
});

export type EmailRegisterInput = z.infer<typeof emailRegisterInputSchema>;

export const emailLoginInputSchema = z.object({
  email: z.string({ error: 'Email is required' }).email({
    message: 'Invalid email address',
  }),
  password: z.string({ error: 'Password is required' }),
});

export type EmailLoginInput = z.infer<typeof emailLoginInputSchema>;

export const loginSuccessOutputSchema = z.object({
  type: z.literal('success'),
  account: accountOutputSchema,
  workspaces: z.array(workspaceOutputSchema),
  scopes: z.array(deviceTokenScopeSchema),
  deviceId: z.string(),
  token: z.string(),
});

export type LoginSuccessOutput = z.infer<typeof loginSuccessOutputSchema>;

export const loginVerifyOutputSchema = z.object({
  type: z.literal('verify'),
  id: z.string(),
  expiresAt: z.date(),
});

export type LoginVerifyOutput = z.infer<typeof loginVerifyOutputSchema>;

export const loginOutputSchema = z.discriminatedUnion('type', [
  loginSuccessOutputSchema,
  loginVerifyOutputSchema,
]);

export type LoginOutput = z.infer<typeof loginOutputSchema>;

export const accountSyncOutputSchema = z.object({
  account: accountOutputSchema,
  workspaces: z.array(workspaceOutputSchema),
  token: z.string().optional(),
});

export type AccountSyncOutput = z.infer<typeof accountSyncOutputSchema>;

export const emailVerifyInputSchema = z.object({
  id: z.string(),
  otp: z.string(),
});

export type EmailVerifyInput = z.infer<typeof emailVerifyInputSchema>;

export const emailPasswordResetInitInputSchema = z.object({
  email: z.string().email(),
});

export type EmailPasswordResetInitInput = z.infer<
  typeof emailPasswordResetInitInputSchema
>;

export const emailPasswordResetCompleteInputSchema = z.object({
  id: z.string(),
  otp: z.string(),
  password: z.string(),
});

export type EmailPasswordResetCompleteInput = z.infer<
  typeof emailPasswordResetCompleteInputSchema
>;

export const emailPasswordResetInitOutputSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
});

export type EmailPasswordResetInitOutput = z.infer<
  typeof emailPasswordResetInitOutputSchema
>;

export const emailPasswordResetCompleteOutputSchema = z.object({
  success: z.boolean(),
});

export type EmailPasswordResetCompleteOutput = z.infer<
  typeof emailPasswordResetCompleteOutputSchema
>;

export const passwordRotateInputSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
});

export type PasswordRotateInput = z.infer<typeof passwordRotateInputSchema>;

export const passwordRotateOutputSchema = z.object({
  success: z.boolean(),
});

export type PasswordRotateOutput = z.infer<typeof passwordRotateOutputSchema>;

export const googleLoginInputSchema = z.object({
  code: z.string(),
});

export type GoogleLoginInput = z.infer<typeof googleLoginInputSchema>;
