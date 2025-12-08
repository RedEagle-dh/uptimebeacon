import { logger } from "../../../utils/logger";
import type { ChannelConfig, NotificationPayload } from "./types";
import { getEventColor, validateResendConfig } from "./types";

interface ResendErrorResponse {
	message?: string;
	name?: string;
}

export async function sendResend(
	rawConfig: ChannelConfig,
	payload: NotificationPayload,
): Promise<void> {
	const config = validateResendConfig(rawConfig);
	const { resendApiKey, email, fromEmail, fromName } = config;

	const from = `${fromName ?? "UptimeBeacon"} <${fromEmail ?? "onboarding@resend.dev"}>`;

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${resendApiKey}`,
		},
		body: JSON.stringify({
			from,
			to: [email],
			subject: payload.title,
			text: payload.message,
			html: formatHtmlEmail(payload),
		}),
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch(() => ({}))) as ResendErrorResponse;
		logger.error("Resend API error:", error);
		throw new Error(
			`Failed to send email via Resend: ${error.message ?? response.statusText}`,
		);
	}

	logger.info(`Resend email sent successfully to ${email}`);
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
