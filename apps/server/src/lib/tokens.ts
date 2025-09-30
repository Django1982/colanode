import { sha256 } from 'js-sha256';

import { DeviceTokenScope, DeviceTokenScopeValue, ServerRole } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { uuid } from '@colanode/server/lib/utils';
import { RequestAccount } from '@colanode/server/types/api';

const DEVICE_TOKEN_PREFIX = 'cnd_';

interface GenerateTokenResult {
  token: string;
  salt: string;
  hash: string;
}

interface TokenData {
  deviceId: string;
  secret: string;
}

type VerifyTokenResult =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      account: RequestAccount;
    };

const DEFAULT_DEVICE_SCOPE: DeviceTokenScopeValue = DeviceTokenScope.ApprovalFull;
const DEVICE_SCOPE_ORDER: readonly DeviceTokenScopeValue[] = [
  DeviceTokenScope.ApprovalFull,
  DeviceTokenScope.ReadOnly,
];

export const normalizeDeviceScopes = (
  scopes?: DeviceTokenScopeValue[] | null
): DeviceTokenScopeValue[] => {
  if (!scopes || scopes.length === 0) {
    return [DEFAULT_DEVICE_SCOPE];
  }

  if (scopes.includes(DeviceTokenScope.ApprovalFull)) {
    return [DeviceTokenScope.ApprovalFull];
  }

  const uniqueScopes = new Set(scopes);

  return DEVICE_SCOPE_ORDER.filter((scope) => uniqueScopes.has(scope));
};

export const generateToken = (deviceId: string): GenerateTokenResult => {
  const salt = uuid();
  const secret = uuid() + uuid();
  const hash = sha256(secret + salt);
  const token = DEVICE_TOKEN_PREFIX + deviceId + secret;

  return {
    token,
    salt,
    hash,
  };
};

export const parseToken = (token: string): TokenData | null => {
  if (!token.startsWith(DEVICE_TOKEN_PREFIX)) {
    return null;
  }

  const tokenWithoutPrefix = token.slice(DEVICE_TOKEN_PREFIX.length);
  const deviceId = tokenWithoutPrefix.slice(0, 28);
  const secret = tokenWithoutPrefix.slice(28);
  return {
    deviceId,
    secret,
  };
};

export const verifyToken = async (
  tokenData: TokenData
): Promise<VerifyTokenResult> => {
  const device = await database
    .selectFrom('devices')
    .selectAll()
    .where('id', '=', tokenData.deviceId)
    .executeTakeFirst();

  if (!device) {
    return {
      authenticated: false,
    };
  }

  if (!verifySecret(tokenData.secret, device.token_salt, device.token_hash)) {
    return {
      authenticated: false,
    };
  }

  const account = await database
    .selectFrom('accounts')
    .select(['id', 'server_role'])
    .where('id', '=', device.account_id)
    .executeTakeFirst();

  if (!account) {
    return {
      authenticated: false,
    };
  }

  return {
    authenticated: true,
    account: {
      id: account.id,
      deviceId: device.id,
      serverRole: account.server_role as ServerRole,
      scopes: normalizeDeviceScopes(device.scopes as DeviceTokenScopeValue[] | null),
    },
  };
};

const verifySecret = (secret: string, salt: string, hash: string): boolean => {
  const computedHash = sha256(secret + salt);
  return computedHash === hash;
};
