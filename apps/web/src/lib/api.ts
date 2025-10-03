import ky from 'ky';

import { ServerConfig } from '@colanode/core';

export const api = {
  getServerConfig: async () => {
    try {
      const path = window.location.pathname;
      const prefixEnd = path.indexOf('/client');
      const basePath = prefixEnd > 0 ? path.slice(0, prefixEnd) : '';
      const url = basePath ? `${basePath}/config` : '/config';

      const response = await ky.get(url).json<ServerConfig>();
      return response;
    } catch (error) {
      console.error('Failed to fetch server config:', error);
      return null;
    }
  }
};
