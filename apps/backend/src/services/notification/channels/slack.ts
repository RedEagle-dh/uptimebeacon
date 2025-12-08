import type { ChannelConfig, NotificationPayload } from "./types";
import { validateSlackConfig } from "./types";

export async function sendSlack(
	rawConfig: ChannelConfig,
	payload: NotificationPayload,
): Promise<void> {
	const config = validateSlackConfig(rawConfig);

	await fetch(config.slackWebhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			text: `${payload.title}\n\n${payload.message}`,
			attachments: [
				{
					color: payload.color,
					title: payload.title,
					text: payload.message,
					ts: Math.floor(Date.now() / 1000),
				},
			],
		}),
	});
}
