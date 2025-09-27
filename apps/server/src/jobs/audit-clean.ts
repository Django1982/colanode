import { readFile, writeFile } from 'node:fs/promises';

import { database } from '@colanode/server/data/database';
import { createLogger } from '@colanode/server/lib/logger';
import { config } from '@colanode/server/lib/config';
import { JobHandler } from '@colanode/server/jobs';

const logger = createLogger('server:job:audit-clean');

export type AuditLogCleanupInput = {
  type: 'audit.log.cleanup';
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    'audit.log.cleanup': {
      input: AuditLogCleanupInput;
    };
  }
}

export const auditLogCleanupHandler: JobHandler<AuditLogCleanupInput> = async () => {
  const retentionDays = config.logging.audit.retentionDays;
  const threshold = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  try {
    await database
      .deleteFrom('audit_logs')
      .where('created_at', '<', threshold)
      .execute();
  } catch (error) {
    logger.error(error, 'Failed to delete expired audit log records');
  }

  if (!config.logging.audit.enabled) {
    return;
  }

  try {
    const logPath = config.logging.audit.path;
    const content = await readFile(logPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const filteredLines: string[] = [];

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      try {
        const entry = JSON.parse(line) as { createdAt?: string; created_at?: string };
        const createdAt = entry.createdAt ?? entry.created_at;

        if (!createdAt) {
          continue;
        }

        const createdDate = new Date(createdAt);
        if (Number.isNaN(createdDate.getTime())) {
          continue;
        }

        if (createdDate >= threshold) {
          filteredLines.push(line);
        }
      } catch (error) {
        logger.warn({ error }, 'Failed to parse audit log line during cleanup');
      }
    }

    if (filteredLines.length === 0) {
      await writeFile(logPath, '');
      return;
    }

    await writeFile(logPath, filteredLines.join('\n') + '\n');
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return;
    }

    logger.error(error, 'Failed to prune audit log file');
  }
};
