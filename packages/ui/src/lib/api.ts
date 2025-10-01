export type CurrentServerInfo = {
  domain: string;
  configUrl: string;
};

const trimTrailingSlash = (value: string) => {
  if (value.length <= 1) {
    return value;
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const getCurrentServerInfo = (): CurrentServerInfo | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const { origin, pathname } = window.location;
  const clientIndex = pathname.indexOf('/client');
  const rawBasePath = clientIndex >= 0 ? pathname.slice(0, clientIndex) : pathname;
  const basePath = trimTrailingSlash(rawBasePath);
  const hasBasePath = basePath.length > 0 && basePath !== '/';
  const configPath = hasBasePath ? `${basePath}/config` : '/config';
  const configUrl = `${origin}${configPath}`;

  try {
    const domain = new URL(configUrl).host;
    return {
      domain,
      configUrl,
    };
  } catch (error) {
    console.error('Failed to resolve current server info', error);
    return null;
  }
};
