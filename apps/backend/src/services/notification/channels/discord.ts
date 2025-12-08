import type {
	ChannelConfig,
	NotificationPayload,
	RichNotificationPayload,
} from "./types";
import {
	getEventColor,
	getStatusEmoji,
	getStatusText,
	validateDiscordConfig,
} from "./types";

// Format message with Discord markdown (uses **bold**)
function formatDiscordMessage(payload: RichNotificationPayload): string {
	const emoji = getStatusEmoji(payload.event);
	const statusText = getStatusText(payload.event);

	let message = `${emoji} **${payload.monitor.name}** ${statusText}`;
	if (payload.monitor.url) message += `\nURL: ${payload.monitor.url}`;
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

export async function sendDiscord(
	rawConfig: ChannelConfig,
	payload: NotificationPayload | RichNotificationPayload,
): Promise<void> {
	const config = validateDiscordConfig(rawConfig);

	// Build fields array for rich data
	const fields: Array<{ name: string; value: string; inline: boolean }> = [];

	const isRichPayload = (
		p: NotificationPayload,
	): p is RichNotificationPayload => "monitor" in p;

	let description = payload.message;

	if (isRichPayload(payload)) {
		// Use Discord-formatted message
		description = formatDiscordMessage(payload);

		// Add previous status if available
		if (payload.monitor.previousStatus) {
			fields.push({
				name: "Previous Status",
				value: payload.monitor.previousStatus,
				inline: true,
			});
		}

		// Add current status
		fields.push({
			name: "Current Status",
			value: payload.monitor.currentStatus,
			inline: true,
		});

		// Add response time if available
		if (payload.eventData?.responseTime !== undefined) {
			fields.push({
				name: "Response Time",
				value: `${payload.eventData.responseTime}ms`,
				inline: true,
			});
		}

		// Add downtime duration for recovery
		if (payload.eventData?.downtimeFormatted) {
			fields.push({
				name: "Downtime Duration",
				value: payload.eventData.downtimeFormatted,
				inline: true,
			});
		}

		// Add SSL info for certificate events
		if (payload.eventData?.sslDaysRemaining !== undefined) {
			fields.push({
				name: "SSL Expiry",
				value: `${payload.eventData.sslDaysRemaining} days remaining`,
				inline: true,
			});
		}
	}

	await fetch(config.discordWebhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			embeds: [
				{
					title: payload.title,
					description,
					color: getEventColor(payload.event).hex,
					fields: fields.length > 0 ? fields : undefined,
					timestamp: payload.timestamp,
					footer: { text: "UptimeBeacon" },
				},
			],
		}),
	});
}
