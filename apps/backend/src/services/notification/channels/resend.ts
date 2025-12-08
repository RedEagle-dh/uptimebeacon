import { logger } from "../../../utils/logger";
import type {
	ChannelConfig,
	NotificationPayload,
	RichNotificationPayload,
} from "./types";
import {
	getEventColor,
	getStatusEmoji,
	getStatusText,
	validateResendConfig,
} from "./types";

interface ResendErrorResponse {
	message?: string;
	name?: string;
}

export async function sendResend(
	rawConfig: ChannelConfig,
	payload: NotificationPayload | RichNotificationPayload,
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

// Format message with HTML (uses <strong>bold</strong>)
function formatHtmlMessage(payload: RichNotificationPayload): string {
	const emoji = getStatusEmoji(payload.event);
	const statusText = getStatusText(payload.event);

	let message = `${emoji} <strong>${payload.monitor.name}</strong> ${statusText}`;
	if (payload.monitor.url) {
		message += `<br>URL: <a href="${payload.monitor.url}">${payload.monitor.url}</a>`;
	}
	if (payload.eventData?.responseTime !== undefined) {
		message += `<br>Response time: ${payload.eventData.responseTime}ms`;
	}
	if (payload.eventData?.downtimeFormatted) {
		message += `<br>Downtime: ${payload.eventData.downtimeFormatted}`;
	}
	if (payload.incident) {
		message += `<br>Incident: ${payload.incident.title}`;
	}
	return message;
}

function formatHtmlEmail(
	payload: NotificationPayload | RichNotificationPayload,
): string {
	const color = getEventColor(payload.event).css;

	const isRichPayload = (
		p: NotificationPayload,
	): p is RichNotificationPayload => "monitor" in p;

	// Build details section for rich payloads
	let detailsHtml = "";
	let messageHtml = payload.message.replace(/\n/g, "<br>");

	if (isRichPayload(payload)) {
		// Use HTML-formatted message
		messageHtml = formatHtmlMessage(payload);

		const details: Array<{ label: string; value: string }> = [];

		if (payload.monitor.previousStatus) {
			details.push({
				label: "Previous Status",
				value: payload.monitor.previousStatus,
			});
		}
		details.push({
			label: "Current Status",
			value: payload.monitor.currentStatus,
		});

		if (payload.eventData?.responseTime !== undefined) {
			details.push({
				label: "Response Time",
				value: `${payload.eventData.responseTime}ms`,
			});
		}

		if (payload.eventData?.downtimeFormatted) {
			details.push({
				label: "Downtime Duration",
				value: payload.eventData.downtimeFormatted,
			});
		}

		if (payload.eventData?.sslDaysRemaining !== undefined) {
			details.push({
				label: "SSL Expiry",
				value: `${payload.eventData.sslDaysRemaining} days remaining`,
			});
		}

		if (details.length > 0) {
			detailsHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        ${details
					.map(
						(d) => `
          <tr>
            <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee; width: 40%;">${d.label}</td>
            <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #eee; font-weight: 500;">${d.value}</td>
          </tr>
        `,
					)
					.join("")}
      </table>`;
		}
	}

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
      <p style="margin: 0 0 16px; color: #333;">${messageHtml}</p>
      ${detailsHtml}
      <p style="margin: 16px 0 0; color: #999; font-size: 14px;">Time: ${new Date(payload.timestamp).toLocaleString()}</p>
    </div>
    <div style="padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e5e5; text-align: center;">
      <p style="margin: 0; color: #666; font-size: 12px;">Sent by UptimeBeacon</p>
    </div>
  </div>
</body>
</html>`;
}
