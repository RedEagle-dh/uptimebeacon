import type {
	ChannelConfig,
	NotificationPayload,
	RichNotificationPayload,
} from "./types";
import { getStatusEmoji, getStatusText, validateSlackConfig } from "./types";

// Format message with Slack mrkdwn (uses *bold* instead of **bold**)
function formatSlackMessage(payload: RichNotificationPayload): string {
	const emoji = getStatusEmoji(payload.event);
	const statusText = getStatusText(payload.event);

	let message = `${emoji} *${payload.monitor.name}* ${statusText}`;
	if (payload.monitor.url) message += `\nURL: <${payload.monitor.url}>`;
	if (payload.eventData?.responseTime !== undefined) {
		message += `\nResponse time: ${payload.eventData.responseTime}ms`;
	}
	if (payload.eventData?.downtimeFormatted) {
		message += `\nDowntime: ${payload.eventData.downtimeFormatted}`;
	}
	if (payload.incident) {
		message += `\nIncident: ${payload.incident.title}`;
	}
	return message;
}

export async function sendSlack(
	rawConfig: ChannelConfig,
	payload: NotificationPayload | RichNotificationPayload,
): Promise<void> {
	const config = validateSlackConfig(rawConfig);

	// Build fields array for rich data
	const fields: Array<{ title: string; value: string; short: boolean }> = [];

	const isRichPayload = (
		p: NotificationPayload,
	): p is RichNotificationPayload => "monitor" in p;

	let text = payload.message;

	if (isRichPayload(payload)) {
		// Use Slack-formatted message
		text = formatSlackMessage(payload);

		// Add status field
		fields.push({
			title: "Status",
			value: payload.monitor.currentStatus,
			short: true,
		});

		// Add response time if available
		if (payload.eventData?.responseTime !== undefined) {
			fields.push({
				title: "Response Time",
				value: `${payload.eventData.responseTime}ms`,
				short: true,
			});
		}

		// Add downtime duration for recovery
		if (payload.eventData?.downtimeFormatted) {
			fields.push({
				title: "Downtime",
				value: payload.eventData.downtimeFormatted,
				short: true,
			});
		}

		// Add SSL info for certificate events
		if (payload.eventData?.sslDaysRemaining !== undefined) {
			fields.push({
				title: "SSL Days Remaining",
				value: `${payload.eventData.sslDaysRemaining} days`,
				short: true,
			});
		}
	}

	await fetch(config.slackWebhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			attachments: [
				{
					color: payload.color,
					title: payload.title,
					text,
					fields: fields.length > 0 ? fields : undefined,
					ts: Math.floor(Date.now() / 1000),
				},
			],
		}),
	});
}
