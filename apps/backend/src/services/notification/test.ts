import { logger } from "../../utils/logger";
import {
	type ChannelConfig,
	type NotificationPayload,
	sendDiscord,
	sendEmail,
	sendResend,
	sendSlack,
	sendTelegram,
	sendWebhook,
} from "./channels";

function createTestPayload(): NotificationPayload {
	return {
		title: "Test Notification",
		message:
			"This is a test notification from UptimeBeacon.\n\nYour notifications are configured correctly!",
		event: "up",
		color: "good",
		timestamp: new Date().toISOString(),
	};
}

export async function sendTestNotification(
	channelType: string,
	channelName: string,
	config: ChannelConfig,
): Promise<{ success: boolean; message: string }> {
	logger.info(
		`Sending test notification for ${channelType} channel: ${channelName}`,
	);

	const payload = createTestPayload();

	try {
		switch (channelType) {
			case "EMAIL":
				await sendEmail(config, payload);
				break;
			case "RESEND":
				await sendResend(config, payload);
				break;
			case "SLACK":
				await sendSlack(config, payload);
				break;
			case "DISCORD":
				await sendDiscord(config, payload);
				break;
			case "TELEGRAM":
				await sendTelegram(config, payload);
				break;
			case "WEBHOOK":
				await sendWebhook(config, payload, {
					monitor: {
						id: "test",
						name: "Test Monitor",
						url: "https://example.com",
						status: "UP",
					},
				});
				break;
			default:
				throw new Error(`Unknown channel type: ${channelType}`);
		}

		logger.info(
			`Test notification sent successfully for ${channelType} channel: ${channelName}`,
		);
		return { success: true, message: "Test notification sent successfully" };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error(
			`Test notification failed for ${channelType} channel ${channelName}: ${errorMessage}`,
		);
		throw new Error(`Failed to send test notification: ${errorMessage}`);
	}
}
