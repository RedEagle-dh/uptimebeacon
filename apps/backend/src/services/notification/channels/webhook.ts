import type { ChannelConfig, NotificationPayload } from "./types";
import { validateWebhookConfig } from "./types";

interface MonitorData {
	id: string;
	name: string;
	url: string | null;
	status: string;
}

export async function sendWebhook(
	rawConfig: ChannelConfig,
	payload: NotificationPayload,
	extraData?: { monitor: MonitorData },
): Promise<void> {
	const config = validateWebhookConfig(rawConfig);
	const method = config.webhookMethod ?? "POST";
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(config.webhookHeaders ?? {}),
	};

	await fetch(config.webhookUrl, {
		method,
		headers,
		body: JSON.stringify({
			title: payload.title,
			message: payload.message,
			event: payload.event,
			timestamp: payload.timestamp,
			...extraData,
		}),
	});
}
