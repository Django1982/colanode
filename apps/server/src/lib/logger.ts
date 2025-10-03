import fs from 'node:fs';
import path from 'node:path';

import pino, { DestinationStream } from 'pino';

import { config } from '@colanode/server/lib/config';

export const createLogger = (name: string) => {
  const level = config.logging.level;
  const destination = resolveDestination();

  return pino(
    {
      level,
      name,
    },
    destination
  );
};

let cachedDestination: DestinationStream | undefined;
let fileSetupFailed = false;

const resolveDestination = (): DestinationStream => {
  if (cachedDestination) {
    return cachedDestination;
  }

  const consoleStream = pino.destination({ dest: 1, sync: false });
  const logPath = config.logging.server.path;

  if (!logPath) {
    cachedDestination = consoleStream;
    return cachedDestination;
  }

  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const fileStream = pino.destination({
      dest: logPath,
      append: true,
      sync: false,
    });

    const multi = pino.multistream([
      { stream: consoleStream },
      { stream: fileStream },
    ]);

    cachedDestination = multi as unknown as DestinationStream;
    return cachedDestination;
  } catch (error) {
    if (!fileSetupFailed) {
      console.error('Failed to initialize server log file', error);
      fileSetupFailed = true;
    }

    cachedDestination = consoleStream;
    return cachedDestination;
  }
};
