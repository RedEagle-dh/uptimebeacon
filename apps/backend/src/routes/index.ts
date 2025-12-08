import { Elysia } from "elysia";
import { healthRoutes } from "./health";
import { monitorRoutes } from "./monitors";
import { notificationRoutes } from "./notifications";
import { versionRoutes } from "./version";
import { webhookRoutes } from "./webhooks";

export const routes = new Elysia()
	.use(healthRoutes)
	.use(monitorRoutes)
	.use(notificationRoutes)
	.use(versionRoutes)
	.use(webhookRoutes);
