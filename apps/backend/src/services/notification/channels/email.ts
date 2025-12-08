import nodemailer from "nodemailer";

import { logger } from "../../../utils/logger";
import type { ChannelConfig, NotificationPayload } from "./types";
import { getEventColor, validateSmtpConfig } from "./types";

export async function sendEmail(
	rawConfig: ChannelConfig,
	payload: NotificationPayload,
): Promise<void> {
	const config = validateSmtpConfig(rawConfig);
	const {
		email,
		smtpHost,
		smtpPort,
		smtpUser,
		smtpPassword,
		fromEmail,
		fromName,
	} = config;

	const transporter = nodemailer.createTransport({
		host: smtpHost,
		port: Number.parseInt(smtpPort, 10),
		secure: smtpPort === "465",
		auth: {
			user: smtpUser,
			pass: smtpPassword,
		},
	});

	const from = fromEmail
		? `${fromName ?? "UptimeBeacon"} <${fromEmail}>`
		: `${fromName ?? "UptimeBeacon"} <${smtpUser}>`;

	await transporter.sendMail({
		from,
		to: email,
		subject: payload.title,
		text: payload.message,
		html: formatHtmlEmail(payload),
	});

	logger.info(`SMTP email sent successfully to ${email}`);
}

function formatHtmlEmail(payload: NotificationPayload): string {
	const color = getEventColor(payload.event).css;

	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background: ${color}; padding: 20px; text-align: center;">
      <h1 style="margin: 0; color: #fff; font-size: 24px;">${payload.title}</h1>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px; color: #333; white-space: pre-line;">${payload.message}</p>
      <p style="margin: 0; color: #999; font-size: 14px;">Time: ${new Date(payload.timestamp).toLocaleString()}</p>
    </div>
    <div style="padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e5e5; text-align: center;">
      <p style="margin: 0; color: #666; font-size: 12px;">Sent by UptimeBeacon</p>
    </div>
  </div>
</body>
</html>`;
}
