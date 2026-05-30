import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  onModuleInit() {
    this.transporter = this.createTransporter();
    if (!this.transporter) {
      this.logger.warn(
        'SMTP не настроен: задайте SMTP_USER и SMTP_PASS в .env (пароль приложения Gmail в кавычках). Письма будут только в логе.',
      );
      return;
    }

    void this.transporter
      .verify()
      .then(() => {
        this.logger.log(
          `SMTP подключён: ${process.env.SMTP_USER?.trim()}`,
        );
      })
      .catch((err: Error) => {
        this.transporter = null;
        this.logger.error(
          `SMTP ошибка авторизации: ${err.message}. Проверьте SMTP_USER и SMTP_PASS (пароль приложения Gmail).`,
        );
      });
  }

  private createTransporter(): Transporter | null {
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim().replace(/\s+/g, '');
    const service = process.env.SMTP_SERVICE?.trim().toLowerCase();
    const host = process.env.SMTP_HOST?.trim();

    if (!user || !pass) {
      return null;
    }

    if (service === 'gmail' || host === 'smtp.gmail.com') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    if (host) {
      return nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
        auth: { user, pass },
      });
    }

    return null;
  }

  async sendVerificationEmail(
    to: string,
    displayName: string,
    verificationUrl: string,
  ): Promise<void> {
    const from =
      process.env.MAIL_FROM?.trim().replace(/^"|"$/g, '') ??
      process.env.SMTP_USER?.trim() ??
      'noreply@localhost';

    const subject = 'Подтвердите ваш email';
    const text = [
      `Здравствуйте, ${displayName}!`,
      '',
      'Для завершения регистрации перейдите по ссылке:',
      verificationUrl,
      '',
      'Ссылка действительна ограниченное время. Если вы не регистрировались — проигнорируйте это письмо.',
    ].join('\n');

    const html = `
      <p>Здравствуйте, <strong>${displayName}</strong>!</p>
      <p>Для завершения регистрации нажмите кнопку ниже:</p>
      <p><a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Подтвердить email</a></p>
      <p>Или скопируйте ссылку в браузер:<br><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p style="color:#666;font-size:14px;">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[dev] Verification email for ${to}: ${verificationUrl}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, text, html });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      throw err;
    }
  }
}
