import { sha256 } from 'js-sha256';

import {
  ApiErrorCode,
  ApiTokenScope,
  ApiTokenScopeValue,
  IdType,
  WorkspaceStatus,
  UserStatus,
  generateId,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import {
  CreateApiToken,
  SelectAccount,
  SelectApiToken,
  SelectUser,
  SelectWorkspace,
} from '@colanode/server/data/schema';
import { config } from '@colanode/server/lib/config';
import { uuid } from '@colanode/server/lib/utils';

const API_TOKEN_PREFIX = 'cna_';
const API_TOKEN_ID_LENGTH = generateId(IdType.ApiToken).length;
const TOKEN_PREFIX_VISIBLE_LENGTH = 12;
const MS_PER_DAY = 86_400_000;

export type ApiTokenSummary = {
  id: string;
  name: string;
  description: string | null;
  scopes: ApiTokenScopeValue[];
  tokenPrefix: string;
  expiresAt: Date | null;
  lastRotatedAt: Date | null;
  lastUsedAt: Date | null;
  disabledAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
};

export type ApiTokenContext = {
  token: SelectApiToken;
  workspace: SelectWorkspace;
  user: SelectUser;
  account: SelectAccount;
  scopes: Set<ApiTokenScopeValue>;
};

type VerifyTokenResult =
  | {
      type: 'ok';
      context: ApiTokenContext;
    }
  | {
      type: 'error';
      code: ApiErrorCode;
      message: string;
    };

const normalizeScopes = (
  scopes: ApiTokenScopeValue[] | undefined
): ApiTokenScopeValue[] => {
  const normalized = new Set<ApiTokenScopeValue>([
    ApiTokenScope.Read,
    ...(scopes ?? []),
  ]);

  return Array.from(normalized);
};

const clampExpiryDays = (expiresInDays: number): number => {
  return Math.min(Math.max(expiresInDays, 1), config.api.maxTokenExpiryDays);
};

const buildExpiryDate = (expiresInDays: number): Date => {
  const clamped = clampExpiryDays(expiresInDays);
  return new Date(Date.now() + clamped * MS_PER_DAY);
};

export const toApiTokenSummary = (token: SelectApiToken): ApiTokenSummary => ({
  id: token.id,
  name: token.name,
  description: token.description,
  scopes: (token.scopes as ApiTokenScopeValue[]) ?? [ApiTokenScope.Read],
  tokenPrefix: token.token_prefix,
  expiresAt: token.expires_at,
  lastRotatedAt: token.last_rotated_at,
  lastUsedAt: token.last_used_at,
  disabledAt: token.disabled_at,
  createdAt: token.created_at,
  createdBy: token.created_by,
});

const generateTokenSecret = (
  tokenId: string
): {
  token: string;
  salt: string;
  hash: string;
  prefix: string;
} => {
  const salt = uuid();
  const secret = uuid() + uuid();
  const hash = sha256(secret + salt);
  const token = API_TOKEN_PREFIX + tokenId + secret;
  const prefix = token.slice(0, TOKEN_PREFIX_VISIBLE_LENGTH);

  return {
    token,
    salt,
    hash,
    prefix,
  };
};

const parseApiToken = (
  token: string
): { tokenId: string; secret: string } | null => {
  if (!token || !token.startsWith(API_TOKEN_PREFIX)) {
    return null;
  }

  const value = token.slice(API_TOKEN_PREFIX.length);
  const tokenId = value.slice(0, API_TOKEN_ID_LENGTH);
  const secret = value.slice(API_TOKEN_ID_LENGTH);

  if (!tokenId || !secret) {
    return null;
  }

  return {
    tokenId,
    secret,
  };
};

const hashSecret = (secret: string, salt: string) => {
  return sha256(secret + salt);
};

export const createApiToken = async (
  input: {
    workspaceId: string;
    userId: string;
    name: string;
    description?: string | null;
    scopes?: ApiTokenScopeValue[];
    expiresInDays?: number | null;
    createdBy?: string | null;
  }
): Promise<{ token: string; record: SelectApiToken }> => {
  const tokenId = generateId(IdType.ApiToken);
  const secret = generateTokenSecret(tokenId);
  const now = new Date();
  const scopes = normalizeScopes(input.scopes);
  const expiryDays = input.expiresInDays
    ? clampExpiryDays(input.expiresInDays)
    : config.api.defaultTokenExpiryDays;
  const expiresAt = buildExpiryDate(expiryDays);

  const values: CreateApiToken = {
    id: tokenId,
    workspace_id: input.workspaceId,
    user_id: input.userId,
    name: input.name,
    description: input.description ?? null,
    scopes,
    token_prefix: secret.prefix,
    token_hash: secret.hash,
    token_salt: secret.salt,
    expires_at: expiresAt,
    last_rotated_at: now,
    last_used_at: null,
    disabled_at: null,
    created_at: now,
    created_by: input.createdBy ?? null,
  };

  const record = await database
    .insertInto('api_tokens')
    .values(values)
    .returningAll()
    .executeTakeFirst();

  if (!record) {
    throw new Error('Failed to create API token');
  }

  return {
    token: secret.token,
    record,
  };
};

export const listApiTokens = async (
  workspaceId: string,
  userId?: string
): Promise<ApiTokenSummary[]> => {
  let query = database
    .selectFrom('api_tokens')
    .selectAll()
    .where('workspace_id', '=', workspaceId)
    .orderBy('created_at', 'desc');

  if (userId) {
    query = query.where('user_id', '=', userId);
  }

  const tokens = await query.execute();

  return tokens.map(toApiTokenSummary);
};

export const rotateApiToken = async (
  tokenId: string,
  workspaceId: string,
  userId?: string,
  expiresInDays?: number | null
): Promise<{ token: string; record: SelectApiToken | undefined }> => {
  const secret = generateTokenSecret(tokenId);
  const expiresAt =
    expiresInDays && expiresInDays > 0
      ? buildExpiryDate(expiresInDays)
      : null;
  const now = new Date();

  let update = database
    .updateTable('api_tokens')
    .set((eb) => ({
      token_hash: secret.hash,
      token_salt: secret.salt,
      token_prefix: secret.prefix,
      last_rotated_at: now,
      expires_at: expiresAt ?? eb.ref('expires_at'),
      disabled_at: null,
    }))
    .where('id', '=', tokenId)
    .where('workspace_id', '=', workspaceId);

  if (userId) {
    update = update.where('user_id', '=', userId);
  }

  const result = await update.returningAll().executeTakeFirst();

  return {
    token: secret.token,
    record: result,
  };
};

export const disableApiToken = async (
  tokenId: string,
  workspaceId: string,
  userId?: string
): Promise<void> => {
  let update = database
    .updateTable('api_tokens')
    .set({ disabled_at: new Date() })
    .where('id', '=', tokenId)
    .where('workspace_id', '=', workspaceId);

  if (userId) {
    update = update.where('user_id', '=', userId);
  }

  await update.execute();
};

export const touchApiTokenLastUsed = async (tokenId: string): Promise<void> => {
  await database
    .updateTable('api_tokens')
    .set({ last_used_at: new Date() })
    .where('id', '=', tokenId)
    .execute();
};

const fetchWorkspace = async (
  workspaceId: string
): Promise<SelectWorkspace | undefined> => {
  return database
    .selectFrom('workspaces')
    .selectAll()
    .where('id', '=', workspaceId)
    .executeTakeFirst();
};

const fetchUser = async (
  userId: string
): Promise<SelectUser | undefined> => {
  return database.selectFrom('users').selectAll().where('id', '=', userId).executeTakeFirst();
};

const fetchAccount = async (
  accountId: string
): Promise<SelectAccount | undefined> => {
  return database
    .selectFrom('accounts')
    .selectAll()
    .where('id', '=', accountId)
    .executeTakeFirst();
};

export const verifyApiToken = async (token: string): Promise<VerifyTokenResult> => {
  const parsed = parseApiToken(token);
  if (!parsed) {
    return {
      type: 'error',
      code: ApiErrorCode.TokenInvalid,
      message: 'API token is invalid.',
    };
  }

  const record = await database
    .selectFrom('api_tokens')
    .selectAll()
    .where('id', '=', parsed.tokenId)
    .executeTakeFirst();

  if (!record) {
    return {
      type: 'error',
      code: ApiErrorCode.TokenInvalid,
      message: 'API token not found.',
    };
  }

  if (record.disabled_at) {
    return {
      type: 'error',
      code: ApiErrorCode.TokenRevoked,
      message: 'API token has been disabled.',
    };
  }

  if (record.expires_at && record.expires_at.getTime() < Date.now()) {
    return {
      type: 'error',
      code: ApiErrorCode.TokenExpired,
      message: 'API token has expired.',
    };
  }

  const computedHash = hashSecret(parsed.secret, record.token_salt);
  if (computedHash !== record.token_hash) {
    return {
      type: 'error',
      code: ApiErrorCode.TokenInvalid,
      message: 'API token secret mismatch.',
    };
  }

  const workspace = await fetchWorkspace(record.workspace_id);
  if (!workspace || workspace.status !== WorkspaceStatus.Active) {
    return {
      type: 'error',
      code: ApiErrorCode.WorkspaceNotFound,
      message: 'Workspace not found.',
    };
  }

  if (!workspace.api_enabled) {
    return {
      type: 'error',
      code: ApiErrorCode.WorkspaceApiNotEnabled,
      message: 'Workspace API access is disabled.',
    };
  }

  const user = await fetchUser(record.user_id);
  if (!user || user.status !== UserStatus.Active) {
    return {
      type: 'error',
      code: ApiErrorCode.TokenInvalid,
      message: 'API token owner is not active.',
    };
  }

  const account = await fetchAccount(user.account_id);
  if (!account) {
    return {
      type: 'error',
      code: ApiErrorCode.AccountNotFound,
      message: 'Account not found for API token.',
    };
  }

  const scopes = new Set<ApiTokenScopeValue>(
    (record.scopes as ApiTokenScopeValue[]) ?? [ApiTokenScope.Read]
  );

  return {
    type: 'ok',
    context: {
      token: record,
      workspace,
      user,
      account,
      scopes,
    },
  };
};

export const requireScope = (
  context: ApiTokenContext,
  scope: ApiTokenScopeValue
): boolean => {
  return context.scopes.has(scope);
};
