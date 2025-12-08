import type {
	ChannelConfig,
	NotificationPayload,
	RichNotificationPayload,
} from "./types";
import { validateWebhookConfig } from "./types";

export async function sendWebhook(
	rawConfig: ChannelConfig,
	payload: NotificationPayload | RichNotificationPayload,
): Promise<void> {
	const config = validateWebhookConfig(rawConfig);
	const method = config.webhookMethod ?? "POST";
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(config.webhookHeaders ?? {}),
	};

	// Send the full rich payload for maximum integration flexibility
	const isRichPayload = (
		p: NotificationPayload,
	): p is RichNotificationPayload => "monitor" in p;

	const body = isRichPayload(payload)
		? {
				title: payload.title,
				message: payload.message,
				event: payload.event,
				timestamp: payload.timestamp,
				monitor: payload.monitor,
				eventData: payload.eventData,
				incident: payload.incident,
			}
		: {
				title: payload.title,
				message: payload.message,
				event: payload.event,
				timestamp: payload.timestamp,
			};

	await fetch(config.webhookUrl, {
		method,
		headers,
		body: JSON.stringify(body),
	});
}
