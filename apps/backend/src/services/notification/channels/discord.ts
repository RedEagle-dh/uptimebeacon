import type { ChannelConfig, NotificationPayload } from "./types";
import { getEventColor, validateDiscordConfig } from "./types";

export async function sendDiscord(
	rawConfig: ChannelConfig,
	payload: NotificationPayload,
): Promise<void> {
	const config = validateDiscordConfig(rawConfig);

	await fetch(config.discordWebhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			embeds: [
				{
					title: payload.title,
					description: payload.message,
					color: getEventColor(payload.event).hex,
					timestamp: payload.timestamp,
					footer: { text: "UptimeBeacon" },
				},
			],
		}),
	});
}
