import { Elysia, t } from "elysia";

import type { ChannelConfig } from "../services/notification/channels";
import { sendTestNotification } from "../services/notification/test";

export const notificationRoutes = new Elysia({
	prefix: "/api/notifications",
}).post(
	"/test",
	async ({ body }) => {
		const config = body.config as ChannelConfig;
		const result = await sendTestNotification(
			body.channelType,
			body.channelName,
			config,
		);
		return result;
	},
	{
		body: t.Object({
			channelId: t.String(),
			channelType: t.String(),
			channelName: t.String(),
			config: t.Record(
				t.String(),
				t.Union([t.String(), t.Record(t.String(), t.String()), t.Undefined()]),
			),
		}),
	},
);
