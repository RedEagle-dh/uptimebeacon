import { Elysia } from "elysia";
import { healthRoutes } from "./health";
import { monitorRoutes } from "./monitors";
import { versionRoutes } from "./version";
import { webhookRoutes } from "./webhooks";

export const routes = new Elysia()
	.use(healthRoutes)
	.use(monitorRoutes)
	.use(versionRoutes)
	.use(webhookRoutes);
