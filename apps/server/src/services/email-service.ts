import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import nodemailer from 'nodemailer';

import { config } from '@colanode/server/lib/config';
import { createLogger } from '@colanode/server/lib/logger';

interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

const logger = createLogger('server:service:email');
const devOutboxPath =
  process.env.SMTP_DEV_OUTBOX ?? join(process.cwd(), 'tmp', 'emails');
let devOutboxReady = false;

const ensureDevOutbox = async () => {
  if (devOutboxReady) {
    return;
  }

  await mkdir(devOutboxPath, { recursive: true });
  devOutboxReady = true;
};

class EmailService {
  private transporter: nodemailer.Transporter | undefined;
  private from: string | undefined;

  public async init() {
    if (!config.smtp.enabled) {
      logger.debug('SMTP configuration is not set, skipping initialization');
      return;
    }

    this.from = `${config.smtp.from.name} <${config.smtp.from.email}>`;
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });

    await this.transporter.verify();
  }

  public async sendEmail(message: EmailMessage): Promise<void> {
    if (!this.transporter || !this.from) {
      await ensureDevOutbox();

      const fileName = `${Date.now()}-${randomUUID()}.json`;
      const filePath = join(devOutboxPath, fileName);
      const payload = {
        ...message,
        createdAt: new Date().toISOString(),
      };

      await writeFile(filePath, JSON.stringify(payload, null, 2) + '\n');
      logger.info({ path: filePath }, 'Queued email in dev outbox');
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      ...message,
    });
  }
}

export const emailService = new EmailService();
