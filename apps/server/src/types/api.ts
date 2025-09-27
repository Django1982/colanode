import { ServerRole } from '@colanode/core';

export type RequestAccount = {
  id: string;
  deviceId: string;
  serverRole: ServerRole;
};

export type ClientType = 'web' | 'desktop';

export type ClientContext = {
  ip: string;
  platform: string;
  version: string;
  type: ClientType;
};
