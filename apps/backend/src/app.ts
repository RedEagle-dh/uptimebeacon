import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { env } from "./env";
import { routes } from "./routes";
import { logger } from "./utils/logger";
import { websocketHandler } from "./websocket";

export const app = new Elysia()
	.use(
		cors({
			origin: env.FRONTEND_URL,
			credentials: true,
		}),
	)
	.onError(({ error, code, path }) => {
		logger.error(`Error [${code}] on ${path}:`, error);
		return {
			error: "Internal server error",
			code,
		};
	})
	.onRequest(({ request }) => {
		logger.debug(`${request.method} ${request.url}`);
	})
	// API routes
	.use(routes)
	// WebSocket handler
	.use(websocketHandler)
	// Root endpoint
	.get("/", () => ({
		name: "UptimeBeacon API",
		version: "0.1.0",
		status: "running",
	}));

// Export type for Eden Treaty
export type App = typeof app;
